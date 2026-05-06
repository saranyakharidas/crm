"use client"

import { AppShell } from "@/components/crm/app-shell"
import { LeadsView } from "@/components/crm/leads-view"
import { LeadsProvider } from "@/lib/leads-context"

export default function LeadsPage() {
  return (
    <LeadsProvider>
      <AppShell>
        <LeadsView />
      </AppShell>
    </LeadsProvider>
  )
}
