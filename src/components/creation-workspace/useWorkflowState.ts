'use client'

import { useState, useCallback, useMemo } from "react"
import type { WorkflowConfig } from "./workflowConfig"

// ── Types ────────────────────────────────────────────────────────────

export type WorkflowObject = {
  id: string
  kind: string
  label: string
  isPlaceholder: boolean
  isComplete: boolean
  data: Record<string, any>
}

export type WorkflowPhase = "editing" | "reviewing"

export type ValidationError = {
  objectId: string
  objectLabel: string
  field: string
}

export type WorkflowState = {
  objects: WorkflowObject[]
  activeObjectId: string | null
  activeObject: WorkflowObject | null
  phase: WorkflowPhase
  /** Validation errors from the last submit attempt */
  validationErrors: ValidationError[]
  /** Clear validation errors */
  clearValidationErrors: () => void
  /** Add a new object of the given kind, make it active, return its id */
  addObject: (kind: string) => string
  /** Remove an object by id */
  removeObject: (id: string) => void
  /** Switch to a different object */
  setActiveObject: (id: string) => void
  /** Update the data for an object */
  updateObjectData: (id: string, data: Record<string, any>) => void
  /** Get suggested next objects that haven't been created yet (or allow multiples) */
  availableNextSuggestions: () => { kind: string; actionLabel: string; reason: string }[]
  /** Get all object kinds that can still be added (for the + button) */
  availableAddOptions: () => { kind: string; label: string }[]
  /** Enter review phase */
  enterReview: () => void
  /** Exit review phase, back to editing */
  exitReview: () => void
  /** Handle the primary button action (submit or enter review depending on lifecycle) */
  handlePrimaryAction: () => void
  /** The workflow config */
  config: WorkflowConfig
}

// ── Hook ─────────────────────────────────────────────────────────────

let nextId = 1

/** Shared filter for + menu options (contextual or general menu kind list). */
export function computeAddOptionsFromMenuKinds(
  config: WorkflowConfig,
  objects: WorkflowObject[],
  menuKinds: string[]
): { kind: string; label: string }[] {
  const existingKinds = new Set(objects.map((o) => o.kind))
  return menuKinds
    .filter((kind) => config.objectKinds[kind])
    .filter((kind) => {
      const cfg = config.objectKinds[kind]
      if (cfg.dependsOn && !existingKinds.has(cfg.dependsOn)) return false
      if (cfg.allowMultiple) return true
      return !existingKinds.has(kind)
    })
    .map((kind) => ({ kind, label: config.objectKinds[kind].label }))
}

