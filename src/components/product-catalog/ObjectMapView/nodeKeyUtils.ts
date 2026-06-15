import type { AssistantReferenceKind } from "@/components/ProductAssistantPanel"
import { NODE_DESCRIPTIONS } from "./objectMapTypes"

/**
 * Utility class for parsing and working with node keys.
 * Node keys follow the format: "type:id" or "planId:type:id"
 * Examples: "rateCard:123", "plan456:rateCard:123", "plan"
 */
export class NodeKey {
  private readonly raw: string
  private readonly baseKey: string

  constructor(raw: string) {
    this.raw = raw
    // Strip plan ID prefix if present (e.g., "plan123:rateCard:456" -> "rateCard:456")
    this.baseKey = raw.replace(/^plan-?\d+:/, "")
  }

  static parse(raw: string): NodeKey {
    return new NodeKey(raw)
  }

  toString(): string {
    return this.raw
  }

  getBaseKey(): string {
    return this.baseKey
  }

  /**
   * Extract the plan ID from a prefixed key (e.g., "plan123:rateCard:456" -> 123)
   */
  getPlanId(): number | null {
    const match = this.raw.match(/^plan(-?\d+):/)
    if (match?.[1]) {
      const id = parseInt(match[1], 10)
      return Number.isFinite(id) ? id : null
    }
    return null
  }

  /**
   * Extract the entity ID from a key (e.g., "rateCard:456" -> 456)
   */
  getEntityId(): number | null {
    const match = this.baseKey.match(/:(\d+)$/)
    if (match?.[1]) {
      const id = parseInt(match[1], 10)
      return Number.isFinite(id) ? id : null
    }
    return null
  }

  /**
   * Get the type prefix from the key (e.g., "rateCard:456" -> "rateCard")
   */
  getType(): string {
    const colonIndex = this.baseKey.indexOf(":")
    return colonIndex > 0 ? this.baseKey.slice(0, colonIndex) : this.baseKey
  }

  /**
   * Check if this key matches a specific type prefix
   */
  isType(type: string): boolean {
    return this.baseKey === type || this.baseKey.startsWith(`${type}:`)
  }

  /**
   * Get the description for this node from NODE_DESCRIPTIONS
   */
  getDescription(): string | null {
    // Direct match
    if (NODE_DESCRIPTIONS[this.baseKey]) {
      return NODE_DESCRIPTIONS[this.baseKey]
    }

    // Try matching by prefix using type mapping
    const typeToDescriptionKey: Record<string, string> = {
      "plan:checkout": "checkout",
      "plan:customer": "customer",
      "plan:subscription": "subscription",
      "plan:automaticTax": "automaticTax",
      "plan:invoice": "invoice",
      "rateCard": "rateCard",
      "rate": "rate",
      "rateMeter": "rateMeter",
      "creditGrant": "creditGrant",
      "subscriptionFee": "subscriptionFee",
      "price": "price",
      "meter": "meter",
    }

    for (const [prefix, descKey] of Object.entries(typeToDescriptionKey)) {
      if (this.baseKey.startsWith(`${prefix}:`)) {
        return NODE_DESCRIPTIONS[descKey] ?? null
      }
      if (this.baseKey === prefix || this.baseKey.startsWith(prefix)) {
        return NODE_DESCRIPTIONS[descKey] ?? null
      }
    }

    return null
  }

  /**
   * Get the AssistantReferenceKind for this node
   */
  getReferenceKind(): AssistantReferenceKind {
    const typeToKind: Record<string, AssistantReferenceKind> = {
      "plan": "plan",
      "rateCard": "rateCard",
      "rate": "rate",
      "rateMeter": "rateMeter",
      "creditGrant": "creditGrant",
      "subscriptionFee": "subscriptionFee",
      "price": "price",
      "meter": "meter",
      "product": "product",
    }

    // Check plan-prefixed types first
    const planTypes = ["checkout", "customer", "subscription", "automaticTax", "invoice"]
    for (const planType of planTypes) {
      if (this.baseKey.startsWith(`plan:${planType}`)) {
        return "plan"
      }
    }

    // Check direct type matches
    for (const [prefix, kind] of Object.entries(typeToKind)) {
      if (this.baseKey === prefix || this.baseKey.startsWith(`${prefix}:`)) {
        return kind
      }
    }

    return "plan"
  }
}

/**
 * Helper function for quick node description lookup
 */
export function getNodeDescription(key: string): string | null {
  return NodeKey.parse(key).getDescription()
}

/**
 * Helper function for quick reference kind lookup
 */
export function getNodeReferenceKind(key: string): AssistantReferenceKind {
  return NodeKey.parse(key).getReferenceKind()
}
