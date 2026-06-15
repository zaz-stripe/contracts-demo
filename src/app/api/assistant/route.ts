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
    ? ctx.plans.map(p => `  • ${p.name}: $${p.price}/mo × ${p.quantity} units (${p.startDate} – ${p.endDate})${p.discounts.length ? `, ${p.discounts.join("/")}% discount` : ""}`).join("\n")
    : "  (none yet)"

  return `You are a contract configuration assistant embedded in a SaaS billing tool. You help users configure enterprise contracts conversationally.

Current contract state:
- Customer: ${ctx.customer?.name ? `${ctx.customer.name} <${ctx.customer.email}>` : "not set"}
- Currency: ${ctx.currency}
- Draft expiry: ${ctx.draftExpiry}
- Products on contract:
${planLines}
- Products available to add: ${ctx.catalog.join(", ")}
- Today: ${ctx.today}

You can take actions on this contract. After your reply, list any actions to apply under a COMMANDS: section using one of these exact formats:
  add [product name]
  remove [product name]
  set customer to [name]
  set customer to [name] with email [email]
  set currency to [USD|EUR|GBP|CAD|AUD]
  set [product name] to $[price]
  add a [N]% discount to [product name]

Guidelines:
- Be concise. One or two sentences max unless the user asks for explanation.
- If the user asks you to make a change, do it immediately — don't ask for confirmation.
- If a product isn't on the contract yet, add it first, then make other changes.
- Only include a COMMANDS: section when you're actually making changes.
- Never make up product names — only use what's in the available list.`
}

async function callClaude(message: string, ctx: AssistantContext): Promise<{ reply: string; commands: string[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return demoReply(message, ctx)

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: buildSystemPrompt(ctx),
        messages: [{ role: "user", content: message }],
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
    const { message, context } = (await req.json()) as { message: string; context: AssistantContext }
    if (!message || typeof message !== "string") {
      return Response.json({ reply: "What would you like to change?", commands: [] })
    }
    const result = await callClaude(
      message,
      context ?? { plans: [], catalog: [], selectedPlanName: null, customer: null, currency: "USD", draftExpiry: "", today: new Date().toISOString().slice(0, 10) }
    )
    return Response.json(result)
  } catch {
    return Response.json({ reply: "I couldn't process that. Try a command like 'add Enterprise Seats'.", commands: [] })
  }
}
