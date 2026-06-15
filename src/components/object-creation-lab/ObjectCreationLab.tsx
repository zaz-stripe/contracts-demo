'use client'

import { useEffect, useMemo, useState } from "react"

import { CreationWorkspace } from "@/components/object-creation-lab/CreationWorkspace"
import { ObjectPillNav } from "@/components/object-creation-lab/ObjectPillNav"
import {
  getAvailablePreviewKinds,
  InvoiceDocumentPreview,
  ProductDocumentPreview,
  RelatedFlowRightPanel,
  type PreviewableKind,
} from "@/components/object-creation-lab/RelatedFlowRightPanel"
import { SimpleCreationHeader } from "@/components/object-creation-lab/SimpleCreationHeader"
import { WhatsNextPrompt } from "@/components/object-creation-lab/WhatsNextPrompt"
import {
  useRelatedObjectFlow,
  type CustomerDraft,
  type RelatedObjectKind,
} from "@/components/object-creation-lab/useRelatedObjectFlow"

// ── Shared form primitives (matches /multi field styles) ────────────

const labelClass = "text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#3C4F69]"
const inputClass =
  "h-[32px] w-full rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
const textareaClass =
  "min-h-[80px] w-full resize-none rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] py-[8px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
const selectClass =
  "h-[32px] w-full rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[13px] font-[400] text-[#353A44] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  )
}

// ── Types ───────────────────────────────────────────────────────────

type DemoKey = "single" | "related" | "complex"

const INITIAL_SIMPLE_CUSTOMER: CustomerDraft = {
  name: "",
  email: "",
  country: "United States",
  notes: "",
}

const KIND_LABEL: Record<RelatedObjectKind, string> = {
  invoice: "Invoice",
  customer: "Customer",
  product: "Product",
  coupon: "Coupon",
  meter: "Meter",
}

// ── Main component ──────────────────────────────────────────────────

