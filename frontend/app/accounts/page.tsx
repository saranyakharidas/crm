'use client'

import { AppShell } from '@/components/crm/app-shell'
import { AccountsView } from '@/components/crm/accounts-view'
import { AccountsProvider } from '@/lib/accounts-context'

export default function AccountsPage() {
  return (
    <AccountsProvider>
      <AppShell>
        <AccountsView />
      </AppShell>
    </AccountsProvider>
  )
}