export const runtime = "nodejs"

import OpenAI from "openai"

const client = new OpenAI({
  baseURL: process.env.LITELLM_BASE_URL,
  apiKey: process.env.LITELLM_API_KEY,
})

interface AssistantContext {
  plans: { name: string; price: number; quantity: number; startDate: string; endDate: string; discounts: number[] }[]
  catalog: string[]
  selectedPlanName: string | null
  customer: { name: string; email: string } | null
  currency: string
  draftExpiry: string
  today: string
}

interface Attachment {
  filename: string
  base64: string
  mediaType: string
}

interface HistoryMessage {
  role: "user" | "assistant"
  content: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtMoney(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n)
}

function totalMrr(ctx: AssistantContext) {
  return ctx.plans.reduce((sum, p) => {
    const disc = p.discounts.reduce((f, d) => f * (1 - d / 100), 1)
    return sum + p.price * p.quantity * disc
  }, 0)
}

function contractDuration(ctx: AssistantContext): string {
  if (!ctx.plans.length) return "no term set"
  const starts = ctx.plans.map(p => new Date(p.startDate).getTime())
  const ends = ctx.plans.map(p => new Date(p.endDate).getTime())
  const start = new Date(Math.min(...starts))
  const end = new Date(Math.max(...ends))
  const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  return `${fmt(start)} – ${fmt(end)} (${months} months)`
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx: AssistantContext): string {
  const planLines = ctx.plans.length
    ? ctx.plans.map(p =>
        `  • ${p.name}: $${p.price}/mo × ${p.quantity} units (${p.startDate}–${p.endDate})${p.discounts.length ? `, ${p.discounts.join("/")}% discount` : ""}`
      ).join("\n")
    : "  (none yet)"

  const mrr = totalMrr(ctx)
  const acv = mrr * 12

  return `You are a helpful contract assistant embedded in a SaaS billing tool. Have a natural, thoughtful conversation with the user. You can answer questions, explain options, do math, summarize the deal — anything useful.

Current contract state:
- Customer: ${ctx.customer?.name ? `${ctx.customer.name} <${ctx.customer.email}>` : "not set"}
- Currency: ${ctx.currency}
- Draft expiry: ${ctx.draftExpiry || "not set"}
- MRR: ${fmtMoney(mrr, ctx.currency)}/mo | ACV: ${fmtMoney(acv, ctx.currency)}
- Term: ${contractDuration(ctx)}
- Products on contract:
${planLines}
- Products available to add: ${ctx.catalog.join(", ")}
- Today: ${ctx.today}

When the user asks you to make changes to the contract, call the execute_contract_commands tool with the appropriate commands. Use it only when making changes — not for questions or explanations.

Available command formats (use exact product names from the available list):
  add [product name]
  remove [product name]
  set customer to [name]
  set customer to [name] with email [email]
  set currency to [USD|EUR|GBP|CAD|AUD]
  set [product name] to $[price]
  add a [N]% discount to [product name]
  shift contract start to [YYYY-MM-DD]

Rules:
- Never invent product names. Only use names from the available list above.
- If a product needs to be added before it can be modified, include the add command first.
- When a document is provided, extract all contract-relevant details and apply them.
- Respond conversationally, not like a command-line interface.`
}

// ─── Tool definition ──────────────────────────────────────────────────────────

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "execute_contract_commands",
      description: "Apply one or more changes to the contract. Call this whenever the user asks to add, remove, or modify anything on the contract.",
      parameters: {
        type: "object",
        properties: {
          commands: {
            type: "array",
            items: { type: "string" },
            description: "Ordered list of commands to execute against the contract.",
          },
        },
        required: ["commands"],
      },
    },
  },
]

// ─── Demo mode (no API keys configured) ──────────────────────────────────────