export function useWorkflowState(config: WorkflowConfig): WorkflowState {
  const [objects, setObjects] = useState<WorkflowObject[]>(() => {
    const initial = config.objectKinds[config.initialObjectKind]
    if (!initial) return []
    const id = `obj_${nextId++}`
    return [{
      id,
      kind: config.initialObjectKind,
      label: initial.label,
      isPlaceholder: true,
      isComplete: false,
      data: {},
    }]
  })

  const [activeObjectId, setActiveObjectId] = useState<string | null>(
    () => objects[0]?.id ?? null
  )

  const [phase, setPhase] = useState<WorkflowPhase>("editing")

  const activeObject = useMemo(
    () => objects.find((o) => o.id === activeObjectId) ?? null,
    [objects, activeObjectId]
  )

  const addObject = useCallback(
    (kind: string): string => {
      const kindConfig = config.objectKinds[kind]
      if (!kindConfig) throw new Error(`Unknown object kind: ${kind}`)
      const id = `obj_${nextId++}`
      const existingCount = objects.filter((o) => o.kind === kind).length
      const obj: WorkflowObject = {
        id,
        kind,
        label: existingCount > 0 ? `${kindConfig.label} ${existingCount + 1}` : kindConfig.label,
        isPlaceholder: true,
        isComplete: false,
        data: {},
      }
      setObjects((prev) => [...prev, obj])
      setActiveObjectId(id)
      // If we were in review, go back to editing
      setPhase("editing")
      return id
    },
    [config, objects]
  )

  const removeObject = useCallback(
    (id: string) => {
      const removedKind = objects.find((o) => o.id === id)?.kind
      const dependentIds = removedKind
        ? objects
            .filter((o) => config.objectKinds[o.kind]?.dependsOn === removedKind)
            .map((o) => o.id)
        : []
      const allIdsToRemove = new Set([id].concat(dependentIds))

      setObjects((prev) => prev.filter((o) => !allIdsToRemove.has(o.id)))
      setActiveObjectId((prev) => {
        if (prev && allIdsToRemove.has(prev)) {
          const remaining = objects.filter((o) => !allIdsToRemove.has(o.id))
          return remaining[remaining.length - 1]?.id ?? null
        }
        return prev
      })
    },
    [objects, config]
  )

  const checkCompletion = useCallback(
    (kind: string, data: Record<string, any>): boolean => {
      const kindConfig = config.objectKinds[kind]
      if (kindConfig?.requiredFields && kindConfig.requiredFields.length > 0) {
        return kindConfig.requiredFields.every(
          (f) => typeof data[f] === "string" && data[f].trim().length > 0
        )
      }
      // Fallback: any non-empty field
      return Object.values(data).some(
        (v) => typeof v === "string" && v.trim().length > 0
      )
    },
    [config]
  )

  const updateObjectData = useCallback(
    (id: string, data: Record<string, any>) => {
      setObjects((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o
          const merged = { ...o.data, ...data }
          const nameField = merged.name || merged.customerName || merged.productName
          return {
            ...o,
            data: merged,
            label: nameField && nameField.trim() ? nameField.trim() : config.objectKinds[o.kind]?.label ?? o.label,
            isPlaceholder: !nameField || !nameField.trim(),
            isComplete: checkCompletion(o.kind, merged),
          }
        })
      )
    },
    [config, checkCompletion]
  )

  const availableNextSuggestions = useCallback(() => {
    if (!activeObject) return []
    const kindConfig = config.objectKinds[activeObject.kind]
    if (!kindConfig?.suggestedNext) return []
    const existingKinds = new Set(objects.map((o) => o.kind))
    return kindConfig.suggestedNext.filter((s) => {
      const targetKind = config.objectKinds[s.kind]
      if (targetKind?.dependsOn && !existingKinds.has(targetKind.dependsOn)) return false
      if (targetKind?.allowMultiple) return true
      return !existingKinds.has(s.kind)
    })
  }, [activeObject, config, objects])

  const availableAddOptions = useCallback(() => {
    const menuKinds = config.addMenuKinds ?? Object.keys(config.objectKinds)
    return computeAddOptionsFromMenuKinds(config, objects, menuKinds)
  }, [config, objects])

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const clearValidationErrors = useCallback(() => setValidationErrors([]), [])

  const enterReview = useCallback(() => setPhase("reviewing"), [])
  const exitReview = useCallback(() => setPhase("editing"), [])

  const validate = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = []
    for (const obj of objects) {
      const kindConfig = config.objectKinds[obj.kind]
      if (!kindConfig?.requiredFields) continue
      for (const field of kindConfig.requiredFields) {
        const value = obj.data[field]
        if (!value || (typeof value === "string" && !value.trim())) {
          errors.push({ objectId: obj.id, objectLabel: obj.label, field })
        }
      }
    }
    return errors
  }, [objects, config])

  const handlePrimaryAction = useCallback(() => {
    // Single object: just create directly
    if (objects.length <= 1) {
      const errors = validate()
      if (errors.length > 0) {
        setValidationErrors(errors)
        return
      }
      setValidationErrors([])
      console.log("Created!", objects)
      return
    }

    // Multiple objects: validate, show errors if any, otherwise create
    const errors = validate()
    if (errors.length > 0) {
      setValidationErrors(errors)
      // Navigate to the first object with an error
      const firstError = errors[0]
      if (firstError) {
        setActiveObjectId(firstError.objectId)
      }
      return
    }

    setValidationErrors([])
    console.log("Created all!", objects)
  }, [objects, validate])

  return {
    objects,
    activeObjectId,
    activeObject,
    phase,
    validationErrors,
    clearValidationErrors,
    addObject,
    removeObject,
    setActiveObject: setActiveObjectId,
    updateObjectData,
    availableNextSuggestions,
    availableAddOptions,
    enterReview,
    exitReview,
    handlePrimaryAction,
    config,
  }
}
