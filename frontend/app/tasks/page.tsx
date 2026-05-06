"use client"

import { AppShell } from "@/components/crm/app-shell"
import { TasksView } from "@/components/crm/tasks-view"
import { TasksProvider } from "@/lib/tasks-context"
import { ContactsProvider } from "@/lib/contacts-context"
import { DealsProvider } from "@/lib/deals-context"

export default function TasksPage() {
  return (
    <ContactsProvider>
      <DealsProvider>
        <TasksProvider>
          <AppShell>
            <TasksView />
          </AppShell>
        </TasksProvider>
      </DealsProvider>
    </ContactsProvider>
  )
}
