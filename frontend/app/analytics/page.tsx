'use client'

import { AppShell } from '@/components/crm/app-shell'
import { AnalyticsView } from '@/components/crm/analytics-view'
import { ReportsView } from '@/components/crm/reports-view'
import { ForecastingView } from '@/components/crm/forecasting-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, FileBarChart, TrendingUp } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <AppShell>
      <Tabs defaultValue="analytics">
        <div className="mb-6">
          <TabsList>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="gap-2">
              <TrendingUp className="h-4 w-4" /> Forecasting
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileBarChart className="h-4 w-4" /> Custom Reports
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="analytics">
          <AnalyticsView />
        </TabsContent>
        <TabsContent value="forecasting">
          <ForecastingView />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsView />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}