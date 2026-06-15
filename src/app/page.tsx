'use client'

import { useState } from "react"
import ContractsView from "@/components/contracts/contracts-view"
import ContractDetailV4 from "@/components/contracts/contract-detail-v4"
import NewContractWizardV4 from "@/components/contracts/new-contract-wizard-v4"
import { BillingTabbedPage } from "@/components/creation-workspace/BillingTabbedPage"
import { SubscriptionsListView } from "@/components/creation-workspace/SubscriptionsListView"
import { loadSubscriptions, saveSubscriptions, type SubscriptionRecord } from "@/lib/subscriptions"

export default function ContractsV1Page() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>(() => loadSubscriptions())
  const [contractsView, setContractsView] = useState<"list" | "detail" | "create">("list")
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)
  const [activeBillingView, setActiveBillingView] = useState<string>("subscriptions")

  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div className="flex min-h-screen bg-white text-[#353A44]">
        {/* Sidebar */}
        <aside className="hidden w-[240px] flex-col border-r border-[#F5F5F5] bg-white px-6 py-[18px] lg:flex">
          <div className="mb-[44px] flex items-center gap-[9px]">
            <div className="h-[24px] w-[24px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
            <div className="h-[11px] w-[78px] shrink-0 rounded-[40px] bg-[#F5F6F8]" />
          </div>
          <div className="flex flex-col gap-[44px]">
            <div className="flex w-full flex-col gap-[4px]">
              {["Home", "Balances", "Transactions", "Payments"].map((item) => (
                <div key={item} className="flex items-center gap-[13px] px-[8px] py-[6px]">
                  <div className="h-[16px] w-[16px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
                  <div className="h-[11px] shrink-0 rounded-[40px] bg-[#F5F6F8]" style={{ width: `${item.length * 8}px` }} />
                </div>
              ))}
              <button
                type="button"
                className="flex items-center gap-[10px] rounded-[6px] px-[8px] py-[6px] text-left text-[13px] leading-[16px] tracking-[-0.065px] transition-colors font-[500] text-[#353A44] hover:bg-[#F5F6F8]"
              >
                <div className="h-[16px] w-[16px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
                Customers
              </button>
              <button
                type="button"
                onClick={() => setActiveBillingView("product-catalog")}
                className={`flex items-center gap-[10px] rounded-[6px] px-[8px] py-[6px] text-left text-[13px] leading-[16px] tracking-[-0.065px] transition-colors ${activeBillingView === "product-catalog" ? "font-[600] text-[#533AFD]" : "font-[500] text-[#353A44] hover:bg-[#F5F6F8]"}`}
              >
                <div className={`h-[16px] w-[16px] shrink-0 rounded-[4px] ${activeBillingView === "product-catalog" ? "bg-[#D8DEE4]" : "bg-[#F5F6F8]"}`} />
                Product catalog
              </button>
            </div>
            <div className="flex w-full flex-col gap-[2px]">
              <p className="mb-[8px] px-[8px] text-[11px] font-[500] uppercase tracking-[0.5px] text-[#6C7688]">Billing</p>
              <button
                type="button"
                className="flex items-center gap-[10px] rounded-[6px] px-[8px] py-[6px] text-left text-[13px] leading-[16px] tracking-[-0.065px] transition-colors font-[500] text-[#353A44] hover:bg-[#F5F6F8]"
              >
                <div className="h-[16px] w-[16px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveBillingView("subscriptions")}
                className={`flex items-center gap-[10px] rounded-[6px] px-[8px] py-[6px] text-left text-[13px] leading-[16px] tracking-[-0.065px] transition-colors ${activeBillingView === "subscriptions" ? "font-[600] text-[#533AFD]" : "font-[500] text-[#353A44] hover:bg-[#F5F6F8]"}`}
              >
                <div className={`h-[16px] w-[16px] shrink-0 rounded-[4px] ${activeBillingView === "subscriptions" ? "bg-[#D8DEE4]" : "bg-[#F5F6F8]"}`} />
                Subscriptions
              </button>
              <button
                type="button"
                className="flex items-center gap-[10px] rounded-[6px] px-[8px] py-[6px] text-left text-[13px] leading-[16px] tracking-[-0.065px] transition-colors font-[500] text-[#353A44] hover:bg-[#F5F6F8]"
              >
                <div className="h-[16px] w-[16px] shrink-0 rounded-[4px] bg-[#F5F6F8]" />
                Invoices
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between px-6 py-3 bg-white" aria-hidden="true">
            <div className="h-[36px] w-[360px] rounded-[9px] bg-[#F5F6F8]" />
            <div className="flex items-center gap-[21px]">
              <div className="h-[16px] w-[16px] rounded-full bg-[#F5F6F8]" />
              <div className="h-[16px] w-[16px] rounded-full bg-[#F5F6F8]" />
            </div>
          </header>
          <div className="flex-1 px-10 py-10">
            {activeBillingView === "subscriptions" ? (
              contractsView === "detail" && selectedContract ? (
                <ContractDetailV4 data={selectedContract} onBack={() => { setContractsView("list"); setSelectedContract(null) }} onEdit={() => setContractsView("create")} />
              ) : <>
                <BillingTabbedPage
                  title="Subscriptions"
                  tabs={["Subscriptions", "Contracts", "Simulations", "Migrations"]}
                  tabContent={{
                    "Subscriptions": <SubscriptionsListView subscriptions={subscriptions} onEdit={() => {}} onDelete={(id) => { const next = subscriptions.filter((s) => s.id !== id); setSubscriptions(next); saveSubscriptions(next) }} />,
                    "Contracts": contractsView === "list" ? <ContractsView embedded onSelectContract={(c: any) => { setSelectedContract(c); setContractsView("detail") }} onCreateContract={() => setContractsView("create")} /> : null,
                  }}
                  headerAction={(activeTab) => (
                    <button
                      type="button"
                      className="flex h-[34px] items-center rounded-[6px] bg-[#533AFD] px-[12px] text-[13px] font-[600] leading-[18px] text-white hover:bg-[#4730E0] transition-colors"
                      onClick={() => activeTab === "Contracts" ? setContractsView("create") : null}
                    >
                      {activeTab === "Contracts" ? "Create contract" : "Create subscription"}
                    </button>
                  )}
                />
                {contractsView === "create" && <NewContractWizardV4 onGetStarted={(data) => { setSelectedContract(data); setContractsView("detail") }} onDiscard={() => setContractsView("list")} />}
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-[4px]">
                  <h1 className="text-[28px] font-[700] leading-[36px] tracking-[0.38px] text-[#353A44]">Product catalog</h1>
                </div>
                <p className="text-[14px] text-[#596171]">Navigate to Subscriptions in the left sidebar to see the Contracts v1 experience.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </main>
  )
}
