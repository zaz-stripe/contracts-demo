"use client"

import { useMemo } from "react"
import type { AssistantReference } from "@/components/ProductAssistantPanel"
import type { TreeNode } from "./objectMapTypes"
import { ObjectMapBase } from "./ObjectMapBase"

export function ProductObjectMapView(args: {
  t: (key: string) => string
  productName: string
  prices: { id: number; label: string; meter: string }[]
  setActiveObjectForm: (next: "product" | "meter" | "price") => void
  setMeterName: (updater: (prev: string) => string) => void
  onSelectPrice: (priceId: number) => void
  selectedNodeKey?: string | null
  onOpenAssistant?: (ref: AssistantReference) => void
}) {
  const { t, productName, prices, setActiveObjectForm, setMeterName, onSelectPrice, selectedNodeKey, onOpenAssistant } = args

  const root = useMemo<TreeNode>(() => {
    // Keep card heights consistent with `NodeCard`'s typography + padding so content never clips.
    // - Default (single-line body): 24 (header) + 16 (py) + 16 (line) = 56
    // - Two-line body (title + subtitle): 24 + 16 + 16 + 16 = 72
    // - Emphasis (larger title): 28 (header) + 16 (py) + 20 (line) = 64
    const HEIGHT_ONE_LINE = 56
    const HEIGHT_TWO_LINE = 72
    const HEIGHT_EMPHASIS = 64

    const productNode: TreeNode = {
      key: "product",
      headerLabel: t("Product"),
      title: productName || t("Product name"),
      emphasis: true,
      w: 220,
      h: HEIGHT_EMPHASIS,
      onClick: () => setActiveObjectForm("product"),
    }

    const meterNode: TreeNode = {
      key: "meter",
      headerLabel: t("Meter"),
      title: t("Meter"),
      subtitle: t("Usage"),
      w: 220,
      h: HEIGHT_TWO_LINE,
      onClick: () => setActiveObjectForm("meter"),
    }

    const pricesNode: TreeNode = {
      key: "prices",
      headerLabel: t("Prices"),
      title: t("Prices"),
      subtitle: t("Billing"),
      w: 220,
      h: HEIGHT_TWO_LINE,
      onClick: () => setActiveObjectForm("price"),
      children: prices.map((p) => ({
        key: `price:${p.id}`,
        headerLabel: t("Price"),
        title: p.label || t("Price"),
        subtitle: p.meter ? `${t("Meter")}: ${p.meter}` : t("Billing"),
        w: 220,
        h: HEIGHT_TWO_LINE,
        onClick: () => {
          setActiveObjectForm("price")
          onSelectPrice(p.id)
          if (p.meter) setMeterName(() => p.meter)
        },
      })),
    }

    const checkout: TreeNode = {
      key: "product:checkout",
      headerLabel: t("Checkout"),
      title: t("Checkout"),
      muted: true,
      w: 220,
      h: 24,
      children: [
        {
          key: "product:customer",
          headerLabel: t("Customer"),
          title: t("Customer"),
          muted: true,
          w: 220,
          h: 24,
          children: [
            {
              key: "product:automaticTax",
              headerLabel: t("Automatic tax"),
              title: t("Automatic tax"),
              muted: true,
              w: 220,
              h: 24,
            },
            {
              key: "product:invoice",
              headerLabel: t("Invoice"),
              title: t("Invoice"),
              muted: true,
              w: 220,
              h: 24,
            },
          ],
        },
      ],
    }

    // Suppress unused variable warnings - these are intentionally defined for documentation
    void HEIGHT_ONE_LINE

    productNode.children = [pricesNode, meterNode, checkout]
    return productNode
  }, [t, productName, prices, setActiveObjectForm, setMeterName, onSelectPrice])

  return (
    <ObjectMapBase
      root={root}
      stickyAnchorKey="product"
      selectedNodeKey={selectedNodeKey}
      topInsetPx={44}
      onOpenAssistant={onOpenAssistant}
    />
  )
}
