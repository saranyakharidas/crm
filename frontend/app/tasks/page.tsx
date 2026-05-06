"use client"

import { AppShell } from "@/components/crm/app-shell"
import { TasksView } from "@/components/crm/tasks-view"

export default function TasksPage() {
  return (
    <AppShell>
      <TasksView />
    </AppShell>
  )
}
