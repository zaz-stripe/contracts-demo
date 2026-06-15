"use client"

import { useState } from "react"
import { Search, Plus, BarChart2, Upload, SlidersHorizontal, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import type { V4PlanLine } from "@/components/contracts/contract-detail-v4"

type Status = "Active" | "Canceled" | "Ended" | "Draft"
type FilterTab = "All" | "Draft" | "Active" | "Ended" | "Canceled"

interface SavedLineGroup {
  dateRange: string
  planName?: string
  lines: { description: string; unitPrice: string; qty: number; serviceInterval: string; totalServicePeriods: number; amount: string }[]
  editedPrice?: string
  editedQty?: number
}

interface SavedOverride {
  id: string
  nodeId: string
  nodeLabel: string
  startDate: string
  endDate: string
  price: string
  quantity: number
  overrideType?: "Multiplier" | "Custom fee" | "Remove"
}

interface Contract {
  id: string
  contractBadge?: string
  status: Status
  startDate: string
  endDate: string
  contractValue: string
  customer: string
  customerBadge?: string
  email: string
  paymentBrand: "visa" | "mastercard" | "link"
  paymentLast4: string
  paymentInitial?: string
  savedLineGroups?: SavedLineGroup[]
  savedOverrides?: SavedOverride[]
  // Pre-built pricing lines used to demonstrate the V4 detail "Pricing lines"
  // tab (recurring lines with scheduled overrides and quantity updates).
  demoPlanLines?: V4PlanLine[]
  billingCadence?: string
  currency?: string
}

export const contracts: Contract[] = [
  {
    id: "98765432-ENTM",
    status: "Active",
    startDate: "May 1, 2026",
    endDate: "May 1, 2029",
    contractValue: "$6,378,189.98",
    customer: "Jenny Rosen",
    email: "jenny@example.com",
    paymentBrand: "mastercard",
    paymentLast4: "4280",
    paymentInitial: "J",
  },
  {
    id: "12344623-ABCH",
    status: "Active",
    startDate: "Jan 1, 2024",
    endDate: "Jan 1, 2027",
    contractValue: "$48,000.00",
    customer: "Michael Lee",
    email: "michael.lee@example.com",
    paymentBrand: "visa",
    paymentLast4: "7421",
    paymentInitial: "J",
    demoPlanLines: [
      {
        id: "pl-scale-y1",
        name: "Scale plan",
        monthlyPrice: 11100,
        quantity: 100,
        startDate: "2026-05-01",
        endDate: "2027-04-30",
        priceOverrides: [
          { id: "ov-1", startDate: "2026-05-01", endDate: "2027-04-30", price: "10000", overrideType: "Override price" },
          { id: "ov-2", startDate: "2026-05-01", endDate: "2027-04-30", price: "9000", overrideType: "Multiplier", multiplier: 10 },
        ],
        quantityUpdates: [],
      },
      {
        id: "pl-scale-y2",
        name: "Scale plan",
        monthlyPrice: 11100,
        quantity: 100,
        startDate: "2027-05-01",
        endDate: "2028-04-30",
        priceOverrides: [
          { id: "ov-3", startDate: "2027-05-01", endDate: "2028-04-30", price: "8890", overrideType: "Multiplier", multiplier: 20 },
        ],
        quantityUpdates: [],
      },
    ],
  },
  {
    id: "123124913-IWBD",
    status: "Canceled",
    startDate: "May 1, 2026",
    endDate: "May 1, 2028",
    contractValue: "$28,800.00",
    customer: "Emily Johnson",
    email: "emily.johnson@example.com",
    paymentBrand: "mastercard",
    paymentLast4: "7421",
    paymentInitial: "E",
  },
  {
    id: "23487914-PAJR",
    status: "Ended",
    startDate: "Aug 27, 2023",
    endDate: "Oct 27, 2025",
    contractValue: "$18,500.00",
    customer: "Michael Lee",
    email: "michael.lee@example.com",
    paymentBrand: "link",
    paymentLast4: "7421",
    paymentInitial: "J",
  },
  {
    id: "34238478-MIPQ",
    status: "Draft",
    startDate: "Jun 14, 2026",
    endDate: "Jun 14, 2028",
    contractValue: "$36,000.00",
    customer: "Michael Lee",
    email: "michael.lee@example.com",
    paymentBrand: "visa",
    paymentLast4: "7421",
    paymentInitial: "J",
  },
  {
    id: "12884023-HEIU",
    contractBadge: "Guest",
    status: "Active",
    startDate: "Dec 7, 2025",
    endDate: "Dec 1, 2027",
    contractValue: "$15,750.00",
    customer: "David Smith",
    customerBadge: "Guest",
    email: "david.smith@example.com",
    paymentBrand: "visa",
    paymentLast4: "7421",
    paymentInitial: "J",
  },
]

const statusConfig: Record<Status, { label: string; className: string }> = {
  Active: {
    label: "Active",
    className: "bg-[#eafcdd] text-[#2b8700] border border-[#a8f170]/50",
  },
  Canceled: {
    label: "Canceled",
    className: "bg-[#fef4f6] text-[#e61947] border border-[#fbd3dc]/50",
  },
  Ended: {
    label: "Ended",
    className: "bg-[#F5F6F8] text-[#6c7688] border border-[#d8dee4]/50",
  },
  Draft: {
    label: "Draft",
    className: "bg-[#fbd992]/30 text-[#cc4b00] border border-[#fbd992]/50",
  },
}

function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status]
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", config.className)}>
      {config.label}
    </span>
  )
}

function GuestBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-[#596171] bg-[#F5F6F8] border border-[#d8dee4]">
      Guest
    </span>
  )
}

function VisaIcon() {
  return (
    <div className="w-8 h-5 rounded bg-[#00579f] flex items-center justify-center flex-shrink-0">
      <span className="text-white text-[8px] font-bold tracking-tight italic">VISA</span>
    </div>
  )
}

function MastercardIcon() {
  return (
    <div className="w-8 h-5 rounded bg-[#1a1a2e] flex items-center justify-center flex-shrink-0 relative overflow-hidden">
      <div className="absolute left-1 top-0.5 w-4 h-4 rounded-full bg-[#eb001b] opacity-90" />
      <div className="absolute right-1 top-0.5 w-4 h-4 rounded-full bg-[#f79e1b] opacity-90" />
    </div>
  )
}

function LinkIcon() {
  return (
    <div className="w-8 h-5 rounded bg-[#00d66f] flex items-center justify-center flex-shrink-0">
      <span className="text-[#011e0f] text-[7px] font-bold tracking-tight">link</span>
    </div>
  )
}

function PaymentMethod({
  brand,
  last4,
  initial,
}: {
  brand: "visa" | "mastercard" | "link"
  last4: string
  initial?: string
}) {
  return (
    <div className="flex items-center gap-2">
      {brand === "visa" && <VisaIcon />}
      {brand === "mastercard" && <MastercardIcon />}
      {brand === "link" && <LinkIcon />}
      <span className="text-sm text-[#596171]">···· {last4}</span>
      {initial && (
        <div className="w-5 h-5 rounded-full bg-[#ecf1f6] flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-medium text-[#596171]">{initial}</span>
        </div>
      )}
    </div>
  )
}

const filterTabs: FilterTab[] = ["All", "Draft", "Active", "Ended", "Canceled"]

interface SelectContractPayload {
  id: string
  status: Status
  customer: string
  email: string
  contractValue: string
  startDate: string
  endDate: string
  savedLineGroups?: Contract["savedLineGroups"]
  savedOverrides?: Contract["savedOverrides"]
  demoPlanLines?: Contract["demoPlanLines"]
  billingCadence?: string
  currency?: string
}

interface ContractsViewProps {
  onSelectContract: (contract: SelectContractPayload) => void
  onCreateContract: () => void
  additionalContracts?: Contract[]
  embedded?: boolean
}

