'use client'

import type { ReactNode, HTMLAttributes, ReactElement } from 'react'
import { cloneElement, isValidElement, useCallback } from 'react'
import { useFieldDescription, FIELD_DESCRIPTIONS, type FieldDescriptionInfo } from './FieldDescriptionContext'

type WithFieldDescriptionProps = {
  fieldId: string
  children: ReactNode
}

/**
 * Wrapper component that adds hover/focus tracking for field descriptions.
 * Wraps children in a span with hover handlers.
 */
export function WithFieldDescription({ fieldId, children }: WithFieldDescriptionProps) {
  const { setActiveField } = useFieldDescription()
  const field = FIELD_DESCRIPTIONS[fieldId]

  const handleMouseEnter = useCallback(() => {
    if (field) {
      setActiveField(field)
    }
  }, [field, setActiveField])

  const handleMouseLeave = useCallback(() => {
    setActiveField(null)
  }, [setActiveField])

  return (
    <span
      className="contents"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </span>
  )
}

type FieldDescriptionAreaProps = HTMLAttributes<HTMLDivElement> & {
  fieldId: string
  children: ReactNode
}

/**
 * A div that sets the field description on hover.
 * Useful for wrapping larger areas like entire form sections.
 */
export function FieldDescriptionArea({ fieldId, children, className, ...props }: FieldDescriptionAreaProps) {
  const { setActiveField } = useFieldDescription()
  const field = FIELD_DESCRIPTIONS[fieldId]

  const handleMouseEnter = useCallback(() => {
    if (field) {
      setActiveField(field)
    }
  }, [field, setActiveField])

  const handleMouseLeave = useCallback(() => {
    setActiveField(null)
  }, [setActiveField])

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Hook to get props for field description tracking.
 * Returns handlers that can be spread onto any element.
 */
export function useFieldDescriptionProps(fieldId: string) {
  const { setActiveField } = useFieldDescription()
  const field = FIELD_DESCRIPTIONS[fieldId]

  const onMouseEnter = useCallback(() => {
    if (field) {
      setActiveField(field)
    }
  }, [field, setActiveField])

  const onMouseLeave = useCallback(() => {
    setActiveField(null)
  }, [setActiveField])

  const onFocus = useCallback(() => {
    if (field) {
      setActiveField(field)
    }
  }, [field, setActiveField])

  const onBlur = useCallback(() => {
    setActiveField(null)
  }, [setActiveField])

  return { onMouseEnter, onMouseLeave, onFocus, onBlur }
}

/**
 * Set field description with a custom field object (not from the predefined map).
 */
export function useCustomFieldDescription() {
  const { setActiveField } = useFieldDescription()

  const setField = useCallback((field: FieldDescriptionInfo | null) => {
    setActiveField(field)
  }, [setActiveField])

  const clearField = useCallback(() => {
    setActiveField(null)
  }, [setActiveField])

  return { setField, clearField }
}
