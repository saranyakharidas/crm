'use client'

import { AppShell } from '@/components/crm/app-shell'
import { DealsKanban } from '@/components/crm/deals-kanban'
import { DealsProvider } from '@/lib/deals-context'
import { ContactsProvider } from '@/lib/contacts-context'

export default function DealsPage() {
  return (
    <ContactsProvider>
      <DealsProvider>
        <AppShell>
          <DealsKanban />
        </AppShell>
      </DealsProvider>
    </ContactsProvider>
  )
}