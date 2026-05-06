'use client'

import { AppShell } from '@/components/crm/app-shell'
import { DealsKanban } from '@/components/crm/deals-kanban'
import { ActivityProvider } from '@/lib/activity-context'

export default function DealsPage() {
  return (
    <ActivityProvider>
      <AppShell>
        <DealsKanban />
      </AppShell>
    </ActivityProvider>
  )
}