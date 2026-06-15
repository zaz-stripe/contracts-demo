'use client'

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

import type { ComponentDraftState, ComponentKind, ComponentRecord, ComponentVersion } from "@/components/product-catalog/componentTypes"
import {
  SIMULATED_RATE_CARDS,
  SIMULATED_SUBSCRIPTION_FEES,
  SIMULATED_CREDIT_GRANTS,
} from "@/lib/simulated-merchant-components"

// ---------------------------------------------------------------------------
// Build the initial registry from simulated data
// ---------------------------------------------------------------------------

function buildSimulatedRegistry(): ComponentRecord[] {
  const records: ComponentRecord[] = []

  for (const rc of SIMULATED_RATE_CARDS) {
    const rateCount = rc.rates.length
    records.push({
      componentId: rc.id,
      kind: "rateCard",
      name: rc.name,
      summary: `${rateCount} rate${rateCount !== 1 ? "s" : ""}`,
      versions: rc.versions,
      activeVersionId: rc.versions.find((v) => v.isLatest)?.id ?? rc.versions[0]!.id,
    })
  }

  for (const sf of SIMULATED_SUBSCRIPTION_FEES) {
    records.push({
      componentId: sf.id,
      kind: "subscriptionFee",
      name: sf.name,
      summary: `$${sf.amount}`,
      versions: sf.versions,
      activeVersionId: sf.versions.find((v) => v.isLatest)?.id ?? sf.versions[0]!.id,
    })
  }

  for (const cg of SIMULATED_CREDIT_GRANTS) {
    records.push({
      componentId: cg.id,
      kind: "creditGrant",
      name: cg.name,
      summary: `$${cg.amount}`,
      versions: cg.versions,
      activeVersionId: cg.versions.find((v) => v.isLatest)?.id ?? cg.versions[0]!.id,
    })
  }

  return records
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

type MerchantComponentsContextValue = {
  hasComponents: boolean
  setHasComponents: (next: boolean) => void

  /** Full registry of available components */
  componentRegistry: ComponentRecord[]

  /** Filtered getters by kind */
  getRateCardComponents: () => ComponentRecord[]
  getSubscriptionFeeComponents: () => ComponentRecord[]
  getCreditGrantComponents: () => ComponentRecord[]

  /** Look up a specific component */
  getComponent: (componentId: string) => ComponentRecord | undefined

  /** Register a new component (created in this session) */
  registerComponent: (record: ComponentRecord) => void

  /** Add a new version to an existing component (marks it latest, un-latests previous) */
  addVersionToComponent: (componentId: string, version: ComponentVersion) => void

  // Draft state tracking -----------------------------------------------
  getDraftState: (componentId: string) => ComponentDraftState | undefined
  setBaseline: (componentId: string, snapshot: string) => void
  markDirty: (componentId: string) => void
  clearDirty: (componentId: string) => void
  getAllDirtyComponents: () => ComponentDraftState[]
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const MerchantComponentsContext = createContext<MerchantComponentsContextValue | null>(null)

export function MerchantComponentsProvider({ children }: { children: ReactNode }) {
  const [hasComponents, setHasComponents] = useState<boolean>(false)

  // Component registry — simulated + session-created
  const [sessionComponents, setSessionComponents] = useState<ComponentRecord[]>([])
  const simulatedRegistry = useMemo(() => (hasComponents ? buildSimulatedRegistry() : []), [hasComponents])

  // Version additions overlay — new versions added during this session
  const [versionOverlays, setVersionOverlays] = useState<Record<string, ComponentVersion[]>>({})

  const componentRegistry = useMemo(() => {
    const base = [...simulatedRegistry, ...sessionComponents]
    // Merge version overlays into the registry
    const hasOverlays = Object.keys(versionOverlays).length > 0
    if (!hasOverlays) return base
    return base.map((comp) => {
      const added = versionOverlays[comp.componentId]
      if (!added || added.length === 0) return comp
      // Un-latest existing versions, append new versions
      const existingVersions = comp.versions.map((v) => ({ ...v, isLatest: false }))
      const latestAdded = added[added.length - 1]!
      return {
        ...comp,
        versions: [...existingVersions, ...added],
        activeVersionId: latestAdded.id,
      }
    })
  }, [simulatedRegistry, sessionComponents, versionOverlays])

  // Draft state map  (componentId -> draft state)
  const [draftStates, setDraftStates] = useState<Record<string, ComponentDraftState>>({})

  // Filtered getters
  const getRateCardComponents = useCallback(
    () => componentRegistry.filter((c) => c.kind === "rateCard"),
    [componentRegistry],
  )
  const getSubscriptionFeeComponents = useCallback(
    () => componentRegistry.filter((c) => c.kind === "subscriptionFee"),
    [componentRegistry],
  )
  const getCreditGrantComponents = useCallback(
    () => componentRegistry.filter((c) => c.kind === "creditGrant"),
    [componentRegistry],
  )

  const getComponent = useCallback(
    (componentId: string) => componentRegistry.find((c) => c.componentId === componentId),
    [componentRegistry],
  )

  const registerComponent = useCallback((record: ComponentRecord) => {
    setSessionComponents((prev) => [...prev, record])
  }, [])

  const addVersionToComponent = useCallback((componentId: string, version: ComponentVersion) => {
    setVersionOverlays((prev) => ({
      ...prev,
      [componentId]: [...(prev[componentId] ?? []), version],
    }))
  }, [])

  // Draft helpers
  const getDraftState = useCallback(
    (componentId: string) => draftStates[componentId],
    [draftStates],
  )

  const setBaseline = useCallback((componentId: string, snapshot: string) => {
    setDraftStates((prev) => ({
      ...prev,
      [componentId]: { componentId, baselineSnapshot: snapshot, isDirty: false },
    }))
  }, [])

  const markDirty = useCallback((componentId: string) => {
    setDraftStates((prev) => {
      const existing = prev[componentId]
      if (!existing || existing.isDirty) return prev
      return { ...prev, [componentId]: { ...existing, isDirty: true } }
    })
  }, [])

  const clearDirty = useCallback((componentId: string) => {
    setDraftStates((prev) => {
      const existing = prev[componentId]
      if (!existing || !existing.isDirty) return prev
      return { ...prev, [componentId]: { ...existing, isDirty: false } }
    })
  }, [])

  const getAllDirtyComponents = useCallback(
    () => Object.values(draftStates).filter((ds) => ds.isDirty),
    [draftStates],
  )

  const value = useMemo<MerchantComponentsContextValue>(
    () => ({
      hasComponents,
      setHasComponents,
      componentRegistry,
      getRateCardComponents,
      getSubscriptionFeeComponents,
      getCreditGrantComponents,
      getComponent,
      registerComponent,
      addVersionToComponent,
      getDraftState,
      setBaseline,
      markDirty,
      clearDirty,
      getAllDirtyComponents,
    }),
    [
      hasComponents,
      componentRegistry,
      getRateCardComponents,
      getSubscriptionFeeComponents,
      getCreditGrantComponents,
      getComponent,
      registerComponent,
      addVersionToComponent,
      getDraftState,
      setBaseline,
      markDirty,
      clearDirty,
      getAllDirtyComponents,
    ],
  )

  return (
    <MerchantComponentsContext.Provider value={value}>
      {children}
    </MerchantComponentsContext.Provider>
  )
}

export function useMerchantComponents(): MerchantComponentsContextValue {
  const ctx = useContext(MerchantComponentsContext)
  if (!ctx) {
    return {
      hasComponents: false,
      setHasComponents: () => {},
      componentRegistry: [],
      getRateCardComponents: () => [],
      getSubscriptionFeeComponents: () => [],
      getCreditGrantComponents: () => [],
      getComponent: () => undefined,
      registerComponent: () => {},
      addVersionToComponent: () => {},
      getDraftState: () => undefined,
      setBaseline: () => {},
      markDirty: () => {},
      clearDirty: () => {},
      getAllDirtyComponents: () => [],
    }
  }
  return ctx
}
