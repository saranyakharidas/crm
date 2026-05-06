import { AppShell } from '@/components/crm/app-shell'
import { Dashboard } from '@/components/crm/dashboard'
import { DashboardProvider } from '@/lib/dashboard-context'

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <AppShell>
        <Dashboard />
      </AppShell>
    </DashboardProvider>
  )
}
