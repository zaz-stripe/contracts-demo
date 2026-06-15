'use client'

import { useEffect, useRef, useState } from "react"

type PriceActionsPopoverProps = {
  priceId: number
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

export function PriceActionsPopover({ priceId, onEdit, onDelete }: PriceActionsPopoverProps) {
  const t = (key: string) => key
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative ml-3 inline-flex">
      <button
        ref={triggerRef}
        type="button"
        className="flex items-center justify-center px-1 py-[3px]"
        aria-label={t("Price actions")}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((previous) => !previous)
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="3" viewBox="0 0 14 3" fill="none">
          <path
            d="M7 3C7.82843 3 8.5 2.32843 8.5 1.5C8.5 0.671573 7.82843 0 7 0C6.17157 0 5.5 0.671573 5.5 1.5C5.5 2.32843 6.17157 3 7 3Z"
            fill="#474E5A"
          />
          <path
            d="M12.5 3C13.3284 3 14 2.32843 14 1.5C14 0.671573 13.3284 0 12.5 0C11.6716 0 11 0.671573 11 1.5C11 2.32843 11.6716 3 12.5 3Z"
            fill="#474E5A"
          />
          <path
            d="M1.5 3C2.32843 3 3 2.32843 3 1.5C3 0.671573 2.32843 0 1.5 0C0.671573 0 0 0.671573 0 1.5C0 2.32843 0.671573 3 1.5 3Z"
            fill="#474E5A"
          />
        </svg>
      </button>
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-[calc(100%+6px)] z-20 w-[160px] rounded-[6px] border border-[#D8DEE4] bg-white shadow-[0_12px_32px_rgba(28,32,40,0.12)]"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] font-[500] text-[#353A44] hover:bg-[#F5F6F8]"
            onClick={() => {
              setOpen(false)
              onEdit(priceId)
            }}
          >
            <span>{t("Edit price")}</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between border-t border-[#EBEEF1] px-3 py-2 text-left text-[13px] font-[500] text-[#C0123C] hover:bg-[#F5F6F8]"
            onClick={() => {
              setOpen(false)
              onDelete(priceId)
            }}
          >
            <span>{t("Delete price")}</span>
          </button>
        </div>
      )}
    </div>
  )
}

