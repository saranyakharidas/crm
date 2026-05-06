'use client'

import { AppShell } from '@/components/crm/app-shell'
import { AssignmentRulesView } from '@/components/crm/assignment-rules-view'
import { AssignmentRulesProvider } from '@/lib/assignment-rules-context'

export default function AssignmentRulesPage() {
  return (
    <AssignmentRulesProvider>
      <AppShell>
        <AssignmentRulesView />
      </AppShell>
    </AssignmentRulesProvider>
  )
}