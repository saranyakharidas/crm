'use client'

import { AppShell } from '@/components/crm/app-shell'
import { RecurringTasksView } from '@/components/crm/recurring-tasks-view'
import { RecurringTasksProvider } from '@/lib/recurring-tasks-context'

export default function RecurringTasksPage() {
  return (
    <RecurringTasksProvider>
      <AppShell>
        <RecurringTasksView />
      </AppShell>
    </RecurringTasksProvider>
  )
}