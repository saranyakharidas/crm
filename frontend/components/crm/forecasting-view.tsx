'use client'

import { useState, useMemo } from 'react'
import { useCRM } from '@/lib/crm-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import {
  TrendingUp, DollarSign, Target, AlertTriangle,
  CheckCircle2, Clock, ArrowUpRight, ArrowDownRight,
  Calendar, Filter, Info, Sparkles, BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  addMonths, format, startOfMonth, endOfMonth,
  isWithinInterval, parseISO, differenceInDays,
} from 'date-fns'

// ─── Constants ────────────────────────────────────────────────────────────────
const STAGE_PROBABILITY: Record<string, number> = {
  'lead':        10,
  'qualified':   25,
  'proposal':    50,
  'negotiation': 75,
  'closed-won':  100,
  'closed-lost': 0,
}

const STAGE_ORDER = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']

const STAGE_LABELS: Record<string, string> = {
  'lead':        'Lead',
  'qualified':   'Qualified',
  'proposal':    'Proposal',
  'negotiation': 'Negotiation',
  'closed-won':  'Closed Won',
  'closed-lost': 'Closed Lost',
}

const STAGE_COLORS: Record<string, string> = {
  'lead':        '#64748b',
  'qualified':   '#3b82f6',
  'proposal':    '#f59e0b',
  'negotiation': '#f97316',
  'closed-won':  '#22c55e',
  'closed-lost': '#ef4444',
}

const CHART_COLORS = {
  weighted:   '#6366f1',
  bestCase:   '#22c55e',
  worstCase:  '#ef4444',
  committed:  '#f59e0b',
  grid:       '#374151',
  muted:      '#9ca3af',
  fg:         '#f3f4f6',
  bg:         '#1f2937',
  border:     '#374151',
}

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: CHART_COLORS.bg, border: `1px solid ${CHART_COLORS.border}`, borderRadius: '8px', color: CHART_COLORS.fg },
  labelStyle: { color: CHART_COLORS.fg },
}

