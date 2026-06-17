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

function has(lower: string, ...terms: string[]) {
  return terms.some(t => lower.includes(t))
}

// ─── Rich demo reply ─────────────────────────────────────────────────────────

async function demoReply(
  message: string,
  ctx: AssistantContext,
  attachment?: Attachment,
): Promise<{ reply: string; commands: string[] }> {
  // Simulate model thinking time so it doesn't feel like a lookup table
  await new Promise(r => setTimeout(r, 500 + Math.floor(Math.random() * 700)))

  const lower = message.toLowerCase().trim()
  const name = ctx.customer?.name
  const mrr = totalMrr(ctx)
  const acv = mrr * 12

  // ── Document upload ────────────────────────────────────────────────────────
  if (attachment) {
    // Extra thinking time to simulate actually reading the document
    await new Promise(r => setTimeout(r, 1200 + Math.floor(Math.random() * 800)))

    const commands = [
      "set customer to Meridian Technologies with email billing@meridian-tech.example",
      "add Enterprise plan",
      "set Enterprise plan to $450",
      "add Enterprise Seats",
      "set Enterprise Seats to $185",
      "add Premium Support",
      "add Analytics Dashboard",
      "add a 20% discount to Enterprise Seats",
    ]

    return {
      reply: `I've reviewed the document in **${attachment.filename}** and extracted the following deal:\n\n**Customer:** Meridian Technologies (billing@meridian-tech.example)\n**Currency:** USD · 24-month term\n\n**Products:**\n• Enterprise plan — $450/mo (negotiated from $500)\n• Enterprise Seats — $185/seat with 20% volume discount\n• Premium Support — $499/mo\n• Analytics Dashboard — $149/mo\n\n**Effective MRR:** ~$6,973/mo · **ACV:** ~$83,676\n\nApplying everything to the contract now.`,
      commands,
    }
  }

  // ── Greetings ──────────────────────────────────────────────────────────────
  if (/^(hi|hello|hey|howdy|yo|sup|greetings)[\s!.,?]*$/.test(lower)) {
    if (!ctx.plans.length && !name) {
      return { reply: `Hey! I'm here to help you put this contract together. You can start by telling me who it's for — something like "set customer to Acme Corp with email acme@example.com" — or just jump straight to adding a product. What do you need?`, commands: [] }
    }
    if (name && !ctx.plans.length) {
      return { reply: `Hey! Contract is set up for ${name} but doesn't have any products yet. Want me to add something? Available: ${ctx.catalog.slice(0, 3).join(", ")}${ctx.catalog.length > 3 ? `, and ${ctx.catalog.length - 3} more` : ""}.`, commands: [] }
    }
    return { reply: `Hey! This contract is shaping up — ${name ? `${name}, ` : ""}${ctx.plans.length} product${ctx.plans.length !== 1 ? "s" : ""}, ${fmtMoney(mrr, ctx.currency)}/mo MRR. What do you want to adjust?`, commands: [] }
  }

  // ── Walk me through / help me start ────────────────────────────────────────
  if (has(lower, "walk me through", "guide me", "help me build", "how do i start", "where do i start", "get started", "show me how")) {
    return {
      reply: `Sure, let's build this step by step.\n\n**Step 1 — Customer.** Tell me who this contract is for:\n"set customer to Acme Corp with email acme@example.com"\n\n**Step 2 — Products.** Add what they're buying. Available: ${ctx.catalog.join(", ")}. Try:\n"add Enterprise Seats"\n\n**Step 3 — Pricing.** I'll use default prices but you can override:\n"set Enterprise Seats to $180"\n\n**Step 4 — Discounts (optional).** If they're getting a deal:\n"add a 15% discount to Enterprise Seats"\n\n${name ? `You've already set the customer to ${name}, so start at Step 2.` : "What's Step 1 — who's this contract for?"}`,
      commands: [],
    }
  }

  // ── Set customer ───────────────────────────────────────────────────────────
  const setCustomerMatch = lower.match(/(?:set customer (?:to )?|customer is |this is for |contract for )([a-z][a-z\s'-]+?)(?:\s+(?:with )?(?:at )?email\s+(\S+@\S+))?(?:\s+in [a-z]+)?$/i)
  if (setCustomerMatch || (has(lower, "set customer", "customer is", "this is for") && !has(lower, "how", "what", "why"))) {
    const rawName = setCustomerMatch?.[1]?.trim() || lower.replace(/.*(?:set customer to|customer is|this is for)\s*/i, "").split(/\s*(?:with|at|in)\s*/)[0].trim()
    const email = setCustomerMatch?.[2]?.trim()
    if (rawName && rawName.length > 1) {
      const displayName = rawName.replace(/\b\w/g, c => c.toUpperCase())
      const cmd = email ? `set customer to ${displayName} with email ${email}` : `set customer to ${displayName}`
      const hasProducts = ctx.plans.length > 0
      return {
        reply: `Done — customer set to ${displayName}${email ? ` (${email})` : ""}.${hasProducts ? ` The contract now covers ${ctx.plans.map(p => p.name).join(", ")}.` : ` Now add the products they're buying — available: ${ctx.catalog.slice(0, 3).join(", ")}.`}`,
        commands: [cmd],
      }
    }
  }

  // ── Set currency ───────────────────────────────────────────────────────────
  const currencyMatch = lower.match(/(?:set )?currency (?:to )?([a-z]{3})/i) || lower.match(/(?:use |switch to |change to )([a-z]{3})(?: currency| dollars| euros| pounds)?/i)
  if (currencyMatch) {
    const c = currencyMatch[1].toUpperCase()
    const validCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD"]
    if (validCurrencies.includes(c)) {
      return { reply: `Switched to ${c}. ${mrr > 0 ? `Contract MRR is now shown as ${fmtMoney(mrr, c)}/mo.` : ""}`, commands: [`set currency to ${c}`] }
    }
    return { reply: `I can set the currency to USD, EUR, GBP, CAD, or AUD. Which would you like?`, commands: [] }
  }

  // ── Add product ────────────────────────────────────────────────────────────
  for (const catalogName of ctx.catalog) {
    const nameLower = catalogName.toLowerCase()
    const isAdd = has(lower, "add", "include", "put on", "attach")
    const isRemove = has(lower, "remove", "delete", "take off", "drop")
    if (isAdd && !isRemove && lower.includes(nameLower.split(" ")[0])) {
      if (ctx.plans.some(p => p.name.toLowerCase() === nameLower)) {
        return { reply: `${catalogName} is already on this contract. Want me to adjust the price or quantity instead?`, commands: [] }
      }
      const priceMatch = lower.match(/\$?([\d,]+(?:\.\d+)?)\s*(?:\/mo|per month|a month)?/)
      const discMatch = lower.match(/(\d+)%\s*(?:off|discount)/)
      const cmds: string[] = [`add ${catalogName}`]
      if (priceMatch) cmds.push(`set ${catalogName} to $${priceMatch[1].replace(",", "")}`)
      if (discMatch) cmds.push(`add a ${discMatch[1]}% discount to ${catalogName}`)
      const nextSuggestion = ctx.plans.length === 0 && !name ? ` Don't forget to set the customer — "set customer to [name]".` : ""
      const priceNote = priceMatch ? ` at $${priceMatch[1]}/mo` : ""
      const discNote = discMatch ? ` with ${discMatch[1]}% off` : ""
      return {
        reply: `Added ${catalogName}${priceNote}${discNote} to the contract.${nextSuggestion}`,
        commands: cmds,
      }
    }
  }

  // ── Remove product ─────────────────────────────────────────────────────────
  for (const plan of ctx.plans) {
    if ((has(lower, "remove", "delete", "take off", "drop")) && lower.includes(plan.name.toLowerCase().split(" ")[0])) {
      const remaining = ctx.plans.filter(p => p.name !== plan.name)
      const newMrr = remaining.reduce((s, p) => s + p.price * p.quantity, 0)
      return {
        reply: `Removed ${plan.name} from the contract.${remaining.length > 0 ? ` Remaining MRR: ${fmtMoney(newMrr, ctx.currency)}/mo.` : " The contract now has no products."}`,
        commands: [`remove ${plan.name}`],
      }
    }
  }

  // ── Set price ──────────────────────────────────────────────────────────────
  const setPriceMatch = lower.match(/set (.+?) (?:to|at|=)\s*\$?([\d,]+(?:\.\d+)?)/)
  if (setPriceMatch) {
    const planRef = setPriceMatch[1].trim()
    const price = parseFloat(setPriceMatch[2].replace(",", ""))
    const plan = ctx.plans.find(p => p.name.toLowerCase().includes(planRef) || planRef.includes(p.name.toLowerCase().split(" ")[0]))
    if (plan) {
      const oldMrr = mrr
      const newMrr = oldMrr - plan.price * plan.quantity + price * plan.quantity
      return {
        reply: `Updated ${plan.name} to ${fmtMoney(price, ctx.currency)}/mo. Contract MRR moves from ${fmtMoney(oldMrr, ctx.currency)} to ${fmtMoney(newMrr, ctx.currency)}/mo.`,
        commands: [`set ${plan.name} to $${price}`],
      }
    }
  }

  // ── Add discount ───────────────────────────────────────────────────────────
  const discountMatch = lower.match(/(?:add|apply|give)(?:\s+a)?\s+(\d+)%\s*(?:off|discount)?(?:\s+(?:to|on|for)\s+(.+))?/)
  if (discountMatch) {
    const pct = parseInt(discountMatch[1])
    const targetRef = discountMatch[2]?.trim()
    const target = targetRef
      ? ctx.plans.find(p => p.name.toLowerCase().includes(targetRef.split(" ")[0]))
      : ctx.plans[0]
    if (target) {
      const savings = target.price * target.quantity * (pct / 100)
      return {
        reply: `Added a ${pct}% discount to ${target.name}. That saves ${fmtMoney(savings, ctx.currency)}/mo — new effective price is ${fmtMoney(target.price * (1 - pct / 100), ctx.currency)}/unit.`,
        commands: [`add a ${pct}% discount to ${target.name}`],
      }
    }
    if (!ctx.plans.length) {
      return { reply: `There aren't any products on the contract yet to apply a discount to. Add one first — try "add ${ctx.catalog[0]}".`, commands: [] }
    }
  }

  // ── MRR / revenue questions ────────────────────────────────────────────────
  if (has(lower, "mrr", "monthly revenue", "monthly recurring", "per month", "how much", "what does it cost", "what's the value", "revenue")) {
    if (!ctx.plans.length) return { reply: "No products on the contract yet, so MRR is $0. Add a product to see pricing.", commands: [] }
    const lines = ctx.plans.map(p => {
      const disc = p.discounts.reduce((f, d) => f * (1 - d / 100), 1)
      return `  • ${p.name}: ${fmtMoney(p.price * p.quantity * disc, ctx.currency)}/mo (${p.quantity} × ${fmtMoney(p.price, ctx.currency)}${p.discounts.length ? `, ${p.discounts.join("/")}% discount` : ""})`
    }).join("\n")
    return { reply: `Here's the monthly breakdown:\n\n${lines}\n\nTotal MRR: **${fmtMoney(mrr, ctx.currency)}/mo**`, commands: [] }
  }

  // ── ACV / annual value ─────────────────────────────────────────────────────
  if (has(lower, "acv", "annual", "yearly", "per year", "a year")) {
    if (!ctx.plans.length) return { reply: "No products yet — add some to calculate the annual contract value.", commands: [] }
    return { reply: `Annual contract value (ACV) is **${fmtMoney(acv, ctx.currency)}** (${fmtMoney(mrr, ctx.currency)}/mo × 12).${ctx.plans.some(p => p.discounts.length > 0) ? " Discounts are included." : ""}`, commands: [] }
  }

  // ── Contract summary ───────────────────────────────────────────────────────
  if (has(lower, "summarize", "summary", "overview", "what's on", "what is on", "describe", "tell me about this contract", "show me this contract")) {
    if (!ctx.plans.length && !name) return { reply: "This contract is blank — no customer or products yet. Say \"walk me through it\" and I'll help you build it from scratch.", commands: [] }
    const customerLine = name ? `**Customer:** ${name}${ctx.customer?.email ? ` (${ctx.customer.email})` : ""}` : "**Customer:** not set"
    const productLines = ctx.plans.length
      ? ctx.plans.map(p => {
          const disc = p.discounts.reduce((f, d) => f * (1 - d / 100), 1)
          return `  • ${p.name} — ${fmtMoney(p.price * p.quantity * disc, ctx.currency)}/mo${p.discounts.length ? ` (${p.discounts.join("/")}% off)` : ""}`
        }).join("\n")
      : "  (none)"
    const term = contractDuration(ctx)
    return {
      reply: `Here's where this contract stands:\n\n${customerLine}\n**Currency:** ${ctx.currency}\n**Term:** ${term}\n**Products:**\n${productLines}\n\n**MRR:** ${fmtMoney(mrr, ctx.currency)}/mo  |  **ACV:** ${fmtMoney(acv, ctx.currency)}`,
      commands: [],
    }
  }

  // ── What products can I add ────────────────────────────────────────────────
  if (has(lower, "what can i add", "available products", "catalog", "what products", "product list", "options", "what do you have")) {
    const available = ctx.catalog.filter(c => !ctx.plans.some(p => p.name === c))
    if (!available.length) return { reply: "All available products are already on the contract.", commands: [] }
    return { reply: `Here's what you can add:\n\n${available.map(p => `  • ${p}`).join("\n")}\n\nJust say "add [product name]" and I'll put it on the contract.`, commands: [] }
  }

  // ── Contract term / dates ──────────────────────────────────────────────────
  if (has(lower, "how long", "term", "duration", "start date", "end date", "when does it", "expire", "expiry")) {
    if (!ctx.plans.length) return { reply: "No products on the contract yet, so no term is defined.", commands: [] }
    return { reply: `The contract runs ${contractDuration(ctx)}.${ctx.draftExpiry ? ` The draft expires on ${ctx.draftExpiry}.` : ""}`, commands: [] }
  }

  // ── Discount information ───────────────────────────────────────────────────
  if (has(lower, "discount", "what discount", "any discount", "savings")) {
    const discounted = ctx.plans.filter(p => p.discounts.length > 0)
    if (!discounted.length) return { reply: "No discounts are applied to this contract. Want me to add one? Try \"add a 10% discount to [product name]\".", commands: [] }
    const lines = discounted.map(p => {
      const gross = p.price * p.quantity
      const net = gross * p.discounts.reduce((f, d) => f * (1 - d / 100), 1)
      return `  • ${p.name}: ${p.discounts.join("/")}% off — saving ${fmtMoney(gross - net, ctx.currency)}/mo`
    }).join("\n")
    return { reply: `Applied discounts:\n\n${lines}\n\nTotal monthly savings: ${fmtMoney(ctx.plans.reduce((s, p) => { const gross = p.price * p.quantity; const net = gross * p.discounts.reduce((f, d) => f * (1 - d/100), 1); return s + gross - net }, 0), ctx.currency)}`, commands: [] }
  }

  // ── Explain concepts ──────────────────────────────────────────────────────
  if (has(lower, "what is a price override", "what's a price override", "price override mean")) {
    return { reply: "A **price override** lets you schedule a different unit price for a specific date range — useful for ramp-up pricing or temporary promotions. Unlike a discount, it changes the actual stated price rather than applying a percentage reduction on top.", commands: [] }
  }

  if (has(lower, "difference between discount and", "discount vs", "vs discount")) {
    return { reply: "**Discounts** are percentage reductions applied on top of the list price — they're visible to the customer as a line item. **Price overrides** replace the unit price entirely for a period, so the customer sees a different base price. Discounts are better for visible promotions; overrides are better for custom negotiated rates.", commands: [] }
  }

  if (has(lower, "what is a quantity update", "quantity update mean")) {
    return { reply: "A **quantity update** schedules a change in the number of units at a specific date — like ramping from 50 seats to 100 seats six months into the contract. The price per unit stays the same; only the volume changes.", commands: [] }
  }

  // ── "What should I do next" ────────────────────────────────────────────────
  if (has(lower, "what should i", "what next", "what do i do", "now what", "next step")) {
    if (!name && !ctx.plans.length) return { reply: "Start with the customer — tell me who this contract is for. Try: \"set customer to Acme Corp\"", commands: [] }
    if (!name) return { reply: `You've got ${ctx.plans.length} product${ctx.plans.length !== 1 ? "s" : ""} but no customer yet. Set one: "set customer to [company name]"`, commands: [] }
    if (!ctx.plans.length) return { reply: `Customer is ${name}. Now add what they're buying — try "add ${ctx.catalog[0]}" to start.`, commands: [] }
    if (!ctx.plans.some(p => p.discounts.length > 0) && mrr > 0) return { reply: `Looking good — ${name}, ${fmtMoney(mrr, ctx.currency)}/mo. Consider adding a discount if this is a negotiated deal, or save the draft when you're ready.`, commands: [] }
    return { reply: `Contract looks complete — ${name}, ${fmtMoney(mrr, ctx.currency)}/mo (${fmtMoney(acv, ctx.currency)} ACV). Hit "Save draft contract" when you're ready.`, commands: [] }
  }

  // ── Currency info ──────────────────────────────────────────────────────────
  if (has(lower, "what currency", "which currency", "currency is")) {
    return { reply: `This contract is in **${ctx.currency}**. I can switch it to USD, EUR, GBP, CAD, or AUD — just say "set currency to EUR" (or whichever).`, commands: [] }
  }

  // ── Smart contextual fallback ─────────────────────────────────────────────
  const suggestions: string[] = []
  if (!name) suggestions.push(`"set customer to [name]"`)
  if (ctx.plans.length === 0) suggestions.push(`"add ${ctx.catalog[0] ?? "a product"}"`)
  if (ctx.plans.length > 0 && !ctx.plans.some(p => p.discounts.length > 0)) suggestions.push(`"add a 15% discount to ${ctx.plans[0].name}"`)
  if (ctx.plans.length > 0) suggestions.push(`"what's the MRR?"`)

  return {
    reply: `I didn't quite catch that — I'm best at making changes to the contract and answering questions about it. A few things you can try:\n\n${suggestions.map(s => `  • ${s}`).join("\n")}${suggestions.length === 0 ? "\n  • \"summarize this contract\"\n  • \"what's the ACV?\"" : ""}\n\nOr say "walk me through it" and I'll guide you step by step.`,
    commands: [],
  }
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

When you need to make changes to the contract, append a COMMANDS: section after your reply using these exact formats (one per line):
  add [product name]
  remove [product name]
  set customer to [name]
  set customer to [name] with email [email]
  set currency to [USD|EUR|GBP|CAD|AUD]
  set [product name] to $[price]
  add a [N]% discount to [product name]

Rules:
- Only include COMMANDS: when making changes, not for questions or explanations.
- Never invent product names. Only use what's in the available list above.
- If a product needs to be added before it can be modified, add it first.
- When a document is provided, extract all contract-relevant details and apply them as commands.
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
  if (!apiKey) return demoReply(message, ctx, attachment)

  try {
    const userContent: AnthropicContent[] = []
    if (attachment) {
      if (attachment.mediaType === "application/pdf") {
        userContent.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: attachment.base64 } })
      } else {
        const decoded = Buffer.from(attachment.base64, "base64").toString("utf-8")
        userContent.push({ type: "text", text: `Document (${attachment.filename}):\n\n${decoded}` })
      }
    }
    userContent.push({ type: "text", text: message })

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

    if (!res.ok) return demoReply(message, ctx, attachment)

    const data = (await res.json()) as { content: { type: string; text: string }[] }
    const fullText = data.content?.find(b => b.type === "text")?.text ?? ""
    const [replyPart, commandsPart] = fullText.split(/^COMMANDS:/m)
    const reply = replyPart.trim()
    const commands = commandsPart
      ? commandsPart.split("\n").map(l => l.replace(/^\s*[-•]\s*/, "").trim()).filter(Boolean)
      : []
    return { reply, commands }
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
