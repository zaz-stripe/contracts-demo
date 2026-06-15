'use client'

import ReactCountryFlag from "react-country-flag"

const LOCATION_TO_FLAG_COUNTRY: Record<string, string> = {
  USA: "US",
  Canada: "CA",
  Japan: "JP",
  Australia: "AU",
  "United Kingdom": "GB",
  Europe: "EU",
}

export function LocationFlag({
  location,
  size = 14,
  className,
}: {
  location: string
  size?: number
  className?: string
}) {
  const value = (location || "").trim()
  const countryCode = LOCATION_TO_FLAG_COUNTRY[value]
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



