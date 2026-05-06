'use client'

import { AppShell } from '@/components/crm/app-shell'
import { ActivityTimeline } from '@/components/crm/activity-timeline'
import { ActivityProvider, useActivities, ACTIVITY_CONFIG, type ActivityType } from '@/lib/activity-context'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Phone, Mail, Users, StickyNote } from 'lucide-react'

function ActivityStats() {
  const { activities } = useActivities()

  const stats = [
    { label: 'Total Activities', value: activities.length, icon: <Clock className="h-4 w-4" /> },
    { label: 'Calls', value: activities.filter(a => a.type === 'call').length, icon: <Phone className="h-4 w-4" /> },
    { label: 'Emails', value: activities.filter(a => a.type === 'email').length, icon: <Mail className="h-4 w-4" /> },
    { label: 'Meetings', value: activities.filter(a => a.type === 'meeting').length, icon: <Users className="h-4 w-4" /> },
    { label: 'Notes', value: activities.filter(a => a.type === 'note').length, icon: <StickyNote className="h-4 w-4" /> },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {stats.map(s => (
        <Card key={s.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <span className="text-muted-foreground">{s.icon}</span>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ActivityPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" />
            Activity Feed
          </h1>
          <p className="text-muted-foreground mt-1">All interactions across contacts and deals.</p>
        </div>

        <ActivityStats />

        <Card>
          <CardContent className="p-6">
            <ActivityTimeline showEntityLinks />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default function ActivityPageWrapper() {
  return (
    <ActivityProvider>
      <ActivityPage />
    </ActivityProvider>
  )
}