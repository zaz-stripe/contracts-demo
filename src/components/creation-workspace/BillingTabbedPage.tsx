'use client'

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type BillingTabbedPageProps = {
  title: string
  tabs: string[]
  tabContent?: Record<string, ReactNode>
  headerAction?: ReactNode | ((activeTab: string) => ReactNode)
}

export function BillingTabbedPage({ title, tabs, tabContent, headerAction }: BillingTabbedPageProps) {
  const [activeTab, setActiveTab] = useState(tabs[0])

  const content = tabContent?.[activeTab]
  const renderedAction = typeof headerAction === "function" ? headerAction(activeTab) : headerAction

  return (
    <div>
      <div className="flex items-center justify-between mb-[4px]">
        <h1 className="text-[28px] font-[700] leading-[36px] tracking-[0.38px] text-[#353A44]">{title}</h1>
        {renderedAction}
      </div>

      <div className="flex border-b border-[#E3E8EF]" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cn(
                "relative px-[12px] py-[10px] text-[13px] font-[500] leading-[16px] transition-colors",
                isActive
                  ? "text-[#533AFD]"
                  : "text-[#596171] hover:text-[#353A44]"
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {isActive && (
                <span className="absolute bottom-0 left-[12px] right-[12px] h-[2px] rounded-full bg-[#533AFD]" />
              )}
            </button>
          )
        })}
      </div>

      {content ? (
        <div>{content}</div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-[12px] py-[80px]">
          <div className="flex h-[48px] w-[48px] items-center justify-center rounded-[12px] bg-[#F4F7FA]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="2" fill="#B6C0CD" />
              <rect x="11" y="2" width="7" height="7" rx="2" fill="#B6C0CD" opacity="0.5" />
              <rect x="2" y="11" width="7" height="7" rx="2" fill="#B6C0CD" opacity="0.5" />
              <rect x="11" y="11" width="7" height="7" rx="2" fill="#B6C0CD" opacity="0.3" />
            </svg>
          </div>
          <p className="text-[14px] font-[500] leading-[20px] text-[#353A44]">No {activeTab.toLowerCase()} yet</p>
          <p className="text-[13px] font-[400] leading-[18px] text-[#596171]">This section is coming soon.</p>
        </div>
      )}
    </div>
  )
}
