"use client"

import { AppShell } from "@/components/crm/app-shell"
import { TicketsView } from "@/components/crm/tickets-view"

export default function TicketsPage() {
  return (
    <AppShell>
      <TicketsView />
    </AppShell>
  )
}
