'use client'

export function CatalogTableToolbarSkeleton() {
  return (
    <div aria-hidden="true">
      {/* Menu row */}
      <div className="mt-4 flex flex-wrap gap-5 border-b border-[#EBEEF1] pb-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-[11px] w-[81px] rounded-full bg-[#F5F6F8]" />
        ))}
      </div>

      {/* Action filters */}
      <div className="mt-4 flex flex-wrap gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex-1 min-w-[180px] rounded-[6px] border border-[#D8DEE4] bg-white px-4 py-3">
            <div className="h-[11px] w-full rounded-full bg-[#F5F6F8]" />
          </div>
        ))}
      </div>
    </div>
  )
}


