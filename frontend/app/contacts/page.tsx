'use client'

import { AppShell } from '@/components/crm/app-shell'
import { ContactsView } from '@/components/crm/contacts-view'
import { ActivityProvider } from '@/lib/activity-context'

export default function ContactsPage() {
  return (
    <ActivityProvider>
      <AppShell>
        <ContactsView />
      </AppShell>
    </ActivityProvider>
  )
}