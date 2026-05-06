'use client'

import { AppShell } from '@/components/crm/app-shell'
import { QuotesView } from '@/components/crm/quotes-view'
import { QuotesProvider } from '@/lib/quotes-context'

export default function QuotesPage() {
  return (
    <QuotesProvider>
      <AppShell>
        <QuotesView />
      </AppShell>
    </QuotesProvider>
  )
}