'use client'

import { useEffect, useMemo, useState } from "react"
import { ProductFormOverlay } from "@/components/ProductFormOverlay"
import { ExitIcon } from "@/components/ProductCatalogIcons"
import { AddItemPopover, type AddItemCatalogEntry } from "@/components/product-catalog/AddItemPopover"
import { CatalogTreeNav, type TreeNodeId, type CatalogTreeData, type ProductNode } from "@/components/product-catalog/CatalogTreeNav"
import { SubscriptionPreviewCard } from "@/components/product-catalog/SubscriptionPreviewCard"
import { SubscriptionGetStarted } from "./SubscriptionGetStarted"
import { SubscriptionEditorPanel } from "./SubscriptionEditorPanel"

export type SubscriptionInitialData = {
  id?: string
  customer: string
  items: string
  duration?: string
  treeData?: {
    products?: ProductNode[]
    priceGroups?: { id: string; name: string; products?: ProductNode[] }[]
    plans?: { id: string; name: string; description?: string; products?: ProductNode[]; priceGroups?: { id: string; name: string; products?: ProductNode[] }[]; creditGrants?: { id: string; name: string; amount?: string; period?: string }[] }[]
  }
}

type CatalogPlan = {
  id: number
  name: string
  description?: string
  creditGrants?: { id: number; name: string; amount?: string; period?: string }[]
  subscriptionFees?: { id: number; name: string; amount?: string; period?: string }[]
  rateCards?: { id: number; name: string; servicingPeriod?: string; rates: { id: number; name: string; unitPrice?: string; meter?: string }[] }[]
}

type SubscriptionEditorModalProps = {
  onClose: () => void
  onSave?: (data: { customer: string; items: string; treeData: { products: ProductNode[]; priceGroups: { id: string; name: string; products?: ProductNode[] }[]; plans: { id: string; name: string; description?: string; products?: ProductNode[]; priceGroups?: { id: string; name: string; products?: ProductNode[] }[]; creditGrants?: { id: string; name: string; amount?: string; period?: string }[] }[] } }) => void
  catalogProducts?: { id: number; name: string; amount?: string; billingPeriod?: string; pricingModel?: string; unitPrice?: string; unitLabel?: string }[]
  catalogPricingPlans?: CatalogPlan[]
  catalogPriceGroups?: { id: number; name: string }[]
  initialData?: SubscriptionInitialData
}


type StoredPriceGroup = { id: number; name: string; rates: { id: number; name: string }[]; selectedProductIds?: number[] }

function loadPriceGroupsFromStorage(): StoredPriceGroup[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem("product-catalog-price-groups")
    const stored: StoredPriceGroup[] = raw ? JSON.parse(raw) : []
    return stored
  } catch { return [] }
}

function loadStandaloneProductsFromStorage(): { id: number; name: string; amount?: string; billingPeriod?: string; pricingModel?: string; unitPrice?: string; unitLabel?: string }[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem("product-catalog-standalone-products")
    const stored: { id: number; name: string; price?: string; cadence?: string; type?: string; prices?: { pricingModel?: string; price?: string; cadence?: string }[] }[] = raw ? JSON.parse(raw) : []
    return stored.map((p) => {
      const firstPrice = p.prices?.[0]
      const pricingModel = firstPrice?.pricingModel ?? p.type ?? ""
      const amount = firstPrice?.price ?? p.price ?? ""
      const billingPeriod = firstPrice?.cadence ?? p.cadence ?? "Monthly"
      const unitPrice = firstPrice?.price ?? ""
      const unitLabel = (p as Record<string, unknown>).unitLabel as string ?? ""
      return { id: p.id, name: p.name, amount, billingPeriod, pricingModel, unitPrice: unitPrice || undefined, unitLabel: unitLabel || undefined }
    })
  } catch { return [] }
}

