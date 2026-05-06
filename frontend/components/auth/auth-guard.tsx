'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getStoredAccessToken } from '@/lib/auth'

const PUBLIC_PATHS = new Set(['/login', '/signup'])

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (PUBLIC_PATHS.has(pathname)) {
      setIsReady(true)
      return
    }

    const token = getStoredAccessToken()
    if (!token) {
      const query = searchParams.toString()
      const nextPath = query ? `${pathname}?${query}` : pathname
      window.location.replace(`/login?next=${encodeURIComponent(nextPath)}`)
      return
    }

    setIsReady(true)
  }, [pathname, searchParams])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-sm text-muted-foreground">Checking your session...</div>
      </div>
    )
  }

  return <>{children}</>
}
