/**
 * Generates Stripe API-like code snippets based on pricing plan configuration.
 * This is for display purposes only - it mimics what the Stripe API would create
 * when the user saves their pricing plan configuration.
 */

type PlanRate = { id: number; name: string }
type PlanRateCard = { id: number; name: string; rates: PlanRate[] }
type PlanCreditGrant = { id: number; name: string }
type PlanSubscriptionFee = { id: number; name: string }

export type StripeCodeGeneratorInput = {
  // Plan basics
  planName: string
  planDescription: string
  planCurrency: string
  planLookupKey: string

  // Rate cards and rates
  planRateCards: PlanRateCard[]
  planRates?: PlanRate[]
  rateMeters: Record<number, string>
  ratePriceTypes: Record<number, string>
  planRateUnitPrices: Record<number, string>
  planRateTiers: Record<number, number[]>
  planRateTierToValues: Record<number, Record<number, string>>
  planRateTierUnitPrices: Record<number, Record<number, string>>
  planRateTierFlatFees: Record<number, Record<number, string>>
  rateUnitLabels: Record<number, string>
  rateSellAs: Record<number, string>

  // Credit grants
  planCreditGrants: PlanCreditGrant[]
  creditGrantAmounts: Record<number, string>
  creditGrantPeriods: Record<number, string>

  // Subscription fees
  planSubscriptionFees: PlanSubscriptionFee[]
  subscriptionFeeAmounts: Record<number, string>
  subscriptionFeePeriods: Record<number, string>
}

function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

function generateProductId(): string {
  return `prod_${Math.random().toString(36).substring(2, 14)}`
}

function generatePriceId(): string {
  return `price_${Math.random().toString(36).substring(2, 14)}`
}

function generateMeterId(): string {
  return `mtr_${Math.random().toString(36).substring(2, 14)}`
}

export type CodeSection = {
  title: string
  language: "curl" | "typescript" | "ruby" | "python"
  code: string
  description?: string
}

