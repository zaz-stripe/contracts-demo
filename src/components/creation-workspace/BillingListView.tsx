'use client'

import { cn } from "@/lib/utils"
import { TableRowActions } from "@/components/product-catalog/TableRowActions"

type BillingListViewProps = {
  title: string
  createLabel: string
  onCreate: () => void
  columns: string[]
}

type RowStatus = "active" | "draft" | "pending" | "paid" | "void" | "open"

const STATUS_STYLES: Record<RowStatus, { bg: string; text: string }> = {
  active: { bg: "bg-[#E7F9ED]", text: "text-[#1A7F37]" },
  draft: { bg: "bg-[#F4F7FA]", text: "text-[#596171]" },
  pending: { bg: "bg-[#FFF4E5]", text: "text-[#B45309]" },
  paid: { bg: "bg-[#E7F9ED]", text: "text-[#1A7F37]" },
  void: { bg: "bg-[#F4F7FA]", text: "text-[#596171]" },
  open: { bg: "bg-[#EEF1FF]", text: "text-[#533AFD]" },
}

const SAMPLE_NAMES = [
  "Acme Corp", "Globex Inc", "Initech LLC", "Umbrella Co", "Stark Industries",
  "Wayne Enterprises", "Wonka Industries", "Pied Piper", "Hooli Inc", "Dunder Mifflin",
  "Sterling Cooper", "Prestige Worldwide", "Vandelay Industries", "Bluth Company", "TechCrunch Ltd",
]

const SAMPLE_AMOUNTS = ["$49.00", "$99.00", "$149.00", "$299.00", "$19.00", "$79.00", "$199.00", "$29.00"]
const SAMPLE_DATES = ["Jun 8, 2026", "Jun 5, 2026", "Jun 1, 2026", "May 28, 2026", "May 15, 2026", "May 10, 2026", "Apr 22, 2026", "Apr 10, 2026"]
const SAMPLE_STATUSES: RowStatus[] = ["active", "paid", "open", "draft", "pending", "active", "paid", "void"]

function generateRows(columns: string[], count: number) {
  return Array.from({ length: count }, (_, i) => {
    return columns.map((col) => {
      const lowerCol = col.toLowerCase()
      if (lowerCol.includes("customer") || lowerCol.includes("name") || lowerCol === "item") {
        return { type: "text" as const, value: SAMPLE_NAMES[i % SAMPLE_NAMES.length] }
      }
      if (lowerCol.includes("status") || lowerCol.includes("state")) {
        return { type: "status" as const, value: SAMPLE_STATUSES[i % SAMPLE_STATUSES.length] }
      }
      if (lowerCol.includes("amount") || lowerCol.includes("total") || lowerCol.includes("price")) {
        return { type: "text" as const, value: SAMPLE_AMOUNTS[i % SAMPLE_AMOUNTS.length] }
      }
      if (lowerCol.includes("date") || lowerCol.includes("created")) {
        return { type: "secondary" as const, value: SAMPLE_DATES[i % SAMPLE_DATES.length] }
      }
      return { type: "secondary" as const, value: SAMPLE_NAMES[(i + 3) % SAMPLE_NAMES.length] }
    })
  })
}

export function BillingListView({ title, createLabel, onCreate, columns }: BillingListViewProps) {
  const rows = generateRows(columns, 15)

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-[4px]">
        <h1 className="text-[28px] font-[700] leading-[36px] tracking-[0.38px] text-[#353A44]">
          {title}
        </h1>
        <button
          type="button"
          className="flex h-[34px] items-center rounded-[6px] bg-[#533AFD] px-[12px] text-[13px] font-[600] leading-[18px] text-white hover:bg-[#4730E0] transition-colors"
          onClick={onCreate}
        >
          {createLabel}
        </button>
      </div>

      {/* Table */}
      <div className="mt-6">
        <div>
          {/* Header row */}
          <div className="border-b border-[#EBEEF1] bg-white">
            <div
              className="grid h-[40px] items-center gap-8 text-[12px] font-[500] text-[#6C7688]"
              style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr) 60px` }}
            >
              {columns.map((col) => (
                <span key={col}>{col}</span>
              ))}
              <span />
            </div>
          </div>

          {/* Data rows */}
          <div className="divide-y divide-[#EBEEF1] bg-white">
            {rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="group/row grid h-[40px] w-full items-center gap-8 text-left text-[13px] font-[500] text-[#353A44] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
                style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr) 60px` }}
              >
                {row.map((cell, colIndex) => (
                  <span key={colIndex} className="truncate">
                    {cell.type === "status" ? (
                      <span className={cn("inline-flex items-center rounded-[4px] px-[6px] py-[2px] text-[12px] font-[500]", STATUS_STYLES[cell.value as RowStatus].bg, STATUS_STYLES[cell.value as RowStatus].text)}>
                        {(cell.value as string).charAt(0).toUpperCase() + (cell.value as string).slice(1)}
                      </span>
                    ) : cell.type === "secondary" ? (
                      <span className="text-[#596171]">{cell.value}</span>
                    ) : (
                      cell.value
                    )}
                  </span>
                ))}
                <TableRowActions onEdit={() => {}} onDelete={() => {}} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