function fmtMoney(n: number, compact = false) {
  if (compact) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

// ─── Scenario multipliers ──────────────────────────────────────────────────────
const SCENARIOS = {
  optimistic:  { label: 'Optimistic',  multiplier: 1.2,  color: 'text-green-400'  },
  realistic:   { label: 'Realistic',   multiplier: 1.0,  color: 'text-primary'    },
  pessimistic: { label: 'Pessimistic', multiplier: 0.7,  color: 'text-amber-400'  },
} as const
type ScenarioKey = keyof typeof SCENARIOS

// ─── Main view ────────────────────────────────────────────────────────────────
export function ForecastingView() {
  const { deals } = useCRM()
  const [horizon,  setHorizon]  = useState<'3' | '6' | '12'>('6')
  const [scenario, setScenario] = useState<ScenarioKey>('realistic')
  const [stageFilter, setStageFilter] = useState('all')

  const activeDeals = useMemo(() =>
    (deals ?? []).filter(d => !['closed-won', 'closed-lost'].includes(d.stage))
  , [deals])

  const closedWonDeals = useMemo(() =>
    (deals ?? []).filter(d => d.stage === 'closed-won')
  , [deals])

  // ── Monthly forecast buckets ──────────────────────────────────────────────
  const monthlyForecast = useMemo(() => {
    const months = parseInt(horizon)
    const mult   = SCENARIOS[scenario].multiplier

    return Array.from({ length: months }, (_, i) => {
      const monthStart = startOfMonth(addMonths(new Date(), i))
      const monthEnd   = endOfMonth(monthStart)

      const monthDeals = activeDeals.filter(d => {
        try {
          const closeDate = parseISO(d.expectedCloseDate)
          return isWithinInterval(closeDate, { start: monthStart, end: monthEnd })
        } catch { return false }
      })

      const weighted  = monthDeals.reduce((s, d) => s + d.value * (d.probability / 100) * mult, 0)
      const bestCase  = monthDeals.reduce((s, d) => s + d.value * 1.0 * mult, 0)
      const worstCase = monthDeals.reduce((s, d) => s + d.value * Math.min(d.probability / 100, 0.5) * mult, 0)
      const committed = monthDeals.filter(d => d.probability >= 70).reduce((s, d) => s + d.value * mult, 0)

      // Won revenue for the same month (historical)
      const won = closedWonDeals
        .filter(d => {
          try { return isWithinInterval(parseISO(d.expectedCloseDate), { start: monthStart, end: monthEnd }) }
          catch { return false }
        })
        .reduce((s, d) => s + d.value, 0)

      return {
        month:      format(monthStart, 'MMM yy'),
        weighted:   Math.round(weighted),
        bestCase:   Math.round(bestCase),
        worstCase:  Math.round(worstCase),
        committed:  Math.round(committed),
        won,
        dealCount:  monthDeals.length,
      }
    })
  }, [activeDeals, closedWonDeals, horizon, scenario])

  // ── Pipeline by stage ─────────────────────────────────────────────────────
  const stageBreakdown = useMemo(() => {
    const mult = SCENARIOS[scenario].multiplier
    return STAGE_ORDER
      .filter(s => !['closed-won', 'closed-lost'].includes(s))
      .map(stage => {
        const stageDeals = activeDeals.filter(d => d.stage === stage)
        const totalValue  = stageDeals.reduce((s, d) => s + d.value, 0)
        const weighted    = stageDeals.reduce((s, d) => s + d.value * (d.probability / 100) * mult, 0)
        return {
          stage,
          label:      STAGE_LABELS[stage],
          count:      stageDeals.length,
          totalValue,
          weighted:   Math.round(weighted),
          probability: STAGE_PROBABILITY[stage],
          color:      STAGE_COLORS[stage],
        }
      })
  }, [activeDeals, scenario])

  // ── Summary KPIs ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const mult = SCENARIOS[scenario].multiplier
    const totalPipeline = activeDeals.reduce((s, d) => s + d.value, 0)
    const weightedTotal = activeDeals.reduce((s, d) => s + d.value * (d.probability / 100) * mult, 0)
    const committed     = activeDeals.filter(d => d.probability >= 70).reduce((s, d) => s + d.value * mult, 0)
    const atRisk        = activeDeals.filter(d => {
      try { return differenceInDays(parseISO(d.expectedCloseDate), new Date()) < 14 && d.probability < 50 }
      catch { return false }
    }).length
    const avgDealSize   = activeDeals.length ? totalPipeline / activeDeals.length : 0
    const wonRevenue    = closedWonDeals.reduce((s, d) => s + d.value, 0)
    const winRate       = deals?.length ? (closedWonDeals.length / deals.length) * 100 : 0

    return { totalPipeline, weightedTotal, committed, atRisk, avgDealSize, wonRevenue, winRate }
  }, [activeDeals, closedWonDeals, deals, scenario])

  // ── At-risk deals ────────────────────────────────────────────────────────
  const atRiskDeals = useMemo(() =>
    activeDeals
      .filter(d => {
        try { return differenceInDays(parseISO(d.expectedCloseDate), new Date()) < 30 && d.probability < 60 }
        catch { return false }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  , [activeDeals])

  // ── Top deals closing soon ────────────────────────────────────────────────
  const closingSoon = useMemo(() =>
    activeDeals
      .filter(d => {
        try {
          const days = differenceInDays(parseISO(d.expectedCloseDate), new Date())
          return days >= 0 && days <= 30
        } catch { return false }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  , [activeDeals])

  const filteredClosingSoon = stageFilter === 'all'
    ? closingSoon
    : closingSoon.filter(d => d.stage === stageFilter)

  const totalForecastWeighted = monthlyForecast.reduce((s, m) => s + m.weighted, 0)
  const scenarioCfg = SCENARIOS[scenario]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            Deal Forecasting
          </h1>
          <p className="text-muted-foreground mt-1">
            Revenue projections and pipeline analysis based on live deal data.
          </p>
        </div>
        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={scenario} onValueChange={v => setScenario(v as ScenarioKey)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SCENARIOS) as ScenarioKey[]).map(k => (
                <SelectItem key={k} value={k}>
                  <span className={SCENARIOS[k].color}>{SCENARIOS[k].label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={horizon} onValueChange={v => setHorizon(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scenario banner */}
      <div className={cn(
        'rounded-lg border px-4 py-3 flex items-center gap-3 text-sm',
        scenario === 'optimistic'  && 'border-green-500/20 bg-green-500/5',
        scenario === 'realistic'   && 'border-primary/20 bg-primary/5',
        scenario === 'pessimistic' && 'border-amber-500/20 bg-amber-500/5',
      )}>
        <Sparkles className={cn('h-4 w-4 shrink-0', scenarioCfg.color)} />
        <span>
          <span className={cn('font-semibold', scenarioCfg.color)}>{scenarioCfg.label} scenario</span>
          {' '}— deal values adjusted by <span className="font-medium">{scenarioCfg.multiplier > 1 ? '+' : ''}{Math.round((scenarioCfg.multiplier - 1) * 100)}%</span>.
          {' '}Forecast horizon: <span className="font-medium">{horizon} months</span>.
        </span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Total Pipeline',
            value: fmtMoney(kpis.totalPipeline, true),
            sub: `${activeDeals.length} active deals`,
            icon: <BarChart3 className="h-4 w-4" />,
            accent: '',
          },
          {
            label: 'Weighted Forecast',
            value: fmtMoney(kpis.weightedTotal, true),
            sub: `${horizon}-month total`,
            icon: <TrendingUp className="h-4 w-4" />,
            accent: 'text-primary',
          },
          {
            label: 'Committed Revenue',
            value: fmtMoney(kpis.committed, true),
            sub: '70%+ probability deals',
            icon: <CheckCircle2 className="h-4 w-4" />,
            accent: 'text-green-400',
          },
          {
            label: 'At Risk',
            value: kpis.atRisk,
            sub: 'closing <14 days, <50% prob',
            icon: <AlertTriangle className="h-4 w-4" />,
            accent: kpis.atRisk > 0 ? 'text-red-400' : 'text-muted-foreground',
          },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{k.label}</p>
                <span className="text-muted-foreground">{k.icon}</span>
              </div>
              <p className={cn('text-3xl font-bold', k.accent)}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Forecast area chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue Forecast — {horizon} Month View</CardTitle>
          <CardDescription>
            Weighted, best-case, and committed projections by expected close month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyForecast}>
              <defs>
                <linearGradient id="gWeighted"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CHART_COLORS.weighted}  stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.weighted}  stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gBestCase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CHART_COLORS.bestCase} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={CHART_COLORS.bestCase} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="month" stroke={CHART_COLORS.muted} fontSize={12} tickLine={false} />
              <YAxis stroke={CHART_COLORS.muted} fontSize={12} tickLine={false} tickFormatter={v => fmtMoney(v, true)} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [fmtMoney(v), '']} />
              <Legend />
              <Area type="monotone" dataKey="bestCase"  name="Best Case"  stroke={CHART_COLORS.bestCase}  strokeWidth={1} strokeDasharray="4 4" fill="url(#gBestCase)" />
              <Area type="monotone" dataKey="weighted"  name="Weighted"   stroke={CHART_COLORS.weighted}  strokeWidth={2} fill="url(#gWeighted)" />
              <Area type="monotone" dataKey="committed" name="Committed"  stroke={CHART_COLORS.committed} strokeWidth={2} fill="none" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pipeline by stage + closing soon */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Stage breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pipeline by Stage</CardTitle>
            <CardDescription>Weighted value using stage probability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stageBreakdown.map(s => (
              <div key={s.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="font-medium">{s.label}</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">{s.count}</Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{fmtMoney(s.weighted, true)}</span>
                    <span className="text-muted-foreground ml-1.5 text-xs">weighted</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={s.probability}
                    className="h-1.5 flex-1"
                    style={{ '--progress-background': s.color } as any}
                  />
                  <span className="text-xs text-muted-foreground w-10 text-right">{fmtMoney(s.totalValue, true)}</span>
                </div>
              </div>
            ))}

            <Separator />

            {/* Mini bar chart */}
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={stageBreakdown} barSize={28}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: CHART_COLORS.muted }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [fmtMoney(v), '']} />
                <Bar dataKey="weighted" name="Weighted" radius={[4, 4, 0, 0]}>
                  {stageBreakdown.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Win rate + avg deal size */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance Metrics</CardTitle>
            <CardDescription>Historical win rate and deal velocity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Win rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Win Rate</span>
                <span className="text-2xl font-bold text-green-400">{kpis.winRate.toFixed(1)}%</span>
              </div>
              <Progress value={kpis.winRate} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {closedWonDeals.length} won out of {(deals ?? []).length} total deals
              </p>
            </div>

            <Separator />

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Avg Deal Size',    value: fmtMoney(kpis.avgDealSize, true), icon: <DollarSign className="h-4 w-4 text-primary" /> },
                { label: 'Won Revenue',      value: fmtMoney(kpis.wonRevenue, true),  icon: <CheckCircle2 className="h-4 w-4 text-green-400" /> },
                { label: 'Active Deals',     value: activeDeals.length,               icon: <BarChart3 className="h-4 w-4 text-blue-400" /> },
                { label: 'Closing This Mo.', value: monthlyForecast[0]?.dealCount ?? 0, icon: <Calendar className="h-4 w-4 text-amber-400" /> },
              ].map(m => (
                <div key={m.label} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-2 mb-1">{m.icon}<span className="text-xs text-muted-foreground">{m.label}</span></div>
                  <p className="text-xl font-bold">{m.value}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Scenario comparison */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Scenario Comparison <span className="text-xs text-muted-foreground">({horizon} months)</span></p>
              {(Object.keys(SCENARIOS) as ScenarioKey[]).map(k => {
                const mult  = SCENARIOS[k].multiplier
                const value = activeDeals.reduce((s, d) => s + d.value * (d.probability / 100) * mult, 0)
                return (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className={cn('font-medium', SCENARIOS[k].color)}>{SCENARIOS[k].label}</span>
                    <span className="font-semibold">{fmtMoney(value, true)}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals closing soon */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base">Deals Closing in Next 30 Days</CardTitle>
              <CardDescription>{closingSoon.length} deals · {fmtMoney(closingSoon.reduce((s, d) => s + d.value, 0))} pipeline</CardDescription>
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {STAGE_ORDER.filter(s => !['closed-won','closed-lost'].includes(s)).map(s => (
                  <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Weighted</TableHead>
                <TableHead className="text-right">Prob.</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead>Days Left</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClosingSoon.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No deals closing in this period.
                  </TableCell>
                </TableRow>
              ) : filteredClosingSoon.map(deal => {
                let daysLeft = 0
                let closeDateStr = '—'
                try {
                  daysLeft = differenceInDays(parseISO(deal.expectedCloseDate), new Date())
                  closeDateStr = format(parseISO(deal.expectedCloseDate), 'MMM d, yyyy')
                } catch {}
                const weighted = Math.round(deal.value * (deal.probability / 100) * SCENARIOS[scenario].multiplier)
                const isUrgent = daysLeft <= 7
                const isAtRisk = daysLeft <= 14 && deal.probability < 50

                return (
                  <TableRow key={deal.id} className={cn(isAtRisk && 'bg-red-500/5')}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">{deal.contact?.company ?? ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `${STAGE_COLORS[deal.stage]}20`, color: STAGE_COLORS[deal.stage] }}
                      >
                        {STAGE_LABELS[deal.stage]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{fmtMoney(deal.value, true)}</TableCell>
                    <TableCell className="text-right text-primary font-medium">{fmtMoney(weighted, true)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Progress value={deal.probability} className="h-1.5 w-14" />
                        <span className="text-xs w-8 text-right">{deal.probability}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{closeDateStr}</TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
                        isUrgent ? 'bg-red-500/10 text-red-400'
                          : daysLeft <= 14 ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {isUrgent && <AlertTriangle className="h-3 w-3" />}
                        {daysLeft}d
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* At-risk deals */}
      {atRiskDeals.length > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" /> At-Risk Deals
            </CardTitle>
            <CardDescription>Closing within 30 days with below 60% probability — need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {atRiskDeals.map(deal => {
                let daysLeft = 0
                try { daysLeft = differenceInDays(parseISO(deal.expectedCloseDate), new Date()) } catch {}
                return (
                  <div key={deal.id} className="rounded-lg border border-red-500/20 bg-background p-3 space-y-1.5">
                    <p className="font-medium text-sm line-clamp-1">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">{deal.contact?.company ?? ''}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{fmtMoney(deal.value, true)}</span>
                      <span className="text-xs text-red-400 font-medium">{daysLeft}d · {deal.probability}%</span>
                    </div>
                    <Progress value={deal.probability} className="h-1" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// tiny Separator component inline (avoid import issues)
function Separator() {
  return <div className="h-px bg-border/60 w-full" />
}