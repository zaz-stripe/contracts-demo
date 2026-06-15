'use client'

import type { ReactNode } from "react"
import { createContext, useContext, useMemo, useState } from "react"

import type { AssistantReferenceKind } from "@/components/ProductAssistantPanel"
import { useSidebarDarkMode } from "@/components/product-catalog/sidebarDarkMode"
import {
  CreditGrantMiniIcon,
  SubscriptionFeeMiniIcon,
  MeterIcon,
  MeteredItemMiniIcon,
  ProductMiniIcon,
  RateCardMiniIcon,
  RateMiniIcon,
} from "@/components/ProductCatalogIcons"
import { cn } from "@/lib/utils"

export type IconographyMode = "color" | "no-color"

type GlyphKind =
  | "plan"
  | "product"
  | "rateCard"
  | "rate"
  | "meter"
  | "meteredItem"
  | "creditGrant"
  | "subscriptionFee"
  | "price"

type GlyphConfig = {
  label: string
  // Background colors from Figma design
  bg: string
  // Icon/text color from Figma design
  iconColor: string
  // Whether the glyph is a "wide" 2-letter pill (RC/PR).
  wide?: boolean
}

// Updated icon colors (no background colors - icons are shown without bg)
export const GLYPH_CONFIG_BY_KIND: Record<GlyphKind, GlyphConfig> = {
  plan: { label: "P", bg: "transparent", iconColor: "#3C4F69" },
  product: { label: "P", bg: "transparent", iconColor: "#3C4F69" },
  rateCard: { label: "RC", bg: "transparent", iconColor: "#3C4F69", wide: true },
  rate: { label: "R", bg: "transparent", iconColor: "#7D8BA4" },
  meter: { label: "M", bg: "transparent", iconColor: "#3C4F69" },
  meteredItem: { label: "#", bg: "transparent", iconColor: "#3C4F69" },
  creditGrant: { label: "C", bg: "transparent", iconColor: "#3C4F69" },
  subscriptionFee: { label: "L", bg: "transparent", iconColor: "#3C4F69" },
  price: { label: "PR", bg: "transparent", iconColor: "#3C4F69", wide: true },
}

export function normalizeKind(kind: GlyphKind | AssistantReferenceKind): GlyphKind {
  switch (kind) {
    case "plan":
      return "plan"
    case "product":
      return "product"
    case "rateCard":
      return "rateCard"
    case "rate":
      return "rate"
    case "meter":
    case "rateMeter":
      return "meter"
    case "meteredItem":
      return "meteredItem"
    case "creditGrant":
      return "creditGrant"
    case "subscriptionFee":
      return "subscriptionFee"
    case "price":
      return "price"
    case "accountName":
    case "accountAddress":
    case "accountWebsite":
    case "accountDescription":
      return "plan" // Fallback for account types (they use custom icons)
  }
}

type IconographyContextValue = {
  mode: IconographyMode
  setMode: (next: IconographyMode) => void
}

const IconographyContext = createContext<IconographyContextValue | null>(null)

export function IconographyProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<IconographyMode>("color")

  const value = useMemo(() => ({ mode, setMode }), [mode])

  return <IconographyContext.Provider value={value}>{children}</IconographyContext.Provider>
}

export function useIconographyMode(): IconographyContextValue {
  const ctx = useContext(IconographyContext)
  if (!ctx) {
    // Safe fallback for any callers not wrapped by provider.
    return { mode: "color", setMode: () => {} }
  }
  return ctx
}

export function getGlyphBackgroundColor(kind: GlyphKind | AssistantReferenceKind): string {
  return GLYPH_CONFIG_BY_KIND[normalizeKind(kind)].bg
}

export function getGlyphIconColor(kind: GlyphKind | AssistantReferenceKind): string {
  return GLYPH_CONFIG_BY_KIND[normalizeKind(kind)].iconColor
}

// Alias for backward compatibility
export function getGlyphTextColor(kind: GlyphKind | AssistantReferenceKind): string {
  return GLYPH_CONFIG_BY_KIND[normalizeKind(kind)].iconColor
}

