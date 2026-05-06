'use client'

import { AppShell } from '@/components/crm/app-shell'
import { DealsKanban } from '@/components/crm/deals-kanban'
import { DealsProvider } from '@/lib/deals-context'

export default function DealsPage() {
  return (
    <DealsProvider>
      <AppShell>
        <DealsKanban />
      </AppShell>
    </DealsProvider>
  )
}