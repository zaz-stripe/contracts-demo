"use client"

type FieldHintProps = {
  t: (key: string) => string
  text: string
  visible?: boolean
}

/** Helper text shown below a form label during first-time setup. */
export function FieldHint({ t, text, visible }: FieldHintProps) {
  if (!visible) return null

  return (
    <p className="text-[12px] font-[400] leading-[16px] text-[#50617A]">
      {t(text)}
    </p>
  )
}
