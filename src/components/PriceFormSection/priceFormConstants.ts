/**
 * CSS class constants for price form styling
 */
export const moneyInputClasses =
  "flex items-center gap-[8px] rounded-[6px] border border-[#D8DEE4] bg-white px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] hover:border-[#B6C0CD] focus-within:shadow-[0_0_0_1.5px_#A0D0F7] focus-within:border-[#A0D0F7] transition-all"

export const rowSelectorButtonClasses =
  "h-[32px] px-[12px] py-[8px] text-[12px] leading-[16px] tracking-[-0.024px]"

export const packageQuantityInputClasses =
  "flex items-center gap-2 rounded-l-[6px] border border-[#D8DEE4] bg-[#F5F6F8] px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"

export const packageUnitsInputClasses =
  "flex items-center gap-2 rounded-r-[6px] border border-[#D8DEE4] border-l-0 bg-[#F5F6F8] px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44]"

export const detailTileClasses =
  "flex h-[32px] items-center overflow-clip rounded-[6px] bg-[#F5F6F8] px-[12px] py-[8px] text-[12px] font-[500] leading-[16px] text-[#353A44] hover:bg-[#EBEEF1] transition-colors"

export const textFieldInputClasses =
  "w-full h-[32px] rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:border-[#A0D0F7] transition-all"

export const priceNameInputClasses =
  "w-full h-[32px] rounded-[6px] border border-[#D8DEE4] bg-white p-[8px] text-[12px] font-[500] leading-[16px] tracking-[-0.024px] text-[#353A44] placeholder:text-[#6C7688] outline-none hover:border-[#B6C0CD] focus:shadow-[0_0_0_1.5px_#A0D0F7] focus:border-[#A0D0F7] transition-all"

export const assistantHighlightClass = "highlight-ring highlight-ring-fade"

/**
 * Option arrays for selectors
 */
export const chargeFrequencyOptions = ["Recurring", "One-off"]
export const recurringPricingOptions = ["Flat rate", "Package pricing", "Tiered pricing", "Usage-based"]
export const oneOffPricingOptions = ["Flat rate", "Package pricing", "Customer chooses price"]
export const billingPeriodOptions = ["Daily", "Weekly", "Monthly", "Yearly", "Every 3 months", "Every 6 months"]
export const includeTaxOptions = ["Taxes included", "Taxes excluded", "Auto"]
export const tieredByOptions = ["Volume", "Graduated"]
export const usageBasisOptions = ["Unit", "Package", "Tier"]
