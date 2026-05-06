'use client'

import Link from 'next/link'
import {
  BarChart3,
  Box,
  Building2,
  Megaphone,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserPlus,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useDashboard } from '@/lib/dashboard-context'
import { cn } from '@/lib/utils'

const CHART_COLORS = {
  primary: '#2563eb',
  secondary: '#0f766e',
  tertiary: '#d97706',
  quaternary: '#7c3aed',
  quinary: '#dc2626',
  border: '#374151',
  card: '#111827',
  muted: '#9ca3af',
  foreground: '#f3f4f6',
}

const PIE_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.quinary,
]

export function Dashboard() {
  const { summary, isLoading, error, refreshSummary } = useDashboard()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading dashboard from the backend...
        </CardContent>
      </Card>
    )
  }

  if (error || !summary) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-destructive">Could not load dashboard</p>
            <p className="text-sm text-muted-foreground">{error ?? 'No dashboard data returned.'}</p>
          </div>
          <Button variant="outline" onClick={() => void refreshSummary()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const campaignChartData = summary.campaign_performance.map(campaign => ({
    name: campaign.name.length > 18 ? `${campaign.name.slice(0, 18)}...` : campaign.name,
    sent: campaign.metrics.sent,
    clicked: campaign.metrics.clicked,
    converted: campaign.metrics.converted,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Live overview of your accounts, leads, campaigns, and product catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void refreshSummary()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href="/campaigns">
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              Manage Campaigns
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Accounts"
          value={summary.stats.total_accounts.value.toString()}
          change={summary.stats.total_accounts.change}
          icon={Building2}
          description="Total tracked companies"
        />
        <KPICard
          title="Active Campaigns"
          value={summary.stats.active_campaigns.value.toString()}
          change={summary.stats.active_campaigns.change}
          icon={Megaphone}
          description="Currently running"
        />
        <KPICard
          title="Leads"
          value={summary.stats.total_leads.value.toString()}
          change={summary.stats.total_leads.change}
          icon={UserPlus}
          description="Across all sources"
        />
        <KPICard
          title="Products"
          value={summary.stats.total_products.value.toString()}
          change={summary.stats.total_products.change}
          icon={Box}
          description="Catalog items"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Activity Growth</CardTitle>
            <CardDescription>New records created over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.monthly_activity}>
                  <defs>
                    <linearGradient id="accountsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                  <XAxis dataKey="month" stroke={CHART_COLORS.muted} tickLine={false} fontSize={12} />
                  <YAxis stroke={CHART_COLORS.muted} tickLine={false} fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: CHART_COLORS.card, border: `1px solid ${CHART_COLORS.border}` }} />
                  <Area type="monotone" dataKey="accounts" stroke={CHART_COLORS.primary} fill="url(#accountsFill)" strokeWidth={2} />
                  <Area type="monotone" dataKey="leads" stroke={CHART_COLORS.secondary} fill="url(#leadsFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Distribution of captured leads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.lead_sources}
                    dataKey="count"
                    nameKey="source"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={2}
                  >
                    {summary.lead_sources.map((entry, index) => (
                      <Cell key={entry.source} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: CHART_COLORS.card, border: `1px solid ${CHART_COLORS.border}` }}
                    formatter={(value: number, _name, item) => [`${value} leads`, `${item.payload.source}`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {summary.lead_sources.slice(0, 4).map((source, index) => (
                <div key={source.source} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                  <span>{source.source} ({source.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Latest campaign activity from the backend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.campaign_performance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaigns yet.</p>
            ) : summary.campaign_performance.map(campaign => (
              <div key={campaign.id} className="rounded-lg bg-muted/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-muted-foreground">{campaign.target_segment}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{campaign.status}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded bg-background/60 py-2">
                    <p className="font-semibold">{campaign.metrics.sent.toLocaleString()}</p>
                    <p className="text-muted-foreground">Sent</p>
                  </div>
                  <div className="rounded bg-background/60 py-2">
                    <p className="font-semibold">{campaign.metrics.clicked.toLocaleString()}</p>
                    <p className="text-muted-foreground">Clicks</p>
                  </div>
                  <div className="rounded bg-background/60 py-2">
                    <p className="font-semibold">{campaign.metrics.converted.toLocaleString()}</p>
                    <p className="text-muted-foreground">Conv.</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Hot Leads</CardTitle>
            <CardDescription>Highest scoring opportunities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.hot_leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            ) : summary.hot_leads.map(lead => (
              <div key={lead.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{lead.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{lead.company || lead.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{lead.score}</p>
                  <p className="text-xs capitalize text-muted-foreground">{lead.source}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Recently updated catalog items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.top_products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No products yet.</p>
            ) : summary.top_products.map(product => (
              <div key={product.id} className="space-y-1">
                <p className="font-medium">{product.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{product.code}</span>
                  <span>${product.base_price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Throughput</CardTitle>
            <CardDescription>Sent, clicked, and converted for recent campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                  <XAxis dataKey="name" stroke={CHART_COLORS.muted} tickLine={false} fontSize={12} />
                  <YAxis stroke={CHART_COLORS.muted} tickLine={false} fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: CHART_COLORS.card, border: `1px solid ${CHART_COLORS.border}` }} />
                  <Bar dataKey="sent" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clicked" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="converted" fill={CHART_COLORS.quaternary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Accounts</CardTitle>
            <CardDescription>Most recently updated companies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.recent_accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No accounts yet.</p>
            ) : summary.recent_accounts.map(account => (
              <div key={account.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm capitalize text-muted-foreground">
                      {account.industry.replace('_', ' ')} • {account.type}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-semibold">${account.annual_revenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string
  change: number
  icon: React.ElementType
  description: string
}

function KPICard({ title, value, change, icon: Icon, description }: KPICardProps) {
  const isPositive = change >= 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              isPositive ? 'text-green-500' : 'text-red-500',
            )}
          >
            <TrendIcon className="h-4 w-4" />
            {Math.abs(change)}%
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-bold">{value}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground/70">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