export function ObjectCreationLab() {
  const [openDemo, setOpenDemo] = useState<DemoKey | null>(null)
  const [simpleCustomer, setSimpleCustomer] = useState<CustomerDraft>(INITIAL_SIMPLE_CUSTOMER)
  const relatedFlow = useRelatedObjectFlow()
  const [activePreviewKind, setActivePreviewKind] = useState<PreviewableKind | null>("invoice")

  const availablePreviewKinds = useMemo(
    () => getAvailablePreviewKinds(relatedFlow.objectOrder),
    [relatedFlow.objectOrder]
  )

  useEffect(() => {
    if (availablePreviewKinds.length === 0) {
      setActivePreviewKind(null)
      return
    }
    setActivePreviewKind((prev) => {
      if (prev !== null && availablePreviewKinds.includes(prev)) return prev
      return availablePreviewKinds[0]
    })
  }, [availablePreviewKinds])

  const handleLaunchRelated = () => {
    relatedFlow.reset()
    setActivePreviewKind("invoice")
    setOpenDemo("related")
  }

  const handleMoveSimpleIntoRelated = () => {
    relatedFlow.loadFromSimpleCustomer(simpleCustomer)
    setOpenDemo("related")
  }

  const handleSimpleSubmit = () => {
    setOpenDemo(null)
  }

  const handleRelatedSubmit = () => {
    setOpenDemo(null)
  }

  const addMenuForHeader = relatedFlow.addMenuOptions.map((o) => ({
    kind: o.kind,
    label: o.label,
    description: o.description,
  }))

  const relatedWorkspaceTitle = relatedFlow.objectOrder.includes("invoice")
    ? "Create invoice"
    : relatedFlow.objects.map((o) => KIND_LABEL[o.kind]).join(" + ") || "Create objects"

  const multiPreview = availablePreviewKinds.length > 1

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
      <div className="flex flex-col items-center gap-[16px]">
        <p className="text-[13px] font-[500] text-[#6C7688]">Object creation lab</p>
        <div className="flex items-center gap-[8px]">
          <LaunchButton label="Single" onClick={() => setOpenDemo("single")} />
          <LaunchButton label="Related" onClick={handleLaunchRelated} />
          <LaunchButton label="Complex" onClick={() => setOpenDemo("complex")} />
        </div>
      </div>

      <CreationWorkspace
        mode="single"
        isOpen={openDemo === "single"}
        onClose={() => setOpenDemo(null)}
        header={
          <SimpleCreationHeader
            title="Create customer"
            submitLabel="Create customer"
            onClose={() => setOpenDemo(null)}
            onSubmit={handleSimpleSubmit}
          />
        }
        editor={
          <SimpleCustomerEditor
            customer={simpleCustomer}
            onChange={setSimpleCustomer}
            onMoveIntoRelatedFlow={handleMoveSimpleIntoRelated}
          />
        }
      />

      <CreationWorkspace
        mode="related"
        isOpen={openDemo === "related"}
        onClose={() => setOpenDemo(null)}
        header={
          <SimpleCreationHeader
            title={relatedWorkspaceTitle}
            submitLabel="Create all"
            onClose={() => setOpenDemo(null)}
            onSubmit={handleRelatedSubmit}
            addOptions={addMenuForHeader}
            onAddObject={(kind) => relatedFlow.ensureObject(kind as RelatedObjectKind)}
          />
        }
        navigator={
          <ObjectPillNav
            objects={relatedFlow.objects}
            activeId={relatedFlow.activeKind}
            onSelect={(id) => relatedFlow.setActiveKind(id as RelatedObjectKind)}
          />
        }
        editor={
          <RelatedFlowEditor
            activeKind={relatedFlow.activeKind}
            data={relatedFlow.data}
            objectOrder={relatedFlow.objectOrder}
            onEnsureObject={relatedFlow.ensureObject}
            onUpdateInvoice={relatedFlow.updateInvoice}
            onUpdateCustomer={relatedFlow.updateCustomer}
            onUpdateProduct={relatedFlow.updateProduct}
            onUpdateCoupon={relatedFlow.updateCoupon}
            onUpdateMeter={relatedFlow.updateMeter}
            tier1Suggestions={relatedFlow.tier1Suggestions}
          />
        }
        preview={
          <RelatedFlowRightPanel
            availablePreviewKinds={availablePreviewKinds}
            selectedPreviewKind={activePreviewKind}
            onSelectPreviewKind={setActivePreviewKind}
            invoicePreview={
              <InvoiceDocumentPreview
                embedded={multiPreview}
                data={relatedFlow.data}
                objects={relatedFlow.objects}
              />
            }
            productPreview={
              <ProductDocumentPreview
                embedded={multiPreview}
                data={relatedFlow.data}
                objects={relatedFlow.objects}
              />
            }
          />
        }
      />

      <CreationWorkspace
        mode="hierarchical"
        isOpen={openDemo === "complex"}
        onClose={() => setOpenDemo(null)}
        header={
          <SimpleCreationHeader
            title="Pricing plan"
            submitLabel="Done"
            onClose={() => setOpenDemo(null)}
            onSubmit={() => setOpenDemo(null)}
          />
        }
        navigator={<ComplexHierarchySidebar />}
        editor={<ComplexReferenceEditor />}
        preview={<ComplexReferencePreview />}
      />
    </div>
  )
}

function LaunchButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[32px] items-center rounded-[6px] border border-[#D4DEE9] bg-white px-[12px] text-[13px] font-[500] text-[#353A44] transition-colors hover:bg-[#F5F6F8]"
    >
      {label}
    </button>
  )
}

