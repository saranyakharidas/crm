'use client'

import { AppShell } from '@/components/crm/app-shell'
import { WorkflowsView } from '@/components/crm/workflows-view'
import { WorkflowProvider } from '@/lib/workflow-context'

export default function WorkflowsPage() {
  return (
    <WorkflowProvider>
      <AppShell>
        <WorkflowsView />
      </AppShell>
    </WorkflowProvider>
  )
}