export const runtime = "nodejs"

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

// ─── Keyword fallback (no API key) ──────────────────────────────────────────

function demoReply(message: string, ctx: AssistantContext): { reply: string; commands: string[] } {
  const lower = message.toLowerCase().trim()

  const customerMatch = lower.match(/set customer to (.+?)(?:\s+with email (.+))?$/)
  if (customerMatch) {
    const name = customerMatch[1].trim()
    const email = customerMatch[2]?.trim()
    const cmd = email ? `set customer to ${name} with email ${email}` : `set customer to ${name}`
    return { reply: `Updated the customer to ${name}.`, commands: [cmd] }
  }

  const currMatch = lower.match(/set currency to ([a-z]{3})/i)
  if (currMatch) {
    const c = currMatch[1].toUpperCase()
    return { reply: `Currency set to ${c}.`, commands: [`set currency to ${c}`] }
  }

  for (const name of ctx.catalog) {
    if (lower.includes("add") && lower.includes(name.toLowerCase())) {
      return { reply: `Added ${name} to the contract.`, commands: [`add ${name}`] }
    }
  }

  for (const p of ctx.plans) {
    if (lower.includes("remove") && lower.includes(p.name.toLowerCase())) {
      return { reply: `Removed ${p.name} from the contract.`, commands: [`remove ${p.name}`] }
    }
  }

  const priceMatch = lower.match(/set (.+?) to \$?([\d,]+(?:\.\d+)?)/)
  if (priceMatch) {
    const planRef = priceMatch[1].trim()
    const price = priceMatch[2].replace(",", "")
    const plan = ctx.plans.find(p => p.name.toLowerCase().includes(planRef))
    if (plan) {
      return { reply: `Set ${plan.name} to $${price}/mo.`, commands: [`set ${plan.name} to $${price}`] }
    }
  }

  const discountMatch = lower.match(/add (?:a )?(\d+)% discount/)
  if (discountMatch) {
    const pct = discountMatch[1]
    const target = ctx.selectedPlanName ?? ctx.plans[0]?.name
    if (target) {
      return { reply: `Added a ${pct}% discount to ${target}.`, commands: [`add a ${pct}% discount to ${target}`] }
    }
  }

  const help = ctx.plans.length
    ? `I can help you manage this contract. Try: "set ${ctx.plans[0].name} to $200", "add a 10% discount", or "set currency to EUR".`
    : `I can help you build this contract. Try: "add ${ctx.catalog[0] ?? "a product"}" to get started.`

  return { reply: help, commands: [] }
}

// ─── Claude via Anthropic API ────────────────────────────────────────────────

function buildSystemPrompt(ctx: AssistantContext): string {
  const planLines = ctx.plans.length
    ? ctx.plans.map(p =>
        `  • ${p.name}: $${p.price}/mo × ${p.quantity} units (${p.startDate}–${p.endDate})${p.discounts.length ? `, ${p.discounts.join("/")}% discount` : ""}`
      ).join("\n")
    : "  (none yet)"

  return `You are a helpful contract assistant embedded in a SaaS billing tool. Have a natural, thoughtful conversation with the user. You can answer questions, explain options, do math, summarize the deal — anything that's useful. When the user asks you to make a change, do it.

Current contract state:
- Customer: ${ctx.customer?.name ? `${ctx.customer.name} <${ctx.customer.email}>` : "not set"}
- Currency: ${ctx.currency}
- Draft expiry: ${ctx.draftExpiry || "not set"}
- Products on contract:
${planLines}
- Products available to add: ${ctx.catalog.join(", ")}
- Today: ${ctx.today}

When you need to make changes to the contract, append a COMMANDS: section after your reply using these exact formats (one per line, no bullets needed):
  add [product name]
  remove [product name]
  set customer to [name]
  set customer to [name] with email [email]
  set currency to [USD|EUR|GBP|CAD|AUD]
  set [product name] to $[price]
  add a [N]% discount to [product name]

Rules:
- Only include COMMANDS: when you're actually making changes — not for questions or explanations.
- Never invent product names. Only use what's in the available list above.
- If a product needs to be added before it can be modified, add it first.
- When a document is provided, extract all contract-relevant details (customer, products, pricing, dates, discounts) and apply them as commands. Match product names to the closest available option.
- Be yourself. Respond conversationally, not like a command-line interface.`
}

type AnthropicContent =
  | { type: "text"; text: string }
  | { type: "document"; source: { type: "base64"; media_type: string; data: string } }

async function callClaude(
  message: string,
  ctx: AssistantContext,
  attachment?: Attachment,
  history?: HistoryMessage[],
): Promise<{ reply: string; commands: string[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return demoReply(message, ctx)

  try {
    // Build the current user message content
    const userContent: AnthropicContent[] = []

    if (attachment) {
      if (attachment.mediaType === "application/pdf") {
        userContent.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: attachment.base64 },
        })
      } else {
        const decoded = Buffer.from(attachment.base64, "base64").toString("utf-8")
        userContent.push({ type: "text", text: `Document (${attachment.filename}):\n\n${decoded}` })
      }
    }
    userContent.push({ type: "text", text: message })

    // Build multi-turn message array from history + current turn
    const messages: { role: "user" | "assistant"; content: string | AnthropicContent[] }[] = []
    for (const h of history ?? []) {
      messages.push({ role: h.role, content: h.content })
    }
    messages.push({ role: "user", content: userContent })

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        ...(attachment?.mediaType === "application/pdf" ? { "anthropic-beta": "pdfs-2024-09-25" } : {}),
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: attachment ? 1200 : 600,
        system: buildSystemPrompt(ctx),
        messages,
      }),
    })

    if (!res.ok) return demoReply(message, ctx)

    const data = (await res.json()) as { content: { type: string; text: string }[] }
    const fullText = data.content?.find(b => b.type === "text")?.text ?? ""

    const [replyPart, commandsPart] = fullText.split(/^COMMANDS:/m)
    const reply = replyPart.trim()
    const commands = commandsPart
      ? commandsPart.split("\n").map(l => l.replace(/^\s*[-•]\s*/, "").trim()).filter(Boolean)
      : []

    return { reply, commands }
  } catch {
    return demoReply(message, ctx)
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
    const result = await callClaude(
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