export function SubscriptionEditorModal({ onClose, onSave, catalogProducts, catalogPricingPlans, catalogPriceGroups, initialData }: SubscriptionEditorModalProps) {
  const [storedPriceGroups, setStoredPriceGroups] = useState<StoredPriceGroup[]>([])
  const [storedProducts, setStoredProducts] = useState<{ id: number; name: string; amount?: string; billingPeriod?: string; pricingModel?: string; unitPrice?: string; unitLabel?: string }[]>([])
  useEffect(() => {
    setStoredPriceGroups(loadPriceGroupsFromStorage())
    setStoredProducts(loadStandaloneProductsFromStorage())
  }, [])
  const [showGetStarted, setShowGetStarted] = useState(!initialData)
  const [customer, setCustomer] = useState(initialData?.customer ?? "")
  const [duration, setDuration] = useState(initialData?.duration ?? "Monthly")
  const [treeProducts, setTreeProducts] = useState<ProductNode[]>(() => {
    if (initialData?.treeData?.products) return initialData.treeData.products
    if (!initialData?.items) return []
    return [{ id: "initial-0", name: initialData.items, isUsageBased: true, prices: [{ id: "initial-0-price", name: "Monthly · Usage-based", amount: "", cadence: "Monthly" }] }]
  })
  const [treePriceGroups, setTreePriceGroups] = useState<{ id: string; name: string; products?: ProductNode[] }[]>(() => {
    return initialData?.treeData?.priceGroups ?? []
  })
  const [treePlans, setTreePlans] = useState<{ id: string; name: string; description?: string; products?: ProductNode[]; priceGroups?: { id: string; name: string; products?: ProductNode[] }[]; creditGrants?: { id: string; name: string; amount?: string; period?: string }[] }[]>(() => {
    const plans = initialData?.treeData?.plans ?? []
    return plans.map((plan) => {
      if (plan.description) return plan
      const match = catalogPricingPlans?.find((cp) => cp.name === plan.name)
      return match?.description ? { ...plan, description: match.description } : plan
    })
  })
  const [activeNode, setActiveNode] = useState<TreeNodeId>({ type: "subscription" })
  const [showAddPopover, setShowAddPopover] = useState(false)
  const [addPopoverPos, setAddPopoverPos] = useState({ top: 0, left: 0 })

  const handleGetStartedSubmit = (data: { customer: string; duration: string; products: string[] }) => {
    setCustomer(data.customer)
    setDuration(data.duration)
    const isNumericPrice = (val?: string) => val != null && /^\d/.test(val)

    const productItems: ProductNode[] = []
    const planItems: typeof treePlans = []

    data.products.forEach((name, i) => {
      // Check if this is a pricing plan
      const catalogPlan = (catalogPricingPlans ?? []).find((p) => p.name === name)
      if (catalogPlan) {
        const id = `catalog-plan-${catalogPlan.id}`
        const planProducts: ProductNode[] = []

        if (catalogPlan.subscriptionFees) {
          for (const fee of catalogPlan.subscriptionFees) {
            const amount = fee.amount || ""
            const period = fee.period || "Monthly"
            const priceName = amount ? `${period} · $${amount}` : period
            planProducts.push({ id: `${id}-fee-${fee.id}`, name: fee.name || "Subscription fee", isUsageBased: false, prices: [{ id: `${id}-fee-${fee.id}-price`, name: priceName, amount, cadence: period }] })
          }
        }

        if (catalogPlan.rateCards) {
          for (const card of catalogPlan.rateCards) {
            const isFlat = (card.servicingPeriod ?? "").toLowerCase() === "flat"
            for (const rate of card.rates) {
              const unitPrice = rate.unitPrice || ""
              const cadence = isFlat ? "One-time" : "Monthly"
              const priceName = unitPrice ? `${cadence} · $${unitPrice}${rate.meter ? `/${rate.meter}` : ""}` : `${cadence} · Usage-based`
              planProducts.push({ id: `${id}-rate-${card.id}-${rate.id}`, name: rate.name || card.name, isUsageBased: !isFlat, prices: [{ id: `${id}-rate-${card.id}-${rate.id}-price`, name: priceName, amount: unitPrice, cadence }] })
            }
          }
        }

        const creditGrants = catalogPlan.creditGrants?.map((cg) => ({ id: `${id}-cg-${cg.id}`, name: cg.name, amount: cg.amount, period: cg.period }))

        planItems.push({ id, name, products: planProducts.length > 0 ? planProducts : undefined, creditGrants })
      } else {
        const catalogProduct = allProducts.find((p) => p.name === name)
        const pricingModel = catalogProduct?.pricingModel ?? catalogProduct?.amount ?? "Usage-based"
        const hasPrice = isNumericPrice(catalogProduct?.amount)
        const isUsage = pricingModel.toLowerCase().includes("usage")
        const cadence = catalogProduct?.billingPeriod ?? "Monthly"
        productItems.push({
          id: `item-${i}`,
          name,
          isUsageBased: isUsage,
          prices: [{
            id: `price-${i}`,
            name: hasPrice ? `${cadence} · $${catalogProduct!.amount}` : `${cadence} · ${pricingModel}`,
            amount: hasPrice ? catalogProduct!.amount! : "",
            cadence,
          }],
        })
      }
    })

    setTreeProducts(productItems)
    if (planItems.length > 0) setTreePlans(planItems)
    setShowGetStarted(false)
    setActiveNode({ type: "subscription" })
  }

  const allPriceGroups = useMemo(() => {
    const passed = catalogPriceGroups ?? []
    const stored = storedPriceGroups.filter((sg) => !passed.some((p) => p.id === sg.id))
    return [...passed, ...stored]
  }, [catalogPriceGroups, storedPriceGroups])

  const allProducts = useMemo(() => {
    const passed = catalogProducts ?? []
    const passedIds = new Set(passed.map((p) => p.id))
    const extra = storedProducts.filter((p) => !passedIds.has(p.id))
    return [...passed, ...extra]
  }, [catalogProducts, storedProducts])

  const catalogItemsForPopover: AddItemCatalogEntry[] = useMemo(() => {
    const isNumericPrice = (val?: string) => val != null && /^\d/.test(val)
    return [
      ...(catalogPricingPlans ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        kind: "plan" as const,
      })),
      ...allPriceGroups.map((p) => ({ id: p.id, name: p.name, kind: "price-group" as const })),
      ...allProducts.map((p) => {
        const hasPrice = isNumericPrice(p.amount)
        const pricingModel = p.pricingModel ?? p.amount ?? "Usage-based"
        const isUsage = pricingModel.toLowerCase().includes("usage")
        const cadence = p.billingPeriod ?? "Monthly"
        const displayPrice = hasPrice ? `$${p.amount}` : (p.unitPrice ? `$${p.unitPrice}/${p.unitLabel || "unit"}` : null)
        const priceName = displayPrice ? `${cadence} · ${displayPrice}` : `${cadence} · ${pricingModel}`
        return {
          id: p.id,
          name: p.name,
          kind: "product" as const,
          isUsageBased: isUsage,
          amount: hasPrice ? p.amount : (p.unitPrice ?? undefined),
          prices: [{
            id: p.id,
            name: priceName,
            amount: hasPrice ? p.amount! : (p.unitPrice ?? ""),
            cadence,
          }],
        }
      }),
    ]
  }, [catalogProducts, allPriceGroups, catalogPricingPlans])

  const handleSelectCatalogItem = (item: AddItemCatalogEntry) => {
    const id = `catalog-${item.kind}-${item.id}`
    if (item.kind === "product") {
      if (!treeProducts.some((p) => p.name === item.name)) {
        setTreeProducts((prev) => [...prev, {
          id,
          name: item.name,
          isUsageBased: item.isUsageBased,
          prices: item.prices?.map((p) => ({ id: `${id}-price-${p.id}`, name: p.name, amount: p.amount, cadence: p.cadence })),
        }])
      }
      setActiveNode({ type: "product", id })
    } else if (item.kind === "price-group") {
      if (!treePriceGroups.some((pg) => pg.name === item.name)) {
        const stored = storedPriceGroups.find((sg) => sg.name === item.name)
        const rates = stored?.rates ?? []
        const productIds = stored?.selectedProductIds ?? []
        setTreePriceGroups((prev) => [...prev, {
          id,
          name: item.name,
          products: rates.map((r, idx) => {
            const linkedProductId = productIds[idx]
            const linkedProduct = linkedProductId ? allProducts.find((p) => p.id === linkedProductId) : undefined
            const unitPrice = linkedProduct?.unitPrice
            const unitLabel = linkedProduct?.unitLabel || "unit"
            const priceName = unitPrice ? `Monthly · $${unitPrice}/${unitLabel}` : "Monthly · Usage-based"
            return {
              id: `${id}-rate-${r.id}`,
              name: r.name,
              isUsageBased: true,
              prices: [{ id: `${id}-rate-${r.id}-price`, name: priceName, amount: unitPrice ?? "", cadence: "Monthly" }],
            }
          }),
        }])
      }
      setActiveNode({ type: "price-group", id })
    } else {
      if (!treePlans.some((pl) => pl.name === item.name)) {
        const catalogPlan = (catalogPricingPlans ?? []).find((p) => p.name === item.name)
        const planProducts: ProductNode[] = []

        // Add subscription fees as flat products
        if (catalogPlan?.subscriptionFees) {
          for (const fee of catalogPlan.subscriptionFees) {
            const amount = fee.amount || ""
            const period = fee.period || "Monthly"
            const priceName = amount ? `${period} · $${amount}` : period
            planProducts.push({
              id: `${id}-fee-${fee.id}`,
              name: fee.name || "Subscription fee",
              isUsageBased: false,
              prices: [{ id: `${id}-fee-${fee.id}-price`, name: priceName, amount, cadence: period }],
            })
          }
        }

        // Add rate card rates — use servicingPeriod from the rate card itself
        if (catalogPlan?.rateCards) {
          for (const card of catalogPlan.rateCards) {
            const isFlat = (card.servicingPeriod ?? "").toLowerCase() === "flat"
            const isUsage = !isFlat
            for (const rate of card.rates) {
              const unitPrice = rate.unitPrice || ""
              const rateName = rate.name || card.name
              const cadence = isFlat ? "One-time" : "Monthly"
              const priceName = unitPrice ? `${cadence} · $${unitPrice}${rate.meter ? `/${rate.meter}` : ""}` : (isUsage ? `${cadence} · Usage-based` : cadence)
              planProducts.push({
                id: `${id}-rate-${card.id}-${rate.id}`,
                name: rateName,
                isUsageBased: isUsage,
                prices: [{ id: `${id}-rate-${card.id}-${rate.id}-price`, name: priceName, amount: unitPrice, cadence }],
              })
            }
          }
        }

        // Credit grants
        const creditGrants = catalogPlan?.creditGrants?.map((cg) => ({
          id: `${id}-cg-${cg.id}`,
          name: cg.name,
          amount: cg.amount,
          period: cg.period,
        }))

        setTreePlans((prev) => [...prev, {
          id,
          name: item.name,
          description: catalogPlan?.description,
          products: planProducts.length > 0 ? planProducts : undefined,
          creditGrants,
        }])
      }
      setActiveNode({ type: "plan", id })
    }
  }

  const handleFieldChange = (nodeType: string, nodeId: string, field: string, value: string) => {
    if (nodeType === "price") {
      const updatePrice = (prices: ProductNode["prices"]) => {
        if (!prices) return prices
        return prices.map((p) => {
          if (p.id !== nodeId) return p
          if (field === "amount") {
            const unit = p.unitLabel || (p.name.includes("/") ? p.name.split("/").pop() || "unit" : "unit")
            return { ...p, amount: value, name: `${p.cadence || "Monthly"} · $${value}/${unit}` }
          }
          if (field === "unitLabel") {
            return { ...p, unitLabel: value, name: `${p.cadence || "Monthly"} · $${p.amount || "0"}/${value || "unit"}` }
          }
          return p
        })
      }
      setTreeProducts((prev) => prev.map((p) => ({ ...p, prices: updatePrice(p.prices) })))
      setTreePriceGroups((prev) => prev.map((pg) => ({ ...pg, products: pg.products?.map((p) => ({ ...p, prices: updatePrice(p.prices) })) })))
      setTreePlans((prev) => prev.map((pl) => ({
        ...pl,
        products: pl.products?.map((p) => ({ ...p, prices: updatePrice(p.prices) })),
        priceGroups: pl.priceGroups?.map((pg) => ({ ...pg, products: pg.products?.map((p) => ({ ...p, prices: updatePrice(p.prices) })) })),
      })))
    } else if (nodeType === "product") {
      if (field === "name") {
        setTreeProducts((prev) => prev.map((p) => p.id === nodeId ? { ...p, name: value } : p))
        setTreePriceGroups((prev) => prev.map((pg) => ({ ...pg, products: pg.products?.map((p) => p.id === nodeId ? { ...p, name: value } : p) })))
        setTreePlans((prev) => prev.map((pl) => ({ ...pl, products: pl.products?.map((p) => p.id === nodeId ? { ...p, name: value } : p) })))
      }
    } else if (nodeType === "price-group") {
      if (field === "name") {
        setTreePriceGroups((prev) => prev.map((pg) => pg.id === nodeId ? { ...pg, name: value } : pg))
        setTreePlans((prev) => prev.map((pl) => ({ ...pl, priceGroups: pl.priceGroups?.map((pg) => pg.id === nodeId ? { ...pg, name: value } : pg) })))
      }
    } else if (nodeType === "plan") {
      if (field === "name") {
        setTreePlans((prev) => prev.map((pl) => pl.id === nodeId ? { ...pl, name: value } : pl))
      }
    } else if (nodeType === "credit-grant") {
      if (field === "name") {
        setTreePlans((prev) => prev.map((pl) => ({ ...pl, creditGrants: pl.creditGrants?.map((cg) => cg.id === nodeId ? { ...cg, name: value } : cg) })))
      }
      if (field === "amount") {
        setTreePlans((prev) => prev.map((pl) => ({ ...pl, creditGrants: pl.creditGrants?.map((cg) => cg.id === nodeId ? { ...cg, amount: value } : cg) })))
      }
    }
  }

  const treeData: CatalogTreeData = {
    subscription: { duration },
    customer: customer ? { id: "customer", name: customer } : undefined,
    plans: treePlans.length > 0 ? treePlans : undefined,
    priceGroups: treePriceGroups.length > 0 ? treePriceGroups : undefined,
    products: treeProducts.length > 0 ? treeProducts : undefined,
  }

  const activeNodeName = useMemo(() => {
    if (!activeNode.id) return undefined
    const product = treeProducts.find((p) => p.id === activeNode.id)
    if (product) return product.name
    const pg = treePriceGroups.find((p) => p.id === activeNode.id)
    if (pg) return pg.name
    const plan = treePlans.find((p) => p.id === activeNode.id)
    if (plan) return plan.name
    // Check nested products
    for (const pgr of treePriceGroups) {
      const nested = pgr.products?.find((p) => p.id === activeNode.id)
      if (nested) return nested.name
    }
    for (const pl of treePlans) {
      const nested = pl.products?.find((p) => p.id === activeNode.id)
      if (nested) return nested.name
      for (const pgr of pl.priceGroups ?? []) {
        const deep = pgr.products?.find((p) => p.id === activeNode.id)
        if (deep) return deep.name
      }
    }
    return undefined
  }, [activeNode, treeProducts, treePriceGroups, treePlans])

  const activePriceData = useMemo(() => {
    if (activeNode.type !== "price" || !activeNode.id) return undefined
    const allPriceNodes = [
      ...treeProducts.flatMap((p) => p.prices ?? []),
      ...treePriceGroups.flatMap((pg) => (pg.products ?? []).flatMap((p) => p.prices ?? [])),
      ...treePlans.flatMap((pl) => [
        ...(pl.products ?? []).flatMap((p) => p.prices ?? []),
        ...(pl.priceGroups ?? []).flatMap((pg) => (pg.products ?? []).flatMap((p) => p.prices ?? [])),
      ]),
    ]
    return allPriceNodes.find((p) => p.id === activeNode.id)
  }, [activeNode, treeProducts, treePriceGroups, treePlans])

  const title = showGetStarted ? "New subscription" : initialData ? `Edit subscription — ${customer}` : `Subscription — ${customer}`

  return (
    <ProductFormOverlay
      isOpen={true}
      onClose={onClose}
      ariaLabel="Create subscription"
      header={
        <div className="relative z-10 flex items-center justify-between border-b border-[#EBEEF1] bg-white px-[16px] py-[10px]">
          <p className="text-[14px] font-[600] leading-[20px] tracking-[-0.15px] text-[#1A1A1A]">
            {title}
          </p>
          <div className="flex items-center gap-[10px]">
            {!showGetStarted && (
              <>
                <button
                  type="button"
                  className="h-[28px] rounded-[6px] border border-[#D8DEE4] bg-white px-[10px] py-[6px] text-[12px] font-[600] leading-[14px] tracking-[-0.024px] text-[#353A44] shadow-[0_1px_1px_rgba(33,37,44,0.16)] transition-colors hover:bg-[#F5F6F8]"
                  onClick={onClose}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="h-[28px] whitespace-nowrap rounded-[6px] bg-[#675DFF] px-[10px] py-[6px] text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-white shadow-[0_1px_1px_rgba(47,14,99,0.32)] transition-colors hover:bg-[#5B52F0]"
                  onClick={() => {
                    const allItemNames = [...treeProducts.map((p) => p.name), ...treePriceGroups.map((pg) => pg.name), ...treePlans.map((pl) => pl.name)]
                    onSave?.({ customer, items: allItemNames.join(", ") || "—", treeData: { products: treeProducts, priceGroups: treePriceGroups, plans: treePlans } })
                    onClose()
                  }}
                >
                  {initialData ? "Save subscription" : "Create subscription"}
                </button>
              </>
            )}
            <button
              type="button"
              className="flex h-[28px] w-[28px] items-center justify-center rounded-[6px] transition-colors hover:bg-[#F5F6F8]"
              onClick={onClose}
              aria-label="Close"
            >
              <ExitIcon />
            </button>
          </div>
        </div>
      }
      sidebar={!showGetStarted ? (
        <div
          className="hidden shrink-0 overflow-hidden sm:flex sm:justify-end"
          style={{ width: 280 }}
        >
          <CatalogTreeNav
            data={treeData}
            activeNode={activeNode}
            onSelectNode={setActiveNode}
            rootType="subscription"
            onAddItem={(e) => {
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              setAddPopoverPos({ top: rect.bottom + 4, left: rect.left })
              setShowAddPopover(true)
            }}
          />
        </div>
      ) : undefined}
    >
      <div className="relative flex h-full w-full min-w-0">
        {/* Editor panel (320px) */}
        <div className="relative z-10 flex h-full w-full flex-col bg-white/[0.94] backdrop-blur-[6px] sm:w-[320px] sm:overflow-hidden sm:border-r sm:border-[#EBEEF1]">
          {showGetStarted ? (
            <div className="flex-1 overflow-y-auto">
              <SubscriptionGetStarted onSubmit={handleGetStartedSubmit} catalogItems={[
                ...allProducts.map((p) => ({ id: p.id, name: p.name, kind: "product" as const, priceName: p.unitPrice ? `$${p.unitPrice}/${p.unitLabel || "unit"}` : (p.pricingModel || p.amount || "") })),
                ...allPriceGroups.map((p) => ({ id: p.id, name: p.name, kind: "price-group" as const })),
                ...(catalogPricingPlans ?? []).map((p) => ({ id: p.id, name: p.name, kind: "plan" as const })),
              ]} />
            </div>
          ) : (
            <SubscriptionEditorPanel
              activeNode={activeNode}
              activeNodeName={activeNodeName}
              customer={customer}
              duration={duration}
              products={[...treeProducts.map((i) => i.name), ...treePriceGroups.map((i) => i.name), ...treePlans.map((i) => i.name)]}
              activePriceData={activePriceData}
              onFieldChange={handleFieldChange}
              onDeleteItem={(id) => {
                const nodeType = activeNode.type
                if (nodeType === "product") {
                  setTreeProducts((prev) => prev.filter((p) => p.id !== id && p.name !== id))
                  // Also remove from within price groups and plans
                  setTreePriceGroups((prev) => prev.map((pg) => ({ ...pg, products: pg.products?.filter((p) => p.id !== id) })))
                  setTreePlans((prev) => prev.map((pl) => ({ ...pl, products: pl.products?.filter((p) => p.id !== id) })))
                } else if (nodeType === "price-group") {
                  setTreePriceGroups((prev) => prev.filter((pg) => pg.id !== id && pg.name !== id))
                  setTreePlans((prev) => prev.map((pl) => ({ ...pl, priceGroups: pl.priceGroups?.filter((pg) => pg.id !== id) })))
                } else if (nodeType === "plan") {
                  setTreePlans((prev) => prev.filter((pl) => pl.id !== id && pl.name !== id))
                } else if (nodeType === "price") {
                  // Remove price from within products
                  setTreeProducts((prev) => prev.map((p) => ({ ...p, prices: p.prices?.filter((pr) => pr.id !== id) })))
                  setTreePriceGroups((prev) => prev.map((pg) => ({ ...pg, products: pg.products?.map((p) => ({ ...p, prices: p.prices?.filter((pr) => pr.id !== id) })) })))
                  setTreePlans((prev) => prev.map((pl) => ({ ...pl, products: pl.products?.map((p) => ({ ...p, prices: p.prices?.filter((pr) => pr.id !== id) })) })))
                } else if (nodeType === "credit-grant") {
                  setTreePlans((prev) => prev.map((pl) => ({ ...pl, creditGrants: pl.creditGrants?.filter((cg) => cg.id !== id) })))
                }
                setActiveNode({ type: "subscription" })
              }}
            />
          )}
        </div>

        {/* Preview area */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-[#FAFBFC] p-[24px] flex justify-center items-start">
          {!showGetStarted && (
            <SubscriptionPreviewCard
              customer={customer}
              products={treeProducts.length > 0 ? treeProducts : undefined}
              priceGroups={treePriceGroups.length > 0 ? treePriceGroups : undefined}
              plans={treePlans.length > 0 ? treePlans : undefined}
            />
          )}
        </div>
      </div>

      <AddItemPopover
        isOpen={showAddPopover}
        position={addPopoverPos}
        onClose={() => setShowAddPopover(false)}
        options={[]}
        catalogItems={catalogItemsForPopover}
        onAddNew={() => {}}
        onSelectCatalogItem={handleSelectCatalogItem}
      />
    </ProductFormOverlay>
  )
}
