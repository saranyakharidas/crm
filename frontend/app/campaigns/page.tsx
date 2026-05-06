'use client'

import { AppShell } from '@/components/crm/app-shell'
import { CampaignsView } from '@/components/crm/campaigns-view'
import { CampaignsProvider } from '@/lib/campaigns-context'

export default function CampaignsPage() {
  return (
    <CampaignsProvider>
      <AppShell>
        <CampaignsView />
      </AppShell>
    </CampaignsProvider>
  )
}