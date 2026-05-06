'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { API_BASE_URL, getStoredAccessToken, setStoredAccessToken } from '@/lib/auth'

type LoginResponse = {
  access_token: string
  token_type: string
}

function isLoginResponse(value: unknown): value is LoginResponse {
  return typeof value === 'object' && value !== null && 'access_token' in value
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('saranya@example.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nextPath = searchParams.get('next') || '/accounts'

  useEffect(() => {
    const token = getStoredAccessToken()
    if (token) {
      router.replace(nextPath)
    }
  }, [nextPath, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password,
        }),
      })

      const data: unknown = await response.json()

      if (!response.ok) {
        const detail =
          typeof data === 'object' && data !== null && 'detail' in data && typeof data.detail === 'string'
            ? data.detail
            : 'Unable to sign in with those credentials.'
        throw new Error(
          detail,
        )
      }

      if (!isLoginResponse(data)) {
        throw new Error('Login succeeded, but the server response was incomplete.')
      }

      setStoredAccessToken(data.access_token)
      router.replace(nextPath)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(10,10,15,0.75))]" />

      <div className="relative z-10 grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden rounded-3xl border border-border/60 bg-card/40 p-10 backdrop-blur lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-foreground">CRM Pro</div>
              <div className="text-sm text-muted-foreground">Sales workspace for fast-moving teams</div>
            </div>
          </div>

          <h1 className="max-w-md text-4xl font-semibold tracking-tight text-foreground">
            Sign in once, and the rest of the CRM should just work.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
            This frontend now logs you into the FastAPI backend directly and stores the session token
            for the API-backed pages.
          </p>
        </div>

        <Card className="border-border/70 bg-card/90 py-0 shadow-2xl shadow-black/20 backdrop-blur">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Use your backend credentials to access accounts and other API-backed CRM pages.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              Need an account first?{' '}
              <Link className="text-primary hover:underline" href={`/signup?next=${encodeURIComponent(nextPath)}`}>
                Create one here
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