export function CatalogObjectGlyph({
  kind,
  size = "sm",
  className,
  highlighted = false,
  error = false,
}: {
  kind: GlyphKind | AssistantReferenceKind
  size?: "sm" | "md" | "lg"
  className?: string
  /** When true, uses AI highlight colors (purple bg with purple text) */
  highlighted?: boolean
  /** When true, uses error color (red icon) */
  error?: boolean
}) {
  const { mode } = useIconographyMode()
  const { sidebarDarkMode: isDark } = useSidebarDarkMode()
  const normalized = normalizeKind(kind)
  const cfg = GLYPH_CONFIG_BY_KIND[normalized]

  // Highlight colors: light purple background with purple text (matches "Add rate"/"Add object" button style)
  const highlightBg = "#E0D9FB"
  const highlightText = "#533AFD"
  const errorColor = isDark ? "#F46B7D" : "#DF1B41"

  // Both "color" and "no-color" modes use icons
  // "color" mode adds colored backgrounds, "no-color" shows just the icons
  const h = size === "lg" ? 20 : size === "md" ? 18 : 14

  const iconColor = error ? errorColor : highlighted ? highlightText : mode === "color" ? cfg.iconColor : "#474E5A"

  // When error is true, show the warning circle icon instead of the regular icon
  if (error) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center"
        style={{ width: h, height: h }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.14226 3.74023C5.06719 3.21774 5.47254 2.75 6.0004 2.75C6.52798 2.75 6.93325 3.21728 6.85863 3.73956L6.57215 5.74497C6.53095 6.03334 6.28118 6.24573 5.98994 6.24004C5.70742 6.23452 5.4705 6.02512 5.43032 5.74542L5.14226 3.74023Z" fill={errorColor} />
          <path d="M7 8C7 8.5514 6.5514 9 6 9C5.4486 9 5 8.5514 5 8C5 7.4486 5.4486 7 6 7C6.5514 7 7 7.4486 7 8Z" fill={errorColor} />
          <path fillRule="evenodd" clipRule="evenodd" d="M12 5.99999C12 9.31404 9.31405 12 6 12C2.68595 12 0 9.31404 0 5.99999C0 2.68595 2.68595 0 6 0C9.32231 0 12 2.68595 12 5.99999ZM10.6 5.99999C10.6 8.54085 8.54085 10.6 6 10.6C3.45915 10.6 1.4 8.54085 1.4 5.99999C1.4 3.45915 3.45915 1.4 6 1.4C8.54786 1.4 10.6 3.45789 10.6 5.99999Z" fill={errorColor} />
        </svg>
      </span>
    )
  }

  const getIcon = (color: string) => {
    switch (normalized) {
      case "plan":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ color }}>
            <path d="M9.86599 8.26403C10.1577 8.10138 10.623 8.10649 10.9051 8.27477C11.1871 8.44313 11.1799 8.71149 10.8885 8.87438L6.63748 11.2474C6.00951 11.5979 5.01096 11.5953 4.38845 11.2416L0.219507 8.87145C-0.0696369 8.70715 -0.0736995 8.43884 0.210718 8.27184C0.495324 8.10504 0.960577 8.10284 1.24978 8.26696L5.42068 10.6371C5.47475 10.6676 5.5615 10.6683 5.61599 10.6381L9.86599 8.26403Z" fill="currentColor" />
            <path d="M9.86599 5.55212C10.1577 5.38945 10.623 5.39455 10.9051 5.56286C11.1871 5.73123 11.1799 5.99958 10.8885 6.16247L6.63748 8.53552C6.00951 8.88598 5.01095 8.88339 4.38845 8.52966L0.219507 6.15954C-0.0696369 5.99523 -0.0736995 5.72692 0.210718 5.55993C0.495331 5.39311 0.96057 5.3909 1.24978 5.55505L5.42068 7.92517C5.47475 7.95564 5.56151 7.95639 5.61599 7.92614L9.86599 5.55212Z" fill="currentColor" />
            <path fillRule="evenodd" clipRule="evenodd" d="M4.37576 0.271845C5.0042 -0.0906524 6.02165 -0.0905775 6.65017 0.271845L10.4138 2.4447C11.0419 2.80755 11.042 3.39533 10.4138 3.75817L6.65017 5.93102C6.02172 6.29325 5.00413 6.29332 4.37576 5.93102L0.612085 3.75817C-0.0160347 3.39533 -0.0159895 2.80755 0.612085 2.4447L4.37576 0.271845ZM5.61208 0.871454C5.55751 0.840175 5.46841 0.840175 5.41384 0.871454L1.65017 3.04431C1.59651 3.07579 1.59633 3.12714 1.65017 3.15856L5.41384 5.33142C5.46835 5.36263 5.55752 5.36258 5.61208 5.33142L9.37576 3.15856C9.42985 3.12711 9.42968 3.07582 9.37576 3.04431L5.61208 0.871454Z" fill="currentColor" />
          </svg>
        )
      case "product":
        return <ProductMiniIcon style={{ color }} />
      case "rateCard":
        return <RateCardMiniIcon style={{ color }} />
      case "rate":
        return <RateMiniIcon style={{ color }} />
      case "meter":
        return <MeterIcon className={cn(size === "lg" ? "h-[20px] w-[20px]" : undefined, className)} style={{ color }} />
      case "meteredItem":
        return <MeteredItemMiniIcon style={{ color }} />
      case "creditGrant":
        return <CreditGrantMiniIcon style={{ color }} />
      case "subscriptionFee":
        return <SubscriptionFeeMiniIcon style={{ color }} />
      case "price":
        return <RateMiniIcon style={{ color }} />
    }
  }

  // Always render just the colored icon without background
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center"
      style={{ width: h, height: h }}
    >
      {getIcon(iconColor)}
    </span>
  )
}

export function CatalogObjectGlyphLarge({ kind, className }: { kind: "plan" | "product"; className?: string }) {
  // Both modes now use icons, so always use the CatalogObjectGlyph which handles color/no-color
  return <CatalogObjectGlyph kind={kind} size="lg" className={className} />
}