export function generateStripeCode(input: StripeCodeGeneratorInput): CodeSection[] {
  const sections: CodeSection[] = []
  const productIds: Record<string, string> = {}
  const priceIds: Record<number, string> = {}
  const meterIds: Record<string, string> = {}

  // Generate IDs upfront for cross-referencing
  input.planRateCards.forEach((card) => {
    const productKey = card.name || `rate_card_${card.id}`
    productIds[productKey] = generateProductId()
    card.rates.forEach((rate) => {
      priceIds[rate.id] = generatePriceId()
      const meterName = input.rateMeters[rate.id]
      if (meterName && !meterIds[meterName]) {
        meterIds[meterName] = generateMeterId()
      }
    })
  })
  // Standalone rates (not in any rate card)
  const standaloneRates = input.planRates ?? []
  if (standaloneRates.length > 0) {
    productIds["__standalone_rates__"] = generateProductId()
    standaloneRates.forEach((rate) => {
      priceIds[rate.id] = generatePriceId()
      const meterName = input.rateMeters[rate.id]
      if (meterName && !meterIds[meterName]) {
        meterIds[meterName] = generateMeterId()
      }
    })
  }

  // 1. Create Meters
  const metersToCreate = Object.entries(meterIds)
  if (metersToCreate.length > 0) {
    const meterCode = metersToCreate
      .map(([meterName, meterId]) => {
        const eventName = toSnakeCase(meterName)
        return `# Create meter: ${meterName}
curl https://api.stripe.com/v1/billing/meters \\
  -u "{{SECRET_KEY}}:" \\
  -d "display_name=${meterName}" \\
  -d "event_name=${eventName}" \\
  -d "default_aggregation[formula]=sum" \\
  -d "customer_mapping[type]=by_id" \\
  -d "customer_mapping[event_payload_key]=stripe_customer_id"
# => ${meterId}`
      })
      .join("\n\n")

    sections.push({
      title: "Create Billing Meters",
      language: "curl",
      code: meterCode,
      description: "Define usage meters to track consumption",
    })
  }

  // 2. Create Products (one per rate card)
  input.planRateCards.forEach((card) => {
    if (!card.name && card.rates.every((r) => !r.name)) return

    const productName = card.name || "Untitled Rate Card"
    const productId = productIds[card.name || `rate_card_${card.id}`]

    const productCode = `# Create product: ${productName}
curl https://api.stripe.com/v1/products \\
  -u "{{SECRET_KEY}}:" \\
  -d "name=${productName}" \\
  -d "type=service" \\
  -d "metadata[plan_name]=${input.planName || 'Untitled Plan'}" \\
  -d "metadata[rate_card_id]=${card.id}"
# => ${productId}`

    sections.push({
      title: `Create Product: ${productName}`,
      language: "curl",
      code: productCode,
    })

    // 3. Create Prices for each rate in this card
    card.rates.forEach((rate) => {
      if (!rate.name) return

      const priceId = priceIds[rate.id]
      const priceType = input.ratePriceTypes[rate.id] || "Unit"
      const unitPrice = input.planRateUnitPrices[rate.id] || "0"
      const meterName = input.rateMeters[rate.id]
      const meterId = meterName ? meterIds[meterName] : null
      const tiers = input.planRateTiers[rate.id] || []

      let priceCode = ""

      if (priceType === "Graduated" || priceType === "Volume") {
        // Tiered pricing
        const tierToValues = input.planRateTierToValues[rate.id] || {}
        const tierUnitPrices = input.planRateTierUnitPrices[rate.id] || {}
        const tierFlatFees = input.planRateTierFlatFees[rate.id] || {}

        const tierLines = tiers.map((tierId, index) => {
          const isLast = index === tiers.length - 1
          const upTo = isLast ? "inf" : tierToValues[tierId] || String((index + 1) * 1000)
          const tierUnitPrice = tierUnitPrices[tierId] || "0"
          const tierFlatFee = tierFlatFees[tierId] || "0"
          const unitAmount = Math.round(parseFloat(tierUnitPrice || "0") * 100)
          const flatAmount = Math.round(parseFloat(tierFlatFee || "0") * 100)

          return `  -d "tiers[${index}][up_to]=${upTo}" \\
  -d "tiers[${index}][unit_amount]=${unitAmount}" \\
  -d "tiers[${index}][flat_amount]=${flatAmount}"`
        })

        priceCode = `# Create tiered price: ${rate.name}
curl https://api.stripe.com/v1/prices \\
  -u "{{SECRET_KEY}}:" \\
  -d "product=${productId}" \\
  -d "nickname=${rate.name}" \\
  -d "currency=${input.planCurrency.toLowerCase()}" \\
  -d "billing_scheme=tiered" \\
  -d "tiers_mode=${priceType.toLowerCase()}" \\
  -d "recurring[interval]=month" \\
  -d "recurring[usage_type]=metered" \\
${meterId ? `  -d "recurring[meter]=${meterId}" \\\n` : ""}${tierLines.join(" \\\n")}
# => ${priceId}`
      } else {
        // Unit pricing
        const unitAmount = Math.round(parseFloat(unitPrice || "0") * 100)

        priceCode = `# Create price: ${rate.name}
curl https://api.stripe.com/v1/prices \\
  -u "{{SECRET_KEY}}:" \\
  -d "product=${productId}" \\
  -d "nickname=${rate.name}" \\
  -d "currency=${input.planCurrency.toLowerCase()}" \\
  -d "unit_amount=${unitAmount}" \\
  -d "recurring[interval]=month" \\
  -d "recurring[usage_type]=metered"${meterId ? ` \\\n  -d "recurring[meter]=${meterId}"` : ""}
# => ${priceId}`
      }

      sections.push({
        title: `Create Price: ${rate.name}`,
        language: "curl",
        code: priceCode,
      })
    })
  })

  // 4. Create Credit Grants
  input.planCreditGrants.forEach((grant) => {
    if (!grant.name) return

    const amount = input.creditGrantAmounts[grant.id] || "0"
    const period = input.creditGrantPeriods[grant.id] || "Monthly"

    const creditCode = `# Create credit grant: ${grant.name}
curl https://api.stripe.com/v1/billing/credit_grants \\
  -u "{{SECRET_KEY}}:" \\
  -d "customer={{CUSTOMER_ID}}" \\
  -d "name=${grant.name}" \\
  -d "amount[type]=monetary" \\
  -d "amount[monetary][value]=${Math.round(parseFloat(amount) * 100)}" \\
  -d "amount[monetary][currency]=${input.planCurrency.toLowerCase()}" \\
  -d "applicability_config[scope][price_type]=metered" \\
  -d "category=promotional" \\
  -d "expires_at=${getExpirationTimestamp(period)}"`

    sections.push({
      title: `Create Credit Grant: ${grant.name}`,
      language: "curl",
      code: creditCode,
    })
  })

  // 5. Create Subscription Fees (as flat-rate prices)
  input.planSubscriptionFees.forEach((fee) => {
    if (!fee.name) return

    const amount = input.subscriptionFeeAmounts[fee.id] || "0"
    const period = input.subscriptionFeePeriods[fee.id] || "Monthly"
    const interval = period === "Yearly" ? "year" : "month"
    const priceId = generatePriceId()

    const feeCode = `# Create subscription fee: ${fee.name}
curl https://api.stripe.com/v1/prices \\
  -u "{{SECRET_KEY}}:" \\
  -d "product={{PLATFORM_PRODUCT_ID}}" \\
  -d "nickname=${fee.name}" \\
  -d "currency=${input.planCurrency.toLowerCase()}" \\
  -d "unit_amount=${Math.round(parseFloat(amount) * 100)}" \\
  -d "recurring[interval]=${interval}" \\
  -d "recurring[usage_type]=licensed"
# => ${priceId}`

    sections.push({
      title: `Create Subscription Fee: ${fee.name}`,
      language: "curl",
      code: feeCode,
    })
  })

  // 6. Create Subscription (combining all prices)
  const allPriceIds = Object.values(priceIds).filter(Boolean)
  if (allPriceIds.length > 0 || input.planSubscriptionFees.length > 0) {
    const itemLines = allPriceIds.map((priceId, index) => {
      return `  -d "items[${index}][price]=${priceId}"`
    }).join(" \\\n")

    const subscriptionCode = `# Create subscription for customer
curl https://api.stripe.com/v1/subscriptions \\
  -u "{{SECRET_KEY}}:" \\
  -d "customer={{CUSTOMER_ID}}" \\
  -d "description=${input.planName || 'Pricing Plan'}" \\
${itemLines} \\
  -d "billing_cycle_anchor=now" \\
  -d "proration_behavior=none"`

    sections.push({
      title: "Create Subscription",
      language: "curl",
      code: subscriptionCode,
      description: "Subscribe a customer to the pricing plan",
    })
  }

  // 7. Report Usage Example
  const firstMeter = metersToCreate[0]
  if (firstMeter) {
    const [meterName] = firstMeter
    const eventName = toSnakeCase(meterName)

    const usageCode = `# Report usage for ${meterName}
curl https://api.stripe.com/v1/billing/meter_events \\
  -u "{{SECRET_KEY}}:" \\
  -d "event_name=${eventName}" \\
  -d "payload[value]=100" \\
  -d "payload[stripe_customer_id]={{CUSTOMER_ID}}" \\
  -d "timestamp=${Math.floor(Date.now() / 1000)}"`

    sections.push({
      title: "Report Usage",
      language: "curl",
      code: usageCode,
      description: "Send usage events to Stripe",
    })
  }

  // If no sections were generated, show a placeholder
  if (sections.length === 0) {
    sections.push({
      title: "Getting Started",
      language: "curl",
      code: `# Add rate cards and rates to your pricing plan
# to see the Stripe API calls that will be generated.

# Example: Create a metered price
curl https://api.stripe.com/v1/prices \\
  -u "{{SECRET_KEY}}:" \\
  -d "product={{PRODUCT_ID}}" \\
  -d "currency=usd" \\
  -d "unit_amount=100" \\
  -d "recurring[interval]=month" \\
  -d "recurring[usage_type]=metered"`,
      description: "Configure your pricing plan to generate API code",
    })
  }

  return sections
}

