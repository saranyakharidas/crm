'use client'

import { AppShell } from '@/components/crm/app-shell'
import { ContactsView } from '@/components/crm/contacts-view'
import { ContactsProvider } from '@/lib/contacts-context'

export default function ContactsPage() {
  return (
    <ContactsProvider>
      <AppShell>
        <ContactsView />
      </AppShell>
    </ContactsProvider>
  )
}