function SimpleCustomerEditor({
  customer,
  onChange,
  onMoveIntoRelatedFlow,
}: {
  customer: CustomerDraft
  onChange: (next: CustomerDraft) => void
  onMoveIntoRelatedFlow: () => void
}) {
  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center gap-[8px]">
        <h2 className="text-[14px] font-[600] leading-[20px] tracking-[-0.07px] text-[#1A2C44]">Customer</h2>
      </div>
      <Field label="Customer name">
        <input
          className={inputClass}
          placeholder="Acme Inc."
          value={customer.name}
          onChange={(e) => onChange({ ...customer, name: e.target.value })}
        />
      </Field>
      <Field label="Email">
        <input
          className={inputClass}
          placeholder="email@example.com"
          value={customer.email}
          onChange={(e) => onChange({ ...customer, email: e.target.value })}
        />
      </Field>
      <Field label="Country">
        <select
          className={selectClass}
          value={customer.country}
          onChange={(e) => onChange({ ...customer, country: e.target.value })}
        >
          {["United States", "United Kingdom", "France", "Germany"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes">
        <textarea
          className={textareaClass}
          placeholder="Internal notes for support, invoicing, or onboarding."
          value={customer.notes}
          onChange={(e) => onChange({ ...customer, notes: e.target.value })}
        />
      </Field>
      <WhatsNextPrompt
        suggestions={[
          {
            actionLabel: "Create an invoice",
            reason: "for this customer in the related flow.",
            onClick: onMoveIntoRelatedFlow,
          },
        ]}
      />
    </div>
  )
}

// ── Related editor ────────────────────────────────────────────────────

function RelatedFlowEditor({
  activeKind,
  data,
  objectOrder,
  onEnsureObject,
  onUpdateInvoice,
  onUpdateCustomer,
  onUpdateProduct,
  onUpdateCoupon,
  onUpdateMeter,
  tier1Suggestions,
}: {
  activeKind: RelatedObjectKind
  data: ReturnType<typeof useRelatedObjectFlow>["data"]
  objectOrder: RelatedObjectKind[]
  onEnsureObject: (kind: RelatedObjectKind) => void
  onUpdateInvoice: ReturnType<typeof useRelatedObjectFlow>["updateInvoice"]
  onUpdateCustomer: ReturnType<typeof useRelatedObjectFlow>["updateCustomer"]
  onUpdateProduct: ReturnType<typeof useRelatedObjectFlow>["updateProduct"]
  onUpdateCoupon: ReturnType<typeof useRelatedObjectFlow>["updateCoupon"]
  onUpdateMeter: ReturnType<typeof useRelatedObjectFlow>["updateMeter"]
  tier1Suggestions: ReturnType<typeof useRelatedObjectFlow>["tier1Suggestions"]
}) {
  const editorTitle = KIND_LABEL[activeKind]

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-center gap-[8px]">
        <h2 className="text-[14px] font-[600] leading-[20px] tracking-[-0.07px] text-[#1A2C44]">{editorTitle}</h2>
      </div>

      {activeKind === "invoice" && (
        <>
          <Field label="Invoice number">
            <input
              className={inputClass}
              placeholder="INV-001"
              value={data.invoice.invoiceNumber}
              onChange={(e) => onUpdateInvoice({ invoiceNumber: e.target.value })}
            />
          </Field>
          <Field label="Amount">
            <div className="relative">
              <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[13px] text-[#6C7688]">$</span>
              <input
                className={`${inputClass} pl-[22px]`}
                placeholder="0.00"
                value={data.invoice.amount}
                onChange={(e) => onUpdateInvoice({ amount: e.target.value })}
              />
            </div>
          </Field>
          <Field label="Due date">
            <input
              type="date"
              className={inputClass}
              value={data.invoice.dueDate}
              onChange={(e) => onUpdateInvoice({ dueDate: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className={textareaClass}
              placeholder="What is this invoice for?"
              value={data.invoice.description}
              onChange={(e) => onUpdateInvoice({ description: e.target.value })}
            />
          </Field>
        </>
      )}

      {activeKind === "customer" && (
        <>
          <Field label="Customer name">
            <input
              className={inputClass}
              placeholder="Acme Inc."
              value={data.customer.name}
              onChange={(e) => onUpdateCustomer({ name: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <input
              className={inputClass}
              placeholder="email@example.com"
              value={data.customer.email}
              onChange={(e) => onUpdateCustomer({ email: e.target.value })}
            />
          </Field>
          <Field label="Country">
            <select
              className={selectClass}
              value={data.customer.country}
              onChange={(e) => onUpdateCustomer({ country: e.target.value })}
            >
              {["United States", "United Kingdom", "France", "Germany"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <textarea
              className={textareaClass}
              placeholder="Important context for finance or support."
              value={data.customer.notes}
              onChange={(e) => onUpdateCustomer({ notes: e.target.value })}
            />
          </Field>
        </>
      )}

      {activeKind === "product" && (
        <>
          <Field label="Product name">
            <input
              className={inputClass}
              placeholder="Creator Pro"
              value={data.product.name}
              onChange={(e) => onUpdateProduct({ name: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className={textareaClass}
              placeholder="Short descriptor shown to finance teams."
              value={data.product.description}
              onChange={(e) => onUpdateProduct({ description: e.target.value })}
            />
          </Field>

          <div className="mt-[16px] flex flex-col gap-[16px]">
            <Field label="Unit price">
              <div className="relative">
                <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[13px] text-[#6C7688]">$</span>
                <input
                  className={`${inputClass} pl-[22px]`}
                  placeholder="0.00"
                  value={data.product.unitPrice}
                  onChange={(e) => onUpdateProduct({ unitPrice: e.target.value })}
                />
              </div>
            </Field>
            <Field label="Billing model">
              <select
                className={selectClass}
                value={data.product.billingModel}
                onChange={(e) => onUpdateProduct({ billingModel: e.target.value })}
              >
                {["Per unit", "Flat fee", "Metered usage"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            {data.product.billingModel === "Metered usage" ? (
              objectOrder.includes("meter") ? (
                <p className="text-[11px] leading-[15px] text-[#9CA3B0]">
                  Use the meter object in the nav above to configure usage events.
                </p>
              ) : (
                <div className="rounded-[6px] border border-[#D4DEE9] bg-[#F4F7FA] px-[12px] py-[10px]">
                  <p className="text-[12px] font-[500] leading-[16px] text-[#1A2C44]">
                    Metered billing needs a meter
                  </p>
                  <p className="mt-[4px] text-[11px] leading-[15px] text-[#6C7688]">
                    Add a meter as its own object to record usage for this product.
                  </p>
                  <button
                    type="button"
                    className="mt-[10px] flex h-[28px] items-center rounded-[6px] border border-[#533AFD] bg-[#533AFD] px-[10px] text-[12px] font-[600] leading-[16px] text-white transition-colors hover:bg-[#4730E0]"
                    onClick={() => onEnsureObject("meter")}
                  >
                    Add meter
                  </button>
                </div>
              )
            ) : null}
          </div>
        </>
      )}

      {activeKind === "meter" && (
        <>
          <Field label="Event name">
            <input
              className={inputClass}
              placeholder="e.g. api_request"
              value={data.meter.eventName ?? ""}
              onChange={(e) => onUpdateMeter({ eventName: e.target.value })}
            />
            <p className="mt-[4px] text-[11px] text-[#9CA3B0]">
              Independent meter object in the flow; it appears on the invoice preview when an invoice is in the flow.
            </p>
          </Field>
          <Field label="Aggregation method">
            <select
              className={selectClass}
              value={data.meter.aggregation ?? "sum"}
              onChange={(e) => onUpdateMeter({ aggregation: e.target.value })}
            >
              <option value="sum">Sum</option>
              <option value="count">Count</option>
              <option value="max">Max</option>
              <option value="last_during_period">Last during period</option>
            </select>
          </Field>
        </>
      )}

      {activeKind === "coupon" && (
        <>
          <Field label="Coupon name">
            <input
              className={inputClass}
              placeholder="SUMMER20"
              value={data.coupon.name}
              onChange={(e) => onUpdateCoupon({ name: e.target.value })}
            />
          </Field>
          <Field label="Amount off">
            <div className="relative">
              <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[13px] text-[#6C7688]">$</span>
              <input
                className={`${inputClass} pl-[22px]`}
                placeholder="0.00"
                value={data.coupon.amount}
                onChange={(e) => onUpdateCoupon({ amount: e.target.value })}
              />
            </div>
          </Field>
          <Field label="Duration">
            <select
              className={selectClass}
              value={data.coupon.duration}
              onChange={(e) => onUpdateCoupon({ duration: e.target.value })}
            >
              {["Once", "Forever", "Repeating"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </>
      )}

      <WhatsNextPrompt suggestions={tier1Suggestions} />
    </div>
  )
}

// ── Complex demo (unchanged structure) ──────────────────────────────

function ComplexHierarchySidebar() {
  return (
    <div className="px-[12px] py-[12px]">
      <div className="rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] py-[6px]">
        <input
          className="w-full text-[12px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none"
          placeholder="Filter..."
        />
      </div>
      <div className="mt-[12px] flex flex-col gap-[2px]">
        <TreeRow label="Creator Pro" active />
        <TreeRow label="Subscription fee" depth={1} />
        <TreeRow label="LLM rates" depth={1} />
        <TreeRow label="GPT-4 Turbo input" depth={2} />
        <TreeRow label="GPT-4 Turbo output" depth={2} />
      </div>
    </div>
  )
}

function TreeRow({ label, depth = 0, active = false }: { label: string; depth?: number; active?: boolean }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center rounded-[5px] py-[5px] text-left text-[12px] font-[500] transition-colors ${
        active ? "bg-[#F0F3F7] text-[#353A44]" : "text-[#6C7688] hover:bg-[#F7F8FA]"
      }`}
      style={{ paddingLeft: `${8 + depth * 14}px` }}
    >
      {label}
    </button>
  )
}

function ComplexReferenceEditor() {
  return (
    <div className="px-[16px] py-[16px]">
      <div className="flex flex-col gap-[16px]">
        <Field label="Display name">
          <input className={inputClass} value="Subscription fee" readOnly />
        </Field>
        <Field label="Price type">
          <SegmentGroup options={["Fixed rate", "Volume", "Graduated"]} value="Fixed rate" />
        </Field>
        <Field label="Interval">
          <SegmentGroup options={["Monthly", "Annually", "Custom"]} value="Monthly" />
        </Field>
        <Field label="Price">
          <div className="relative">
            <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[13px] text-[#6C7688]">$</span>
            <input className={`${inputClass} pl-[22px]`} value="100.00" readOnly />
          </div>
        </Field>
        <Field label="Unit label">
          <input className={inputClass} value="seat" readOnly />
        </Field>
        <WhatsNextPrompt
          suggestions={[
            {
              actionLabel: "Add another rate",
              reason: "to continue building inside this hierarchy.",
              onClick: () => {},
            },
          ]}
        />
      </div>
    </div>
  )
}

function SegmentGroup({ options, value }: { options: string[]; value: string }) {
  return (
    <div className="flex gap-[4px]">
      {options.map((opt) => (
        <div
          key={opt}
          className={`flex h-[30px] flex-1 items-center justify-center rounded-[5px] border text-[12px] font-[500] ${
            opt === value
              ? "border-[#D4DEE9] bg-white text-[#353A44] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              : "border-transparent text-[#6C7688]"
          }`}
        >
          {opt}
        </div>
      ))}
    </div>
  )
}

function ComplexPreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#F0F2F5] py-[8px] last:border-b-0">
      <span className="text-[12px] text-[#6C7688]">{label}</span>
      <span className="text-[12px] font-[500] text-[#353A44]">{value}</span>
    </div>
  )
}

function ComplexReferencePreview() {
  return (
    <div className="flex h-full items-center justify-center p-[24px]">
      <div className="w-full max-w-[320px] rounded-[8px] border border-[#E3E8EF] bg-white p-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
        <p className="text-[12px] font-[500] text-[#6C7688]">Creator Pro</p>
        <p className="mt-[4px] text-[13px] font-[500] text-[#353A44]">Powerful features for growing teams.</p>
        <div className="mt-[12px] flex flex-col">
          <ComplexPreviewRow label="Subscription fee" value="$100.00 / mo" />
          <ComplexPreviewRow label="LLM rates" value="2 metered items" />
          <ComplexPreviewRow label="Input tokens" value="$0.03 per 1k" />
          <ComplexPreviewRow label="Output tokens" value="$0.002 per 1k" />
        </div>
      </div>
    </div>
  )
}
