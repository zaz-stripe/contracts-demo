export type TooltipSide = "top" | "bottom"

type GetTooltipPositionArgs = {
  anchorRect: DOMRect
  tooltipRect: DOMRect
  preferredSide?: TooltipSide
  gap?: number
  viewportPadding?: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

export function getTooltipPosition({
  anchorRect,
  tooltipRect,
  preferredSide = "top",
  gap = 8,
  viewportPadding = 8,
}: GetTooltipPositionArgs) {
  const { innerWidth, innerHeight } = window
  const centeredLeft = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2
  const maxLeft = Math.max(viewportPadding, innerWidth - tooltipRect.width - viewportPadding)
  const left = clamp(centeredLeft, viewportPadding, maxLeft)

  const spaceAbove = anchorRect.top - viewportPadding
  const spaceBelow = innerHeight - anchorRect.bottom - viewportPadding

  const side: TooltipSide =
    preferredSide === "top"
      ? (spaceAbove >= tooltipRect.height + gap || spaceAbove >= spaceBelow ? "top" : "bottom")
      : (spaceBelow >= tooltipRect.height + gap || spaceBelow >= spaceAbove ? "bottom" : "top")

  const rawTop = side === "top"
    ? anchorRect.top - tooltipRect.height - gap
    : anchorRect.bottom + gap
  const maxTop = Math.max(viewportPadding, innerHeight - tooltipRect.height - viewportPadding)
  const top = clamp(rawTop, viewportPadding, maxTop)

  return { top, left, side }
}
