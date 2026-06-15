'use client'

import { cn } from "@/lib/utils"
import { METERS } from "@/lib/meters"
import { TableRowActions } from "@/components/product-catalog/TableRowActions"

const INGESTION_STYLES = {
  active: { label: "Active", bg: "bg-[#E7F9ED]", text: "text-[#1A7F37]" },
  inactive: { label: "Inactive", bg: "bg-[#F4F7FA]", text: "text-[#596171]" },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function MetersListView() {
  return (
    <div className="mt-2">
      <div>
        {/* Header row */}
        <div className="border-b border-[#EBEEF1] bg-white">
          <div className="grid h-[40px] grid-cols-[1.2fr_1fr_1fr_0.8fr_1fr_60px] items-center gap-8 text-[12px] font-[500] text-[#6C7688]">
            <span>Display name</span>
            <span>Event name</span>
            <span>Aggregation method</span>
            <span>Event ingestion</span>
            <span>Created</span>
            <span />
          </div>
        </div>

        {/* Data rows */}
        <div className="divide-y divide-[#EBEEF1] bg-white">
          {METERS.map((meter) => {
            const style = INGESTION_STYLES[meter.eventIngestion]
            return (
              <div
                key={meter.id}
                className="group/row grid h-[40px] w-full grid-cols-[1.2fr_1fr_1fr_0.8fr_1fr_60px] items-center gap-8 text-left text-[13px] font-[500] text-[#353A44] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
              >
                <span className="truncate">{meter.displayName}</span>
                <span className="truncate text-[#596171] font-mono text-[12px]">{meter.eventName}</span>
                <span className="truncate text-[#596171]">{meter.aggregationMethod}</span>
                <span>
                  <span className={cn("inline-flex items-center rounded-[4px] px-[6px] py-[2px] text-[12px] font-[500]", style.bg, style.text)}>
                    {style.label}
                  </span>
                </span>
                <span className="text-[#596171]">{formatDate(meter.createdAt)}</span>
                <TableRowActions onEdit={() => {}} onDelete={() => {}} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
