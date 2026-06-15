'use client'

const labelClass = "text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#3C4F69]"
const inputClass =
  "h-[32px] w-full rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
const selectClass =
  "h-[32px] w-full appearance-none rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] pr-[28px] text-[13px] font-[400] text-[#353A44] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"
const textareaClass =
  "min-h-[64px] w-full resize-none rounded-[6px] border border-[#D4DEE9] bg-white px-[10px] py-[8px] text-[13px] font-[400] text-[#353A44] placeholder:text-[#9CA3B0] outline-none transition-colors focus:border-[#533AFD] focus:ring-1 focus:ring-[#533AFD]/20"

type MeterFormProps = {
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
  errorFields?: Set<string>
}

export function MeterForm({ data, onChange }: MeterFormProps) {
  const set = (key: string, value: string) => onChange({ [key]: value })

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Event name</label>
        <input
          className={inputClass}
          placeholder="e.g. api_request"
          value={data.name ?? ""}
          onChange={(e) => set("name", e.target.value)}
        />
        <p className="text-[11px] text-[#9CA3B0]">
          The name of the event your application will send to track usage.
        </p>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Display name</label>
        <input
          className={inputClass}
          placeholder="e.g. API Requests"
          value={data.displayName ?? ""}
          onChange={(e) => set("displayName", e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Aggregation method</label>
        <select
          className={selectClass}
          value={data.aggregation ?? "sum"}
          onChange={(e) => set("aggregation", e.target.value)}
        >
          <option value="sum">Sum</option>
          <option value="count">Count</option>
          <option value="max">Max</option>
          <option value="last_during_period">Last during period</option>
        </select>
        <p className="text-[11px] text-[#9CA3B0]">
          How usage events are combined within a billing period.
        </p>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Time window</label>
        <select
          className={selectClass}
          value={data.timeWindow ?? "none"}
          onChange={(e) => set("timeWindow", e.target.value)}
        >
          <option value="none">None (cumulative)</option>
          <option value="hour">Hourly</option>
          <option value="day">Daily</option>
        </select>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Filter expression</label>
        <textarea
          className={textareaClass}
          placeholder="e.g. model = 'gpt-4'"
          value={data.filterExpression ?? ""}
          onChange={(e) => set("filterExpression", e.target.value)}
        />
        <p className="text-[11px] text-[#9CA3B0]">
          Optional. Only count events matching this expression.
        </p>
      </div>

      <div className="flex flex-col gap-[4px]">
        <label className={labelClass}>Value key</label>
        <input
          className={inputClass}
          placeholder="e.g. token_count"
          value={data.valueKey ?? ""}
          onChange={(e) => set("valueKey", e.target.value)}
        />
        <p className="text-[11px] text-[#9CA3B0]">
          The event payload key containing the usage quantity. Required for sum/max aggregation.
        </p>
      </div>
    </div>
  )
}
