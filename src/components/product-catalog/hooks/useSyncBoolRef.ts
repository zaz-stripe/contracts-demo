'use client'

import { useEffect } from "react"

export function useSyncBoolRef(
  value: boolean,
  ref: React.MutableRefObject<boolean>,
  opts?: { onFalse?: () => void }
) {
  const onFalse = opts?.onFalse
  useEffect(() => {
    ref.current = value
    if (!value) onFalse?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, value])
}


