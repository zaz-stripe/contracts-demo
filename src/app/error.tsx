'use client'

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface in dev tools; avoid swallowing errors silently.
    // eslint-disable-next-line no-console
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-white p-10 text-[#353A44]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="max-w-[720px] space-y-4">
        <div className="text-[20px] font-[700]">Something went wrong</div>
        <div className="text-[14px] text-[#596171]">
          This is a runtime error boundary to keep the dev server responsive during Fast Refresh. Try resetting the page.
        </div>
        <button
          type="button"
          className="inline-flex h-[32px] items-center justify-center rounded-[8px] border border-[#D8DEE4] bg-white px-3 text-[13px] font-[600] shadow-[0_1px_1px_rgba(33,37,44,0.16)] hover:bg-[#F5F6F8]"
          onClick={reset}
        >
          Try again
        </button>
        {error?.message ? (
          <pre className="whitespace-pre-wrap rounded-[8px] bg-[#F5F6F8] p-4 text-[12px] text-[#353A44]">
            {error.message}
          </pre>
        ) : null}
      </div>
    </div>
  )
}


