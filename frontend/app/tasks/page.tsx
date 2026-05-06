"use client"

import { AppShell } from "@/components/crm/app-shell"
import { TasksView } from "@/components/crm/tasks-view"
import { TasksProvider } from "@/lib/tasks-context"

export default function TasksPage() {
  return (
    <TasksProvider>
      <AppShell>
        <TasksView />
      </AppShell>
    </TasksProvider>
  )
}
