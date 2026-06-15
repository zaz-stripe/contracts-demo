'use client'

import ReactCountryFlag from "react-country-flag"
import { getEmojiByCurrencyCode } from "country-currency-emoji-flags"

const CURRENCY_TO_FLAG_COUNTRY: Record<string, string> = {
  AED: "AE",
  AUD: "AU",
  BRL: "BR",
  CAD: "CA",
  CHF: "CH",
  CLP: "CL",
  CNY: "CN",
  COP: "CO",
  CZK: "CZ",
  DKK: "DK",
  EUR: "EU",
  GBP: "GB",
  HKD: "HK",
  HUF: "HU",
  IDR: "ID",
  ILS: "IL",
  INR: "IN",
  JPY: "JP",
  KRW: "KR",
  MXN: "MX",
  MYR: "MY",
  NOK: "NO",
  NZD: "NZ",
  PEN: "PE",
  PHP: "PH",
  PLN: "PL",
  RON: "RO",
  SAR: "SA",
  SEK: "SE",
  SGD: "SG",
  THB: "TH",
  TRY: "TR",
  TWD: "TW",
  USD: "US",
  UYU: "UY",
  VND: "VN",
  ZAR: "ZA",
}

export function CurrencyFlag({
  currency,
  size = 14,
  className,
}: {
  currency: string
  size?: number
  className?: string
}) {
  const code = (currency || "").trim().toUpperCase()

  const emoji = getEmojiByCurrencyCode(code)
  if (typeof emoji === "string" && emoji.trim() !== "") {
    return (
      <span
        aria-label={`${code} flag`}
        className={className}
        style={{ fontSize: size, lineHeight: 1 }}
      >
        {emoji}
      </span>
    )
  }

  const countryCode = CURRENCY_TO_FLAG_COUNTRY[code]
  if (!countryCode) return null

  return (
    <ReactCountryFlag
      countryCode={countryCode}
      aria-label={`${countryCode} flag`}
      style={{ fontSize: size, lineHeight: 1 }}
      className={className}
    />
  )
}


