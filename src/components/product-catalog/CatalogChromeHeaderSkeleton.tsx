'use client'

export function CatalogChromeHeaderSkeleton() {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white" aria-hidden="true">
      <div className="h-[36px] w-[360px] rounded-[9px] bg-[#F5F6F8]" />
      <div className="flex items-center gap-[21px]">
        <div className="h-[16px] w-[16px] rounded-full bg-[#F5F6F8]" />
        <div className="h-[16px] w-[16px] rounded-full bg-[#F5F6F8]" />
      </div>
    </header>
  )
}