function getExpirationTimestamp(period: string): number {
  const now = new Date()
  switch (period) {
    case "Yearly":
      now.setFullYear(now.getFullYear() + 1)
      break
    case "Quarterly":
      now.setMonth(now.getMonth() + 3)
      break
    case "Monthly":
    default:
      now.setMonth(now.getMonth() + 1)
      break
  }
  return Math.floor(now.getTime() / 1000)
}

/**
 * Generate TypeScript SDK code instead of curl
 */
export function generateStripeTypeScriptCode(input: StripeCodeGeneratorInput): string {
  const lines: string[] = [
    "import Stripe from 'stripe';",
    "",
    "const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);",
    "",
    `async function createPricingPlan() {`,
  ]

  // Create meters
  const meterNames = new Set<string>()
  input.planRateCards.forEach((card) => {
    card.rates.forEach((rate) => {
      const meterName = input.rateMeters[rate.id]
      if (meterName) meterNames.add(meterName)
    })
  })

  if (meterNames.size > 0) {
    lines.push("  // Create billing meters")
    meterNames.forEach((meterName) => {
      const varName = toSnakeCase(meterName) + "Meter"
      lines.push(`  const ${varName} = await stripe.billing.meters.create({`)
      lines.push(`    display_name: '${meterName}',`)
      lines.push(`    event_name: '${toSnakeCase(meterName)}',`)
      lines.push(`    default_aggregation: { formula: 'sum' },`)
      lines.push(`  });`)
      lines.push("")
    })
  }

  // Create products and prices
  input.planRateCards.forEach((card, cardIndex) => {
    if (!card.name && card.rates.every((r) => !r.name)) return

    const productName = card.name || "Untitled Rate Card"
    const productVarName = `product${cardIndex}`

    lines.push(`  // Create product: ${productName}`)
    lines.push(`  const ${productVarName} = await stripe.products.create({`)
    lines.push(`    name: '${productName}',`)
    lines.push(`    metadata: {`)
    lines.push(`      plan_name: '${input.planName || "Untitled Plan"}',`)
    lines.push(`    },`)
    lines.push(`  });`)
    lines.push("")

    card.rates.forEach((rate, rateIndex) => {
      if (!rate.name) return

      const priceVarName = `price${cardIndex}_${rateIndex}`
      const priceType = input.ratePriceTypes[rate.id] || "Unit"
      const unitPrice = input.planRateUnitPrices[rate.id] || "0"
      const meterName = input.rateMeters[rate.id]
      const tiers = input.planRateTiers[rate.id] || []

      lines.push(`  // Create price: ${rate.name}`)
      lines.push(`  const ${priceVarName} = await stripe.prices.create({`)
      lines.push(`    product: ${productVarName}.id,`)
      lines.push(`    nickname: '${rate.name}',`)
      lines.push(`    currency: '${input.planCurrency.toLowerCase()}',`)

      if (priceType === "Graduated" || priceType === "Volume") {
        const tierToValues = input.planRateTierToValues[rate.id] || {}
        const tierUnitPrices = input.planRateTierUnitPrices[rate.id] || {}
        const tierFlatFees = input.planRateTierFlatFees[rate.id] || {}

        lines.push(`    billing_scheme: 'tiered',`)
        lines.push(`    tiers_mode: '${priceType.toLowerCase()}',`)
        lines.push(`    tiers: [`)
        tiers.forEach((tierId, tierIndex) => {
          const isLast = tierIndex === tiers.length - 1
          const upTo = isLast ? "'inf'" : tierToValues[tierId] || String((tierIndex + 1) * 1000)
          const tierUnitPrice = tierUnitPrices[tierId] || "0"
          const tierFlatFee = tierFlatFees[tierId] || "0"
          lines.push(`      {`)
          lines.push(`        up_to: ${upTo},`)
          lines.push(`        unit_amount: ${Math.round(parseFloat(tierUnitPrice) * 100)},`)
          lines.push(`        flat_amount: ${Math.round(parseFloat(tierFlatFee) * 100)},`)
          lines.push(`      },`)
        })
        lines.push(`    ],`)
      } else {
        lines.push(`    unit_amount: ${Math.round(parseFloat(unitPrice) * 100)},`)
      }

      lines.push(`    recurring: {`)
      lines.push(`      interval: 'month',`)
      lines.push(`      usage_type: 'metered',`)
      if (meterName) {
        lines.push(`      meter: ${toSnakeCase(meterName)}Meter.id,`)
      }
      lines.push(`    },`)
      lines.push(`  });`)
      lines.push("")
    })
  })

  lines.push("}")
  lines.push("")
  lines.push("createPricingPlan();")

  return lines.join("\n")
}