export default function ContractsView({ onSelectContract, onCreateContract, additionalContracts = [], embedded = false }: ContractsViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All")
  const [activeTab, setActiveTab] = useState<"Overview" | "Contracts">("Contracts")
  const [search, setSearch] = useState("")
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const allContracts = [...contracts, ...additionalContracts]

  const filteredContracts = allContracts.filter((c) => {
    const matchesFilter = activeFilter === "All" || c.status === activeFilter
    const matchesSearch =
      search === "" ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.customer.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const allSelected = filteredContracts.length > 0 && filteredContracts.every((c) => selectedRows.has(c.id))
  const someSelected = filteredContracts.some((c) => selectedRows.has(c.id))

  function toggleAll() {
    if (allSelected) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredContracts.map((c) => c.id)))
    }
  }

  function toggleRow(id: string) {
    const next = new Set(selectedRows)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedRows(next)
  }

  return (
    <div className="flex flex-col min-h-full bg-[#ffffff]">
      {/* Page header */}
      {!embedded && (
        <div className="flex items-center justify-between px-8 pt-7 pb-4">
          <h1 className="text-2xl font-bold text-[#353A44] tracking-tight">Contracts</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onCreateContract}
              className="flex h-[34px] items-center rounded-[6px] bg-[#533AFD] px-[12px] text-[13px] font-[600] leading-[18px] text-white hover:bg-[#4730E0] transition-colors"
            >
              Create contract
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!embedded && (
        <div className="flex items-end border-b border-[#EBEEF1] px-8">
          {(["Overview", "Contracts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-0 mr-6 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === tab
                  ? "text-[#533AFD] border-[#533AFD]"
                  : "text-[#6c7688] border-transparent hover:text-[#353A44]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Filter & Search */}
      <div className={cn(embedded ? "pb-4 pt-6" : "px-8 pb-4 pt-5")}>
        {/* Status filter pills */}
        <div className="flex items-center gap-2 mb-4">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium transition-colors border",
                activeFilter === tab
                  ? "bg-[#353A44] text-white border-[#353A44]"
                  : "bg-white text-[#596171] border-[#d8dee4] hover:bg-[#F5F6F8] hover:border-[#B6C0CD]"
              )}
            >
              {tab}
            </button>
          ))}
          <button className="w-7 h-7 flex items-center justify-center rounded-full border border-[#d8dee4] text-[#6c7688] hover:bg-[#F5F6F8] transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Search row */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A0A8B4]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, etc."
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#d8dee4] rounded-md text-[#353A44] placeholder:text-[#A0A8B4] focus:outline-none focus:ring-1 focus:ring-[#533AFD] focus:border-[#533AFD] transition-colors bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#d8dee4] rounded-md text-[#596171] hover:bg-[#F5F6F8] transition-colors bg-white">
              <Plus className="w-3.5 h-3.5" />
              Filter
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-[#d8dee4] rounded-md text-[#6c7688] hover:bg-[#F5F6F8] transition-colors bg-white">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={cn("flex-1 pb-8", embedded ? "" : "px-8")}>
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EBEEF1]">
                <th className="w-10 px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected
                    }}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-[#d8dee4] accent-[#533AFD] cursor-pointer"
                  />
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                  Contract number
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                  Status
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                  Start date
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                  End date
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                  Contract value
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                  Customer
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                  Email
                </th>
                <th className="px-3 py-3 text-left font-medium text-[#6c7688] text-xs tracking-wide whitespace-nowrap">
                  Default payment
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-sm text-[#A0A8B4]">
                    No contracts found
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract, index) => (
                  <tr
                    key={contract.id}
                    onClick={() =>
                      onSelectContract({
                        id: contract.id,
                        status: contract.status,
                        customer: contract.customer,
                        email: contract.email,
                        contractValue: contract.contractValue,
                        startDate: contract.startDate,
                        endDate: contract.endDate,
      savedLineGroups: contract.savedLineGroups,
      savedOverrides: contract.savedOverrides,
      demoPlanLines: contract.demoPlanLines,
      billingCadence: contract.billingCadence,
      currency: contract.currency,
    })
                    }
                    className={cn(
                      "group border-b border-[#EBEEF1] last:border-0 cursor-pointer transition-colors",
                      selectedRows.has(contract.id) ? "bg-[#F7F5FD]" : "hover:bg-[#FAFBFC]"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="w-10 px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(contract.id)}
                        onChange={() => toggleRow(contract.id)}
                        className="w-3.5 h-3.5 rounded border-[#d8dee4] accent-[#533AFD] cursor-pointer"
                      />
                    </td>

                    {/* Contract number */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#353A44]">{contract.id}</span>
                        {contract.contractBadge && <GuestBadge />}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5">
                      <StatusBadge status={contract.status} />
                    </td>

                    {/* Start date */}
                    <td className="px-3 py-3.5 text-[#596171] whitespace-nowrap">{contract.startDate}</td>

                    {/* End date */}
                    <td className="px-3 py-3.5 text-[#596171] whitespace-nowrap">{contract.endDate}</td>

                    {/* Contract value */}
                    <td className="px-3 py-3.5 text-[#596171] whitespace-nowrap font-medium">
                      {contract.contractValue}
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[#596171] whitespace-nowrap">{contract.customer}</span>
                        {contract.customerBadge && <GuestBadge />}
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-3 py-3.5 text-[#596171] whitespace-nowrap">{contract.email}</td>

                    {/* Default payment */}
                    <td className="px-3 py-3.5">
                      <PaymentMethod
                        brand={contract.paymentBrand}
                        last4={contract.paymentLast4}
                        initial={contract.paymentInitial}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
