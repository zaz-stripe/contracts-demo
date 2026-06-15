import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type OpenAIChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

// Simple token estimator (~4 chars per token for English)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  return `${(bytes / 1024).toFixed(1)}KB`
}

export async function POST(req: Request) {
  const startTime = performance.now()
  const requestId = Math.random().toString(36).slice(2, 8)

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = body as Partial<{ messages: OpenAIChatMessage[]; model?: string; stream?: boolean }>
  const messages = parsed.messages
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing messages[]" }, { status: 400 })
  }

  const model = typeof parsed.model === "string" && parsed.model.trim() ? parsed.model.trim() : "gpt-4o"
  const shouldStream = parsed.stream === true

  // Calculate token estimates for logging
  const systemMessage = messages.find(m => m.role === "system")
  const userMessages = messages.filter(m => m.role === "user")
  const lastUserMessage = userMessages[userMessages.length - 1]

  const systemTokens = systemMessage ? estimateTokens(systemMessage.content) : 0
  const totalInputTokens = messages.reduce((sum, m) => sum + estimateTokens(m.content), 0)
  const payloadSize = JSON.stringify({ model, messages }).length

  console.log(`\n[AI:${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`[AI:${requestId}] 📤 REQUEST${shouldStream ? ' (streaming)' : ''}`)
  console.log(`[AI:${requestId}]    Model: ${model}`)
  console.log(`[AI:${requestId}]    Messages: ${messages.length} (system: ${systemMessage ? 1 : 0}, user: ${userMessages.length})`)
  console.log(`[AI:${requestId}]    Tokens (est): ${totalInputTokens} total, ${systemTokens} system prompt`)
  console.log(`[AI:${requestId}]    Payload: ${formatBytes(payloadSize)}`)
  if (lastUserMessage) {
    const preview = lastUserMessage.content.slice(0, 100).replace(/\n/g, ' ')
    console.log(`[AI:${requestId}]    User: "${preview}${lastUserMessage.content.length > 100 ? '...' : ''}"`)
  }

  // GPT-5 family doesn't support temperature parameter
  const isGpt5Family = model.startsWith("gpt-5")

  // Streaming response
  if (shouldStream) {
    const fetchStart = performance.now()
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        ...(isGpt5Family ? {} : { temperature: 0.2 }),
        response_format: { type: "json_object" },
        stream: true,
      }),
    })

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "")
      console.log(`[AI:${requestId}] ❌ ERROR: Stream failed (${upstream.status})`)
      return NextResponse.json({ error: `OpenAI request failed (${upstream.status}): ${errorText}` }, { status: 502 })
    }

    const reader = upstream.body?.getReader()
    if (!reader) {
      return NextResponse.json({ error: "No response body" }, { status: 502 })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    let fullContent = ""
    let chunkCount = 0

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split("\n").filter(line => line.trim().startsWith("data:"))

            for (const line of lines) {
              const data = line.replace(/^data:\s*/, "").trim()
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  fullContent += content
                  chunkCount++
                  // Send chunk to client
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: content })}\n\n`))
                }
              } catch {
                // Skip unparseable chunks
              }
            }
          }

          // Send final message with complete content
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`))

          const fetchDuration = performance.now() - fetchStart
          console.log(`[AI:${requestId}] 📥 STREAM COMPLETE`)
          console.log(`[AI:${requestId}]    Duration: ${fetchDuration.toFixed(0)}ms`)
          console.log(`[AI:${requestId}]    Chunks: ${chunkCount}`)
          console.log(`[AI:${requestId}]    Output: ${formatBytes(fullContent.length)}`)
          console.log(`[AI:${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

          controller.close()
        } catch (error) {
          console.log(`[AI:${requestId}] ❌ STREAM ERROR:`, error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  }

  // Non-streaming response (original behavior)
  const fetchStart = performance.now()
  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      ...(isGpt5Family ? {} : { temperature: 0.2 }),
      response_format: { type: "json_object" },
    }),
  })
  const fetchDuration = performance.now() - fetchStart

  const data = (await upstream.json().catch(() => null)) as Record<string, unknown> | null

  if (!upstream.ok) {
    const message =
      typeof (data as Record<string, Record<string, unknown>>)?.error?.message === "string"
        ? (data as Record<string, Record<string, string>>).error.message
        : `OpenAI request failed (${upstream.status})`
    console.log(`[AI:${requestId}] ❌ ERROR: ${message}`)
    console.log(`[AI:${requestId}]    Duration: ${fetchDuration.toFixed(0)}ms`)
    return NextResponse.json({ error: message }, { status: 502 })
  }

  const content = (data as Record<string, Array<Record<string, Record<string, string>>>>)?.choices?.[0]?.message?.content
  const usage = (data as Record<string, Record<string, number>>)?.usage

  if (typeof content !== "string") {
    console.log(`[AI:${requestId}] ❌ ERROR: Response missing content`)
    return NextResponse.json({ error: "OpenAI response missing content" }, { status: 502 })
  }

  const totalDuration = performance.now() - startTime

  // Parse response to count actions
  let actionCount = 0
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed?.actions)) {
      actionCount = parsed.actions.length
    }
  } catch {
    // Not JSON or no actions
  }

  console.log(`[AI:${requestId}] 📥 RESPONSE`)
  console.log(`[AI:${requestId}]    Duration: ${fetchDuration.toFixed(0)}ms (API) / ${totalDuration.toFixed(0)}ms (total)`)
  console.log(`[AI:${requestId}]    Tokens: ${usage?.prompt_tokens ?? '?'} in, ${usage?.completion_tokens ?? '?'} out, ${usage?.total_tokens ?? '?'} total`)
  console.log(`[AI:${requestId}]    Actions: ${actionCount}`)
  console.log(`[AI:${requestId}]    Output: ${formatBytes(content.length)}`)
  console.log(`[AI:${requestId}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)

  return NextResponse.json({ content })
}