/**
 * Product-specific code generator input for simpler product + prices flow
 */
export type ProductCodeGeneratorInput = {
  productName: string
  productDescription: string
  productLookupKey: string
  prices: {
    id: number
    name: string
    chargeFrequency: string
    pricingModel: string
    billingPeriod: string
    includeTax: string
    currencies: { id: number; code: string }[]
    currencyAmounts: Record<number, string>
    tiers: number[]
    tierToValues: Record<number, string>
    tierUnitPrices: Record<number, string>
    tierFlatFees: Record<number, string>
    usageBasis: string
    tieredBy: string
    meter: string
  }[]
}

function generateProductPriceId(): string {
  return `price_${Math.random().toString(36).substring(2, 14)}`
}

export function generateProductCode(input: ProductCodeGeneratorInput): CodeSection[] {
  const sections: CodeSection[] = []
  const productId = generateProductId()
  const priceIds: Record<number, string> = {}
  const meterIds: Record<string, string> = {}

  // Collect unique meters
  input.prices.forEach((price) => {
    if (price.meter && !meterIds[price.meter]) {
      meterIds[price.meter] = generateMeterId()
    }
    priceIds[price.id] = generateProductPriceId()
  })

  // 1. Create Meters (if any)
  const metersToCreate = Object.entries(meterIds)
  if (metersToCreate.length > 0) {
    const meterCode = metersToCreate
      .map(([meterName, meterId]) => {
        const eventName = toSnakeCase(meterName)
        return `# Create meter: ${meterName}
curl https://api.stripe.com/v1/billing/meters \\
  -u "{{SECRET_KEY}}:" \\
  -d "display_name=${meterName}" \\
  -d "event_name=${eventName}" \\
  -d "default_aggregation[formula]=sum" \\
  -d "customer_mapping[type]=by_id" \\
  -d "customer_mapping[event_payload_key]=stripe_customer_id"
# => ${meterId}`
      })
      .join("\n\n")

    sections.push({
      title: "Create Billing Meters",
      language: "curl",
      code: meterCode,
      description: "Define usage meters to track consumption",
    })
  }

  // 2. Create Product
  const productName = input.productName || "Untitled Product"
  const productCode = `# Create product: ${productName}
curl https://api.stripe.com/v1/products \\
  -u "{{SECRET_KEY}}:" \\
  -d "name=${productName}"${input.productDescription ? ` \\
  -d "description=${input.productDescription}"` : ""}${input.productLookupKey ? ` \\
  -d "metadata[lookup_key]=${input.productLookupKey}"` : ""} \\
  -d "type=service"
# => ${productId}`

  sections.push({
    title: `Create Product: ${productName}`,
    language: "curl",
    code: productCode,
  })

  // 3. Create Prices
  input.prices.forEach((price) => {
    const priceId = priceIds[price.id]
    const priceName = price.name || "Untitled Price"
    const primaryCurrency = price.currencies[0]
    const currencyCode = primaryCurrency?.code?.toLowerCase() || "usd"
    const unitAmount = primaryCurrency
      ? Math.round(parseFloat(price.currencyAmounts[primaryCurrency.id] || "0") * 100)
      : 0

    const isRecurring = price.chargeFrequency === "Recurring"
    const isTiered = price.pricingModel === "Tiered pricing" || price.pricingModel === "Volume pricing"
    const interval = price.billingPeriod === "Yearly" ? "year" : price.billingPeriod === "Quarterly" ? "quarter" : "month"
    const meterId = price.meter ? meterIds[price.meter] : null

    let priceCode = ""

    if (isTiered && price.tiers.length > 0) {
      const tierLines = price.tiers.map((tierId, index) => {
        const isLast = index === price.tiers.length - 1
        const upTo = isLast ? "inf" : price.tierToValues[tierId] || String((index + 1) * 1000)
        const tierUnitPrice = price.tierUnitPrices[tierId] || "0"
        const tierFlatFee = price.tierFlatFees[tierId] || "0"
        const tierUnitAmount = Math.round(parseFloat(tierUnitPrice) * 100)
        const tierFlatAmount = Math.round(parseFloat(tierFlatFee) * 100)

        return `  -d "tiers[${index}][up_to]=${upTo}" \\
  -d "tiers[${index}][unit_amount]=${tierUnitAmount}" \\
  -d "tiers[${index}][flat_amount]=${tierFlatAmount}"`
      })

      priceCode = `# Create tiered price: ${priceName}
curl https://api.stripe.com/v1/prices \\
  -u "{{SECRET_KEY}}:" \\
  -d "product=${productId}" \\
  -d "nickname=${priceName}" \\
  -d "currency=${currencyCode}" \\
  -d "billing_scheme=tiered" \\
  -d "tiers_mode=${price.tieredBy === "Graduated" ? "graduated" : "volume"}"${isRecurring ? ` \\
  -d "recurring[interval]=${interval}"${meterId ? ` \\
  -d "recurring[usage_type]=metered" \\
  -d "recurring[meter]=${meterId}"` : ` \\
  -d "recurring[usage_type]=licensed"`}` : ""} \\
${tierLines.join(" \\\n")}
# => ${priceId}`
    } else {
      priceCode = `# Create price: ${priceName}
curl https://api.stripe.com/v1/prices \\
  -u "{{SECRET_KEY}}:" \\
  -d "product=${productId}" \\
  -d "nickname=${priceName}" \\
  -d "currency=${currencyCode}" \\
  -d "unit_amount=${unitAmount}"${isRecurring ? ` \\
  -d "recurring[interval]=${interval}"${meterId ? ` \\
  -d "recurring[usage_type]=metered" \\
  -d "recurring[meter]=${meterId}"` : ` \\
  -d "recurring[usage_type]=licensed"`}` : ""}
# => ${priceId}`
    }

    sections.push({
      title: `Create Price: ${priceName}`,
      language: "curl",
      code: priceCode,
    })
  })

  // 4. Create Subscription example (if prices exist)
  const allPriceIds = Object.values(priceIds)
  if (allPriceIds.length > 0) {
    const itemLines = allPriceIds
      .map((priceId, index) => `  -d "items[${index}][price]=${priceId}"`)
      .join(" \\\n")

    const subscriptionCode = `# Create subscription for customer
curl https://api.stripe.com/v1/subscriptions \\
  -u "{{SECRET_KEY}}:" \\
  -d "customer={{CUSTOMER_ID}}" \\
  -d "description=${input.productName || 'Product'}" \\
${itemLines} \\
  -d "billing_cycle_anchor=now" \\
  -d "proration_behavior=none"`

    sections.push({
      title: "Create Subscription",
      language: "curl",
      code: subscriptionCode,
      description: "Subscribe a customer to the product",
    })
  }

  // If no sections, show getting started
  if (sections.length === 0) {
    sections.push({
      title: "Getting Started",
      language: "curl",
      code: `# Add prices to your product
# to see the Stripe API calls that will be generated.

# Example: Create a simple price
curl https://api.stripe.com/v1/prices \\
  -u "{{SECRET_KEY}}:" \\
  -d "product={{PRODUCT_ID}}" \\
  -d "currency=usd" \\
  -d "unit_amount=1000" \\
  -d "recurring[interval]=month"`,
      description: "Configure your product to generate API code",
    })
  }

  return sections
}
