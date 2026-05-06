"use client"

import { useMemo } from "react"
import { useCRM } from "@/lib/crm-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react"

// Chart colors - using hex values for Recharts compatibility
const CHART_COLORS = {
  primary: '#6366f1', // indigo
  secondary: '#22d3ee', // cyan
  success: '#22c55e', // green
  warning: '#f59e0b', // amber
  danger: '#ef4444', // red
  purple: '#8b5cf6', // purple
  border: '#374151', // gray border
  muted: '#9ca3af', // muted text
  card: '#1f2937', // card background
  foreground: '#f3f4f6', // light text
}
const COLORS = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger, CHART_COLORS.purple, CHART_COLORS.secondary]

export function AnalyticsView() {
  const { deals, contacts, leads, tickets, events } = useCRM()

  const revenueData = useMemo(() => {
    if (!deals) return []
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentMonth = new Date().getMonth()
    
    return months.slice(0, currentMonth + 1).map((month, index) => {
      const monthDeals = deals.filter((deal) => {
        const dealMonth = new Date(deal.createdAt).getMonth()
        return dealMonth === index && deal.stage === "closed_won"
      })
      const revenue = monthDeals.reduce((sum, deal) => sum + deal.value, 0)
      const target = 50000 + Math.random() * 30000
      
      return {
        month,
        revenue,
        target: Math.round(target),
        deals: monthDeals.length,
      }
    })
  }, [deals])

  const pipelineData = useMemo(() => {
    if (!deals) return []
    const stages = [
      { name: "Lead", key: "lead" },
      { name: "Qualified", key: "qualified" },
      { name: "Proposal", key: "proposal" },
      { name: "Negotiation", key: "negotiation" },
      { name: "Won", key: "closed_won" },
      { name: "Lost", key: "closed_lost" },
    ]

    return stages.map((stage) => ({
      name: stage.name,
      count: deals.filter((d) => d.stage === stage.key).length,
      value: deals
        .filter((d) => d.stage === stage.key)
        .reduce((sum, d) => sum + d.value, 0),
    }))
  }, [deals])

  const leadSourceData = useMemo(() => {
    if (!leads) return []
    const sources = ["website", "referral", "linkedin", "cold_call", "event", "other"]
    return sources.map((source) => ({
      name: source.charAt(0).toUpperCase() + source.slice(1).replace("_", " "),
      value: leads.filter((l) => l.source === source).length,
    }))
  }, [leads])

  const ticketCategoryData = useMemo(() => {
    if (!tickets) return []
    const categories = ["billing", "technical", "general", "feature-request", "bug"]
    return categories.map((category) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1).replace("-", " "),
      value: tickets.filter((t) => t.category === category).length,
    }))
  }, [tickets])

  const activityTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date
    })

    return last7Days.map((date) => {
      const dayEvents = (events || []).filter((e) => {
        const eventDate = new Date(e.start)
        return eventDate.toDateString() === date.toDateString()
      })

      return {
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        calls: dayEvents.filter((e) => e.type === "call").length,
        demos: dayEvents.filter((e) => e.type === "demo").length,
        meetings: dayEvents.filter((e) => e.type === "meeting").length,
      }
    })
  }, [events])

  const kpis = useMemo(() => {
    if (!deals || !contacts || !leads) return {
      totalRevenue: 0,
      avgDealSize: 0,
      conversionRate: 0,
      activeDeals: 0,
      pipelineValue: 0,
      totalContacts: 0,
      totalLeads: 0,
      qualifiedLeads: 0,
    }
    const totalRevenue = deals
      .filter((d) => d.stage === "closed_won")
      .reduce((sum, d) => sum + d.value, 0)
    const avgDealSize = totalRevenue / deals.filter((d) => d.stage === "closed_won").length || 0
    const conversionRate = (deals.filter((d) => d.stage === "closed_won").length / deals.length) * 100 || 0
    const activeDeals = deals.filter((d) => !["closed_won", "closed_lost"].includes(d.stage)).length
    const pipelineValue = deals
      .filter((d) => !["closed_won", "closed_lost"].includes(d.stage))
      .reduce((sum, d) => sum + d.value, 0)

    return {
      totalRevenue,
      avgDealSize,
      conversionRate,
      activeDeals,
      pipelineValue,
      totalContacts: contacts.length,
      totalLeads: leads.length,
      qualifiedLeads: leads.filter((l) => l.status === "qualified").length,
    }
  }, [deals, contacts, leads])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your sales performance and team productivity
          </p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-36">
            <Calendar className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis.totalRevenue)}</p>
                <div className="flex items-center gap-1 mt-1 text-green-500 text-xs">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>12.5% from last month</span>
                </div>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis.pipelineValue)}</p>
                <div className="flex items-center gap-1 mt-1 text-green-500 text-xs">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>8.2% from last month</span>
                </div>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{kpis.conversionRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                  <ArrowDownRight className="h-3 w-3" />
                  <span>2.1% from last month</span>
                </div>
              </div>
              <div className="rounded-full bg-yellow-500/10 p-3">
                <Percent className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Deal Size</p>
                <p className="text-2xl font-bold">{formatCurrency(kpis.avgDealSize)}</p>
                <div className="flex items-center gap-1 mt-1 text-green-500 text-xs">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>5.8% from last month</span>
                </div>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Target</CardTitle>
            <CardDescription>Monthly revenue performance against targets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                <XAxis dataKey="month" stroke={CHART_COLORS.muted} fontSize={12} tickLine={false} />
                <YAxis stroke={CHART_COLORS.muted} fontSize={12} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_COLORS.card,
                    border: `1px solid ${CHART_COLORS.border}`,
                    borderRadius: "8px",
                    color: CHART_COLORS.foreground,
                  }}
                  labelStyle={{ color: CHART_COLORS.foreground }}
                  itemStyle={{ color: CHART_COLORS.foreground }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={CHART_COLORS.primary}
                  fill={CHART_COLORS.primary}
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  name="Target"
                  stroke={CHART_COLORS.success}
                  fill={CHART_COLORS.success}
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Pipeline</CardTitle>
            <CardDescription>Deals by stage with total value</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                <XAxis dataKey="name" stroke={CHART_COLORS.muted} fontSize={12} tickLine={false} />
                <YAxis stroke={CHART_COLORS.muted} fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_COLORS.card,
                    border: `1px solid ${CHART_COLORS.border}`,
                    borderRadius: "8px",
                    color: CHART_COLORS.foreground,
                  }}
                  labelStyle={{ color: CHART_COLORS.foreground }}
                  itemStyle={{ color: CHART_COLORS.foreground }}
                />
                <Bar dataKey="count" name="Deals" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Where your leads come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_COLORS.card,
                    border: `1px solid ${CHART_COLORS.border}`,
                    borderRadius: "8px",
                    color: CHART_COLORS.foreground,
                  }}
                  labelStyle={{ color: CHART_COLORS.foreground }}
                  itemStyle={{ color: CHART_COLORS.foreground }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {leadSourceData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ticket Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Categories</CardTitle>
            <CardDescription>Support request breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={ticketCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ticketCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_COLORS.card,
                    border: `1px solid ${CHART_COLORS.border}`,
                    borderRadius: "8px",
                    color: CHART_COLORS.foreground,
                  }}
                  labelStyle={{ color: CHART_COLORS.foreground }}
                  itemStyle={{ color: CHART_COLORS.foreground }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {ticketCategoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Trends</CardTitle>
            <CardDescription>Last 7 days activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activityTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                <XAxis dataKey="day" stroke={CHART_COLORS.muted} fontSize={12} tickLine={false} />
                <YAxis stroke={CHART_COLORS.muted} fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: CHART_COLORS.card,
                    border: `1px solid ${CHART_COLORS.border}`,
                    borderRadius: "8px",
                    color: CHART_COLORS.foreground,
                  }}
                  labelStyle={{ color: CHART_COLORS.foreground }}
                  itemStyle={{ color: CHART_COLORS.foreground }}
                />
                <Legend />
                <Line type="monotone" dataKey="calls" name="Calls" stroke={CHART_COLORS.primary} strokeWidth={2} />
                <Line type="monotone" dataKey="demos" name="Demos" stroke={CHART_COLORS.success} strokeWidth={2} />
                <Line type="monotone" dataKey="meetings" name="Meetings" stroke={CHART_COLORS.warning} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead Performance</CardTitle>
            <CardDescription>Lead qualification and conversion metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Leads</span>
                <span className="font-medium">{kpis.totalLeads}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Qualified Leads</span>
                <span className="font-medium">{kpis.qualifiedLeads}</span>
              </div>
              <Progress value={(kpis.qualifiedLeads / kpis.totalLeads) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversion to Deal</span>
                <span className="font-medium">{deals.length}</span>
              </div>
              <Progress value={(deals.length / kpis.totalLeads) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Closed Won</span>
                <span className="font-medium">{deals.filter((d) => d.stage === "closed_won").length}</span>
              </div>
              <Progress value={(deals.filter((d) => d.stage === "closed_won").length / deals.length) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key performance indicators at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold">{kpis.activeDeals}</p>
                <p className="text-sm text-muted-foreground">Active Deals</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold">{kpis.totalContacts}</p>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold">{(tickets || []).filter((t) => t.status === "open").length}</p>
                <p className="text-sm text-muted-foreground">Open Tickets</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <p className="text-3xl font-bold">{(events || []).length}</p>
                <p className="text-sm text-muted-foreground">Scheduled Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
