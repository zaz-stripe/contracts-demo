'use client'

import type { ComponentProps, RefObject, ReactNode } from "react"
import { useMemo, useState } from "react"

import { ObjectCreationNav } from "@/components/ObjectCreationNav"
import { MobilePreviewSheet } from "@/components/product-catalog/MobilePreviewSheet"
import { ProductAssistantPanelDock } from "@/components/product-catalog/ProductAssistantPanelDock"
import { ProductFormPanelHeader } from "@/components/product-catalog/ProductFormPanelHeader"
import { ProductPreviewArea } from "@/components/product-catalog/ProductPreviewArea"
import { cn } from "@/lib/utils"

type ProductModalBodyProps = {
  containerRef: RefObject<HTMLDivElement | null>
  navProps: ComponentProps<typeof ObjectCreationNav>
  formHeaderProps: ComponentProps<typeof ProductFormPanelHeader>
  formContent: ReactNode
  isFormLoading?: boolean
  previewProps: ComponentProps<typeof ProductPreviewArea>
  assistantDockProps: ComponentProps<typeof ProductAssistantPanelDock>
}

export function ProductModalBody({
  containerRef,
  navProps,
  formHeaderProps,
  formContent,
  isFormLoading,
  previewProps,
  assistantDockProps,
}: ProductModalBodyProps) {
  const [mobilePane, setMobilePane] = useState<"nav" | "form">("nav")

  const navPropsWithMobileRouting = useMemo(() => {
    return {
      ...navProps,
      onSelectForm: (next: Parameters<typeof navProps.onSelectForm>[0]) => {
        navProps.onSelectForm(next)
        setMobilePane("form")
      },
      onSelectPrice: (id: number) => {
        navProps.onSelectPrice(id)
        setMobilePane("form")
      },
      onAddPrice: () => {
        navProps.onAddPrice()
        setMobilePane("form")
      },
    }
  }, [navProps])

  return (
    <div ref={containerRef} className="flex h-full w-full min-w-0 bg-[#F5F6F8]">
      <div className={`${mobilePane === "nav" ? "flex w-full sm:w-auto" : "hidden"} 2xl:flex 2xl:w-auto`}>
        <ObjectCreationNav {...navPropsWithMobileRouting} />
      </div>

      <div className={`${mobilePane === "form" ? "flex min-w-0 w-full sm:w-auto 2xl:w-auto" : "hidden"} 2xl:flex`}>
        <div className="relative z-10 flex min-w-0 flex-col bg-white w-full sm:w-[340px] sm:max-w-[340px] border-r sm:rounded-r-[12px] border-[#EBEEF1] shadow-[2px_0_2px_rgba(0,0,0,0.01),4px_0_4px_rgba(0,0,0,0.01),8px_0_8px_rgba(0,0,0,0.01),16px_0_16px_rgba(0,0,0,0.01)]">
          <ProductFormPanelHeader {...formHeaderProps} onBack={() => setMobilePane("nav")} />
          <div className="flex-1 overflow-y-auto py-4">
            {isFormLoading ? (
              <div className="space-y-4 px-4 animate-pulse">
                <div className="h-[14px] w-[140px] rounded-[6px] bg-[#EBEEF1]" />
                <div className="h-[32px] w-full rounded-[8px] bg-[#EBEEF1]" />
                <div className="h-[14px] w-[180px] rounded-[6px] bg-[#EBEEF1]" />
                <div className="h-[32px] w-full rounded-[8px] bg-[#EBEEF1]" />
                <div className="h-[14px] w-[160px] rounded-[6px] bg-[#EBEEF1]" />
                <div className="h-[32px] w-full rounded-[8px] bg-[#EBEEF1]" />
                <div className="mt-6 h-[14px] w-[120px] rounded-[6px] bg-[#EBEEF1]" />
                <div className="h-[32px] w-full rounded-[8px] bg-[#EBEEF1]" />
                <div className="h-[32px] w-[92%] rounded-[8px] bg-[#EBEEF1]" />
                <div className="h-[32px] w-[86%] rounded-[8px] bg-[#EBEEF1]" />
              </div>
            ) : (
              formContent
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "hidden sm:flex min-w-0 flex-1",
          // When the assistant dock is open below 2xl, it becomes a fixed overlay and doesn't take layout space.
          // Reserve space so the preview content centers within the visible area.
          assistantDockProps.isOpen && "pr-[var(--assistantDockWidth)] 2xl:pr-0"
        )}
        style={
          assistantDockProps.isOpen
            ? ({ "--assistantDockWidth": `${assistantDockProps.widthPx}px` } as React.CSSProperties)
            : undefined
        }
      >
        <ProductPreviewArea {...previewProps} />
      </div>
      <div
        className={
          assistantDockProps.isOpen
            ? "fixed inset-0 z-40 flex justify-end 2xl:static 2xl:inset-auto 2xl:z-auto"
            : "hidden 2xl:flex"
        }
      >
        {/* When open below xl, the assistant should take precedence and remain visible. */}
        {assistantDockProps.isOpen ? <div className="absolute inset-0 bg-black/10 2xl:hidden" /> : null}
        <div className="relative">
          <ProductAssistantPanelDock {...assistantDockProps} />
        </div>
      </div>

      {/* Mobile preview: pull up / pull down sheet */}
      <MobilePreviewSheet topInsetPx={72}>
        <div className="h-full w-full">
          <ProductPreviewArea {...previewProps} />
        </div>
      </MobilePreviewSheet>
    </div>
  )
}



