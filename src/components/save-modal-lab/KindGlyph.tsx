import {
  CreditGrantMiniIcon,
  RateCardMiniIcon,
  SubscriptionFeeMiniIcon,
} from "@/components/ProductCatalogIcons"
import type { ComponentKind } from "./scenarioTypes"

/** Provider-free glyph for the lab. Mirrors the visual of CatalogObjectGlyph
 *  but doesn't require IconographyProvider/SidebarDarkMode context. */
export function KindGlyph({ kind, color = "#3C4F69" }: { kind: ComponentKind; color?: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[14px] w-[14px] items-center justify-center"
    >
      {kind === "rateCard" ? (
        <RateCardMiniIcon style={{ color }} />
      ) : kind === "subscriptionFee" ? (
        <SubscriptionFeeMiniIcon style={{ color }} />
      ) : (
        <CreditGrantMiniIcon style={{ color }} />
      )}
    </span>
  )
}

export const KIND_LABELS: Record<ComponentKind, string> = {
  rateCard: "Price group",
  subscriptionFee: "License fee",
  creditGrant: "Credit grant",
}
