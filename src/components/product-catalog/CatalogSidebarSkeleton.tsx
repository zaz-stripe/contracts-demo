'use client'

import { useState } from "react"

type CatalogSidebarSkeletonProps = {
  onOpenFlow?: (flow: string) => void
  activeFlow?: string | null
  subscriptionsLabel?: string
}

const navItemBase = "flex items-center gap-[10px] rounded-[6px] px-[8px] py-[6px] text-left text-[13px] leading-[16px] tracking-[-0.065px] transition-colors"

export function CatalogSidebarSkeleton({ onOpenFlow, activeFlow, subscriptionsLabel = "Agreements" }: CatalogSidebarSkeletonProps = {}) {
  const isCatalogActive = activeFlow === "product-catalog"

  return (
    <aside
      className="hidden w-[240px] flex-col border-r border-[#F5F5F5] bg-white px-6 py-[18px] lg:flex"
    >
      <div className="mb-[44px] flex items-center gap-[9px]">
        <div className="h-[24px] w-[24px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
        <div className="h-[11px] w-[78px] shrink-0 rounded-[40px] bg-[#F5F6F8]" />
      </div>

      <div className="flex flex-col gap-[44px]">
        {/* Group 1: 4 skeleton items + Product catalog */}
        <div className="flex w-full flex-col gap-[4px]">
          {[37, 57, 81, 68].map((width, i) => (
            <div
              key={`nav-g1-${i}`}
              className="flex items-center gap-[13px] px-[8px] py-[6px]"
            >
              <div className="h-[16px] w-[16px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
              <div
                className="h-[11px] shrink-0 rounded-[40px] bg-[#F5F6F8]"
                style={{ width: `${width}px` }}
              />
            </div>
          ))}
          <button
            type="button"
            className={`${navItemBase} ${activeFlow === "customers" ? "font-[600] text-[#533AFD]" : "font-[500] text-[#353A44] hover:bg-[#F5F6F8]"}`}
            onClick={() => onOpenFlow?.("customers")}
          >
            <div className={`h-[16px] w-[16px] shrink-0 rounded-[4px] ${activeFlow === "customers" ? "bg-[#D8DEE4]" : "bg-[#F5F6F8]"}`} />
            Customers
          </button>
          <button
            type="button"
            className={`${navItemBase} ${
              isCatalogActive
                ? "font-[600] text-[#533AFD]"
                : "font-[500] text-[#353A44] hover:bg-[#F5F6F8]"
            }`}
            onClick={() => onOpenFlow?.("product-catalog")}
          >
            <div className={`h-[16px] w-[16px] shrink-0 rounded-[4px] ${isCatalogActive ? "bg-[#D8DEE4]" : "bg-[#F5F6F8]"}`} />
            Product catalog
          </button>
        </div>

        {/* Group 2: skeleton items */}
        <div className="flex w-full flex-col gap-[14px]">
          <div className="h-[11px] w-[53px] shrink-0 rounded-[40px] bg-[#F5F6F8]" />
          {[51, 127, 118, 86, 132].map((width, i) => (
            <div key={`nav-g2-${i}`} className="flex items-center gap-[13px]">
              <div className="h-[16px] w-[16px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
              <div className="h-[11px] shrink-0 rounded-[40px] bg-[#F5F6F8]" style={{ width: `${width}px` }} />
            </div>
          ))}
        </div>

        {/* Group 3: Billing */}
        <div className="flex w-full flex-col gap-[2px]">
          <p className="mb-[8px] px-[8px] text-[11px] font-[500] uppercase tracking-[0.5px] text-[#6C7688]">Billing</p>

          {/* Overview */}
          <button
            type="button"
            className={`${navItemBase} ${activeFlow === "billing-overview" ? "font-[600] text-[#533AFD]" : "font-[500] text-[#353A44] hover:bg-[#F5F6F8]"}`}
            onClick={() => onOpenFlow?.("billing-overview")}
          >
            <div className={`h-[16px] w-[16px] shrink-0 rounded-[4px] ${activeFlow === "billing-overview" ? "bg-[#D8DEE4]" : "bg-[#F5F6F8]"}`} />
            Overview
          </button>

          {/* Agreements */}
          <button
            type="button"
            className={`${navItemBase} ${activeFlow === "agreements" ? "font-[600] text-[#533AFD]" : "font-[500] text-[#353A44] hover:bg-[#F5F6F8]"}`}
            onClick={() => onOpenFlow?.("agreements")}
          >
            <div className={`h-[16px] w-[16px] shrink-0 rounded-[4px] ${activeFlow === "agreements" ? "bg-[#D8DEE4]" : "bg-[#F5F6F8]"}`} />
            {subscriptionsLabel}
          </button>

          {/* Invoices */}
          <button
            type="button"
            className={`${navItemBase} ${activeFlow === "invoices" ? "font-[600] text-[#533AFD]" : "font-[500] text-[#353A44] hover:bg-[#F5F6F8]"}`}
            onClick={() => onOpenFlow?.("invoices")}
          >
            <div className={`h-[16px] w-[16px] shrink-0 rounded-[4px] ${activeFlow === "invoices" ? "bg-[#D8DEE4]" : "bg-[#F5F6F8]"}`} />
            Invoices
          </button>

          {/* Lifecycle */}
          <button
            type="button"
            className={`${navItemBase} ${activeFlow === "lifecycle" ? "font-[600] text-[#533AFD]" : "font-[500] text-[#353A44] hover:bg-[#F5F6F8]"}`}
            onClick={() => onOpenFlow?.("lifecycle")}
          >
            <div className={`h-[16px] w-[16px] shrink-0 rounded-[4px] ${activeFlow === "lifecycle" ? "bg-[#D8DEE4]" : "bg-[#F5F6F8]"}`} />
            Lifecycle
          </button>
        </div>

        {/* Group 4: smaller items */}
        <div className="flex w-full flex-col gap-[14px]">
          <div className="h-[11px] w-[53px] shrink-0 rounded-[40px] bg-[#F5F6F8]" />
          {[51, 61, 36, 61, 31].map((width, i) => (
            <div key={`nav-g4-${i}`} className="flex items-center gap-[13px]">
              <div className="h-[16px] w-[16px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
              <div className="h-[11px] shrink-0 rounded-[40px] bg-[#F5F6F8]" style={{ width: `${width}px` }} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom menu */}
      <BottomMenu />
    </aside>
  )
}

function BottomMenu() {
  const [showDesignSystem, setShowDesignSystem] = useState(false)

  return (
    <div className="relative mt-auto border-t border-[#F5F5F5] pt-[12px]">
      <button
        type="button"
        className="flex items-center gap-[8px] rounded-[6px] px-[8px] py-[6px] text-[12px] font-[500] text-[#596171] hover:bg-[#F5F6F8] transition-colors w-full text-left"
        onClick={() => setShowDesignSystem(true)}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="5" height="5" rx="1.5" stroke="#596171" strokeWidth="1.2" />
          <rect x="8" y="1" width="5" height="5" rx="1.5" stroke="#596171" strokeWidth="1.2" />
          <rect x="1" y="8" width="5" height="5" rx="1.5" stroke="#596171" strokeWidth="1.2" />
          <rect x="8" y="8" width="5" height="5" rx="1.5" stroke="#596171" strokeWidth="1.2" />
        </svg>
        Design system
      </button>

      {showDesignSystem && <DesignSystemPopover onClose={() => setShowDesignSystem(false)} />}
    </div>
  )
}

function DesignSystemPopover({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute bottom-[40px] left-0 z-50 w-[340px] max-h-[480px] overflow-y-auto rounded-[8px] border border-[#D4DEE9] bg-white shadow-[0px_15px_35px_0px_rgba(48,49,61,0.08),0px_5px_15px_0px_rgba(0,0,0,0.12)] p-[16px]">
        <div className="flex items-center justify-between mb-[12px]">
          <h3 className="text-[14px] font-[600] leading-[20px] text-[#1A1A1A]">Design System</h3>
          <button type="button" onClick={onClose} className="text-[#596171] hover:text-[#353A44]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <Section title="Colors">
          <ColorRow label="Primary" value="#533AFD" />
          <ColorRow label="Button" value="#675DFF" />
          <ColorRow label="Text primary" value="#353A44" />
          <ColorRow label="Text secondary" value="#596171" />
          <ColorRow label="Border" value="#EBEEF1" />
          <ColorRow label="Input border" value="#D8DEE4" />
          <ColorRow label="Focus ring" value="#A0D0F7" />
          <ColorRow label="Active bg" value="#F7F5FD" />
          <ColorRow label="Canvas bg" value="#FAFBFC" />
        </Section>

        <Section title="Typography">
          <TypeRow label="Page title" value="28px / 700" />
          <TypeRow label="Panel header" value="14px / 500" />
          <TypeRow label="Modal header" value="14px / 600" />
          <TypeRow label="Form label" value="12px / 500" />
          <TypeRow label="Table header" value="12px / 500" />
          <TypeRow label="Table row" value="13px / 500" />
          <TypeRow label="Tree row" value="12px / 400–500" />
        </Section>

        <Section title="Spacing">
          <TypeRow label="Input height" value="30px" />
          <TypeRow label="Button height (primary)" value="34px" />
          <TypeRow label="Button height (modal)" value="28px" />
          <TypeRow label="Table row height" value="40px" />
          <TypeRow label="Sidebar width" value="280px" />
          <TypeRow label="Editor panel width" value="320px" />
          <TypeRow label="Border radius" value="6px" />
        </Section>

        <Section title="Components">
          <TypeRow label="FormRow" value="Stacked label + input, px-4" />
          <TypeRow label="SegmentedControl" value="Option pills" />
          <TypeRow label="Selector" value="Dropdown, h-30px" />
          <TypeRow label="ProductFormOverlay" value="Full-screen modal" />
          <TypeRow label="CatalogTreeNav" value="Collapsible sidebar tree" />
          <TypeRow label="AddItemPopover" value="Searchable add menu, 264px" />
        </Section>

        <Section title="Status Badges">
          <BadgeRow label="Active" bg="#E7F9ED" text="#1A7F37" />
          <BadgeRow label="Trialing" bg="#EEF1FF" text="#533AFD" />
          <BadgeRow label="Warning" bg="#FFF4E5" text="#B45309" />
          <BadgeRow label="Neutral" bg="#F4F7FA" text="#596171" />
        </Section>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-[14px]">
      <p className="text-[11px] font-[600] uppercase tracking-[0.4px] text-[#6C7688] mb-[6px]">{title}</p>
      <div className="flex flex-col gap-[4px]">{children}</div>
    </div>
  )
}

function ColorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-[2px]">
      <div className="flex items-center gap-[8px]">
        <span className="h-[12px] w-[12px] rounded-[3px] border border-[#EBEEF1]" style={{ backgroundColor: value }} />
        <span className="text-[12px] font-[400] text-[#353A44]">{label}</span>
      </div>
      <span className="text-[11px] font-mono text-[#596171]">{value}</span>
    </div>
  )
}

function TypeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-[2px]">
      <span className="text-[12px] font-[400] text-[#353A44]">{label}</span>
      <span className="text-[11px] font-mono text-[#596171]">{value}</span>
    </div>
  )
}

function BadgeRow({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <div className="flex items-center justify-between py-[2px]">
      <span className="inline-flex items-center rounded-[4px] px-[6px] py-[2px] text-[12px] font-[500]" style={{ backgroundColor: bg, color: text }}>{label}</span>
      <span className="text-[11px] font-mono text-[#596171]">{bg}</span>
    </div>
  )
}
