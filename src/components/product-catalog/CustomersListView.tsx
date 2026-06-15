'use client'

import { CUSTOMERS } from "@/lib/customers"
import { TableRowActions } from "@/components/product-catalog/TableRowActions"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function CustomersListView({ onSelectCustomer }: { onSelectCustomer?: (id: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-[4px]">
        <h1 className="text-[28px] font-[700] leading-[36px] tracking-[0.38px] text-[#353A44]">Customers</h1>
        <button
          type="button"
          className="flex h-[34px] items-center rounded-[6px] bg-[#533AFD] px-[12px] text-[13px] font-[600] leading-[18px] text-white hover:bg-[#4730E0] transition-colors"
        >
          Add customer
        </button>
      </div>

      <div className="mt-6">
        <div>
          {/* Header row */}
          <div className="border-b border-[#EBEEF1] bg-white">
            <div className="grid h-[40px] grid-cols-[1.2fr_1.5fr_1fr_1fr_0.8fr_60px] items-center gap-8 text-[12px] font-[500] text-[#6C7688]">
              <span>Customer name</span>
              <span>Email</span>
              <span>Country</span>
              <span>Created</span>
              <span>Total spend</span>
              <span />
            </div>
          </div>

          {/* Data rows */}
          <div className="divide-y divide-[#EBEEF1] bg-white">
            {CUSTOMERS.map((customer) => (
              <div
                key={customer.id}
                className="group/row grid h-[40px] w-full grid-cols-[1.2fr_1.5fr_1fr_1fr_0.8fr_60px] items-center gap-8 text-left text-[13px] font-[500] text-[#353A44] hover:bg-[#F7F8FA] transition-colors cursor-pointer"
                onClick={() => onSelectCustomer?.(customer.id)}
              >
                <span className="truncate">{customer.name}</span>
                <span className="truncate text-[#596171]">{customer.email}</span>
                <span className="truncate text-[#596171]">{customer.country}</span>
                <span className="text-[#596171]">{formatDate(customer.createdAt)}</span>
                <span className="text-[#353A44]">{customer.totalSpend}</span>
                <TableRowActions onEdit={() => {}} onDelete={() => {}} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