async function demoReply(
  message: string,
  ctx: AssistantContext,
  attachment?: Attachment,
): Promise<{ reply: string; commands: string[] }> {
  await new Promise(r => setTimeout(r, 500 + Math.floor(Math.random() * 700)))

  const lower = message.toLowerCase().trim()
  const name = ctx.customer?.name
  const mrr = totalMrr(ctx)

  if (attachment) {
    await new Promise(r => setTimeout(r, 1200 + Math.floor(Math.random() * 800)))
    return {
      reply: `I've reviewed **${attachment.filename}** and extracted the deal details. Applying everything now.`,
      commands: [
        "set customer to Meridian Technologies with email billing@meridian-tech.example",
        "add Enterprise plan",
        "set Enterprise plan to $450",
        "add Enterprise Seats",
        "set Enterprise Seats to $185",
        "add a 20% discount to Enterprise Seats",
      ],
    }
  }

  if (!name && !ctx.plans.length) {
    return { reply: `Hey! Tell me who this contract is for — "set customer to Acme Corp" — or add a product to get started. Available: ${ctx.catalog.slice(0, 3).join(", ")}.`, commands: [] }
  }

  if (lower.includes("summar") || lower.includes("overview")) {
    const customerLine = name ? `**Customer:** ${name}` : "**Customer:** not set"
    const lines = ctx.plans.map(p => `  • ${p.name} — $${p.price}/mo`).join("\n") || "  (none)"
    return { reply: `${customerLine}\n**Products:**\n${lines}\n\n**MRR:** ${fmtMoney(mrr, ctx.currency)}/mo`, commands: [] }
  }

  return { reply: `I'm running in demo mode — add your LiteLLM credentials to enable AI. Direct commands still work: try "add ${ctx.catalog[0] ?? "a product"}".`, commands: [] }
}

// ─── Main AI call with agentic tool loop ─────────────────────────────────────

async function callAssistant(
  message: string,
  ctx: AssistantContext,
  attachment?: Attachment,
  history?: HistoryMessage[],
): Promise<{ reply: string; commands: string[] }> {
  if (!process.env.LITELLM_BASE_URL || !process.env.LITELLM_API_KEY) {
    return demoReply(message, ctx, attachment)
  }

  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt(ctx) },
    ]

    for (const h of history ?? []) {
      messages.push({ role: h.role, content: h.content })
    }

    // Build user message — include attachment as text if present
    let userContent = message
    if (attachment) {
      const decoded = Buffer.from(attachment.base64, "base64").toString("utf-8")
      userContent = `Document (${attachment.filename}):\n\n${decoded}\n\n${message}`
    }
    messages.push({ role: "user", content: userContent })

    const allCommands: string[] = []
    let reply = ""

    // Agentic loop: keep going until the model stops calling tools
    while (true) {
      const response = await client.chat.completions.create({
        model: "claude-sonnet-4",
        max_tokens: attachment ? 1200 : 600,
        tools,
        messages,
      })

      const choice = response.choices[0]
      const assistantMessage = choice.message

      // Accumulate any text reply
      if (assistantMessage.content) {
        reply = assistantMessage.content
      }

      // If no tool calls, we're done
      if (!assistantMessage.tool_calls?.length || choice.finish_reason === "stop") {
        break
      }

      // Process tool calls and collect commands
      messages.push(assistantMessage)

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue
        if (toolCall.function.name === "execute_contract_commands") {
          const args = JSON.parse(toolCall.function.arguments) as { commands: string[] }
          allCommands.push(...(args.commands ?? []))

          // Return tool result so the model can continue if needed
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ success: true, applied: args.commands.length }),
          })
        }
      }

      // Stop if model signalled it's done with tools
      if (choice.finish_reason === "tool_calls" && assistantMessage.tool_calls.length > 0) {
        // One more turn to get the final text reply
        const followUp = await client.chat.completions.create({
          model: "claude-sonnet-4",
          max_tokens: 400,
          messages,
        })
        reply = followUp.choices[0].message.content ?? reply
        break
      }
    }

    return { reply: reply.trim(), commands: allCommands }
  } catch {
    return demoReply(message, ctx, attachment)
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { message, context, attachment, history } = (await req.json()) as {
      message: string
      context: AssistantContext
      attachment?: Attachment
      history?: HistoryMessage[]
    }
    if (!message || typeof message !== "string") {
      return Response.json({ reply: "What would you like to do?", commands: [] })
    }
    const result = await callAssistant(
      message,
      context ?? { plans: [], catalog: [], selectedPlanName: null, customer: null, currency: "USD", draftExpiry: "", today: new Date().toISOString().slice(0, 10) },
      attachment,
      history,
    )
    return Response.json(result)
  } catch {
    return Response.json({ reply: "Something went wrong. Try again.", commands: [] })
  }
}
