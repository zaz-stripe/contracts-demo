'use client'

import { cn } from "@/lib/utils"
import { CatalogObjectGlyph } from "@/components/product-catalog/iconography"

export type SubscriptionNode = {
  type: "agreement" | "customer" | "product"
  id?: string
}

type SubscriptionSidebarNavProps = {
  activeNode: SubscriptionNode
  onSelectNode: (node: SubscriptionNode) => void
  customer: string
  products: string[]
  duration: string
  onAddItem?: (e: React.MouseEvent) => void
}

function IconSlot({ children }: { children: React.ReactNode }) {
  return <span className="flex h-[14px] min-w-[14px] shrink-0 items-center justify-center">{children}</span>
}

function SubscriptionNavIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M9.86599 8.26403C10.1577 8.10138 10.623 8.10649 10.9051 8.27477C11.1871 8.44313 11.1799 8.71149 10.8885 8.87438L6.63748 11.2474C6.00951 11.5979 5.01096 11.5953 4.38845 11.2416L0.219507 8.87145C-0.0696369 8.70715 -0.0736995 8.43884 0.210718 8.27184C0.495324 8.10504 0.960577 8.10284 1.24978 8.26696L5.42068 10.6371C5.47475 10.6676 5.5615 10.6683 5.61599 10.6381L9.86599 8.26403Z"
        fill="currentColor"
      />
      <path
        d="M9.86599 5.55212C10.1577 5.38945 10.623 5.39455 10.9051 5.56286C11.1871 5.73123 11.1799 5.99958 10.8885 6.16247L6.63748 8.53552C6.00951 8.88598 5.01095 8.88339 4.38845 8.52966L0.219507 6.15954C-0.0696369 5.99523 -0.0736995 5.72692 0.210718 5.55993C0.495331 5.39311 0.96057 5.3909 1.24978 5.55505L5.42068 7.92517C5.47475 7.95564 5.56151 7.95639 5.61599 7.92614L9.86599 5.55212Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.37576 0.271845C5.0042 -0.0906524 6.02165 -0.0905775 6.65017 0.271845L10.4138 2.4447C11.0419 2.80755 11.042 3.39533 10.4138 3.75817L6.65017 5.93102C6.02172 6.29325 5.00413 6.29332 4.37576 5.93102L0.612085 3.75817C-0.0160347 3.39533 -0.0159895 2.80755 0.612085 2.4447L4.37576 0.271845ZM5.61208 0.871454C5.55751 0.840175 5.46841 0.840175 5.41384 0.871454L1.65017 3.04431C1.59651 3.07579 1.59633 3.12714 1.65017 3.15856L5.41384 5.33142C5.46835 5.36263 5.55752 5.36258 5.61208 5.33142L9.37576 3.15856C9.42985 3.12711 9.42968 3.07582 9.37576 3.04431L5.61208 0.871454Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function SubscriptionSidebarNav({ activeNode, onSelectNode, customer, products, duration, onAddItem }: SubscriptionSidebarNavProps) {
  const isActive = (type: SubscriptionNode["type"], id?: string) =>
    activeNode.type === type && activeNode.id === id

  const textPrimary = "text-[#353A44]"
  const textSecondary = "text-[#6C7688]"
  const hoverBg = "hover:bg-[#F4F7FA]"
  const activeBg = "bg-[#F7F5FD]"

  const planRowBase = `flex w-full items-center gap-[8px] rounded-[6px] pl-[12px] pr-[8px] py-[4px] text-left text-[12px] font-[500] leading-[16px] tracking-[-0.024px] ${textPrimary}`
  const rowBase = `flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left text-[12px] font-[400] leading-[16px] ${textPrimary}`
  const childRowIndent = "pl-[15px]"
  const grandchildRowIndent = "pl-[37px]"

  return (
    <aside className="group/nav relative z-10 flex h-full w-full flex-col bg-white/[0.97] backdrop-blur-[6px] pt-[12px] sm:w-[280px] sm:min-w-[280px] sm:max-w-[280px] sm:shrink-0 sm:border-r border-[#EBEEF1]">
      <div className="flex min-h-0 flex-1 flex-col gap-[2px]">
        <div className="min-h-0 flex-1 overflow-y-auto px-[8px]">
          <div className="flex flex-col gap-[2px]">
            {/* Agreement root (same as plan row) */}
            <button
              type="button"
              className={cn(planRowBase, "justify-between", isActive("agreement") ? activeBg : hoverBg)}
              onClick={() => onSelectNode({ type: "agreement" })}
            >
              <div className="flex min-w-0 flex-1 items-center justify-start gap-[8px] text-left">
                <IconSlot>
                  <SubscriptionNavIcon className="text-[#3C4F69]" />
                </IconSlot>
                <span className="min-w-0 flex-1 truncate">Agreement</span>
              </div>
              <span className={cn("text-[11px] font-[400] shrink-0", textSecondary)}>{duration}</span>
            </button>

            {/* Customer (child level, person icon) */}
            <button
              type="button"
              className={cn(rowBase, childRowIndent, isActive("customer") ? activeBg : hoverBg)}
              onClick={() => onSelectNode({ type: "customer" })}
            >
              <IconSlot>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="6" cy="4" r="2.25" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M2.5 11c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </IconSlot>
              <span className="min-w-0 flex-1 truncate">{customer || "Customer"}</span>
            </button>

            {/* Items (child level) */}
            {products.map((product) => (
              <button
                key={product}
                type="button"
                className={cn(rowBase, childRowIndent, isActive("product", product) ? activeBg : hoverBg)}
                onClick={() => onSelectNode({ type: "product", id: product })}
              >
                <IconSlot>
                  <CatalogObjectGlyph kind="subscriptionFee" />
                </IconSlot>
                <span className="min-w-0 flex-1 truncate">{product}</span>
              </button>
            ))}

            {/* Add item row */}
            {onAddItem && (
              <button
                type="button"
                data-add-item-button
                className={`flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[4px] text-left text-[12px] font-[600] leading-[16px] tracking-[-0.024px] text-[#533AFD] hover:bg-[#F5F6F8] ${childRowIndent}`}
                onClick={(e) => onAddItem?.(e)}
              >
                <IconSlot>
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5.75 0.75C5.75 0.335786 5.41421 0 5 0C4.58579 0 4.25 0.335786 4.25 0.75V4.25H0.75C0.335786 4.25 0 4.58579 0 5C0 5.41421 0.335786 5.75 0.75 5.75H4.25V9.25C4.25 9.66421 4.58579 10 5 10C5.41421 10 5.75 9.66421 5.75 9.25V5.75H9.25C9.66421 5.75 10 5.41421 10 5C10 4.58579 9.66421 4.25 9.25 4.25H5.75V0.75Z" fill="#533AFD"/>
                  </svg>
                </IconSlot>
                <span>Add item</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
