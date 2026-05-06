'use client'

import { useState, useMemo, useCallback } from 'react'
import { useCRM } from '@/lib/crm-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Table2,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Play,
  Download,
  Star,
  StarOff,
  ChevronRight,
  ChevronLeft,
  X,
  GripVertical,
  Filter,
  SortAsc,
  SortDesc,
  Layers,
  RefreshCw,
  FileBarChart,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportModule = 'deals' | 'leads' | 'contacts' | 'tickets' | 'tasks'
type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'table'
type AggregateFunc = 'count' | 'sum' | 'avg' | 'min' | 'max'
type SortOrder = 'asc' | 'desc'
type FilterOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'

interface ReportField {
  key: string
  label: string
  type: 'string' | 'number' | 'date' | 'enum'
}

interface ReportMetric {
  id: string
  field: string
  aggregate: AggregateFunc
  label: string
}

interface ReportFilter {
  id: string
  field: string
  operator: FilterOperator
  value: string
}

interface ReportSort {
  field: string
  order: SortOrder
}

interface Report {
  id: string
  name: string
  description: string
  module: ReportModule
  chartType: ChartType
  groupByField: string
  metrics: ReportMetric[]
  filters: ReportFilter[]
  sort: ReportSort | null
  limit: number
  starred: boolean
  lastRunAt?: string
  createdAt: string
}

// ─── Module field definitions ─────────────────────────────────────────────────
const MODULE_FIELDS: Record<ReportModule, ReportField[]> = {
  deals: [
    { key: 'stage', label: 'Stage', type: 'enum' },
    { key: 'value', label: 'Value ($)', type: 'number' },
    { key: 'probability', label: 'Probability (%)', type: 'number' },
    { key: 'contact.company', label: 'Company', type: 'string' },
    { key: 'createdAt', label: 'Created date', type: 'date' },
    { key: 'expectedCloseDate', label: 'Close date', type: 'date' },
  ],
  leads: [
    { key: 'status', label: 'Status', type: 'enum' },
    { key: 'source', label: 'Source', type: 'enum' },
    { key: 'score', label: 'Score', type: 'number' },
    { key: 'company', label: 'Company', type: 'string' },
    { key: 'createdAt', label: 'Created date', type: 'date' },
  ],
  contacts: [
    { key: 'company', label: 'Company', type: 'string' },
    { key: 'status', label: 'Status', type: 'enum' },
    { key: 'createdAt', label: 'Created date', type: 'date' },
  ],
  tickets: [
    { key: 'status', label: 'Status', type: 'enum' },
    { key: 'priority', label: 'Priority', type: 'enum' },
    { key: 'category', label: 'Category', type: 'enum' },
    { key: 'createdAt', label: 'Created date', type: 'date' },
  ],
  tasks: [
    { key: 'status', label: 'Status', type: 'enum' },
    { key: 'priority', label: 'Priority', type: 'enum' },
    { key: 'dueDate', label: 'Due date', type: 'date' },
  ],
}

const MODULE_LABELS: Record<ReportModule, string> = {
  deals: 'Deals', leads: 'Leads', contacts: 'Contacts', tickets: 'Tickets', tasks: 'Tasks',
}

const CHART_COLORS = ['#6366f1', '#22d3ee', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#ec4899']

const CHART_BG = '#1f2937'
const CHART_BORDER = '#374151'
const CHART_MUTED = '#9ca3af'
const CHART_FG = '#f3f4f6'

// ─── Seed reports ─────────────────────────────────────────────────────────────
const SEED_REPORTS: Report[] = [
  {
    id: 'r-1',
    name: 'Pipeline by Stage',
    description: 'Deal count and total value grouped by pipeline stage.',
    module: 'deals',
    chartType: 'bar',
    groupByField: 'stage',
    metrics: [
      { id: 'm1', field: 'value', aggregate: 'sum', label: 'Total Value' },
      { id: 'm2', field: 'value', aggregate: 'count', label: 'Deal Count' },
    ],
    filters: [],
    sort: { field: 'value', order: 'desc' },
    limit: 10,
    starred: true,
    lastRunAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'r-2',
    name: 'Lead Sources Breakdown',
    description: 'Number of leads by acquisition source.',
    module: 'leads',
    chartType: 'pie',
    groupByField: 'source',
    metrics: [{ id: 'm1', field: 'score', aggregate: 'count', label: 'Lead Count' }],
    filters: [],
    sort: null,
    limit: 10,
    starred: true,
    lastRunAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'r-3',
    name: 'Ticket Priority Analysis',
    description: 'Ticket volume broken down by priority level.',
    module: 'tickets',
    chartType: 'bar',
    groupByField: 'priority',
    metrics: [{ id: 'm1', field: 'priority', aggregate: 'count', label: 'Ticket Count' }],
    filters: [{ id: 'f1', field: 'status', operator: 'not_equals', value: 'closed' }],
    sort: null,
    limit: 10,
    starred: false,
    lastRunAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'r-4',
    name: 'Average Deal Probability by Stage',
    description: 'Win probability trend across deal stages.',
    module: 'deals',
    chartType: 'line',
    groupByField: 'stage',
    metrics: [{ id: 'm1', field: 'probability', aggregate: 'avg', label: 'Avg Probability' }],
    filters: [],
    sort: null,
    limit: 10,
    starred: false,
    lastRunAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'r-5',
    name: 'Lead Qualification Rate',
    description: 'Lead counts by status — shows conversion funnel.',
    module: 'leads',
    chartType: 'area',
    groupByField: 'status',
    metrics: [{ id: 'm1', field: 'score', aggregate: 'count', label: 'Count' }],
    filters: [],
    sort: { field: 'count', order: 'desc' },
    limit: 10,
    starred: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ─── Data engine: runs a report against live CRM data ─────────────────────────
function runReport(report: Report, crmData: Record<string, any[]>): Record<string, any>[] {
  const raw: any[] = crmData[report.module] ?? []

  // Apply filters
  let filtered = raw.filter(row => {
    return report.filters.every(f => {
      const val = String(getNestedValue(row, f.field) ?? '').toLowerCase()
      const fv = f.value.toLowerCase()
      switch (f.operator) {
        case 'equals': return val === fv
        case 'not_equals': return val !== fv
        case 'contains': return val.includes(fv)
        case 'greater_than': return parseFloat(val) > parseFloat(fv)
        case 'less_than': return parseFloat(val) < parseFloat(fv)
        default: return true
      }
    })
  })

  // Group by
  const groups = new Map<string, any[]>()
  filtered.forEach(row => {
    const key = String(getNestedValue(row, report.groupByField) ?? 'Unknown')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  })

  // Aggregate metrics per group
  let result: Record<string, any>[] = Array.from(groups.entries()).map(([groupKey, rows]) => {
    const entry: Record<string, any> = { _group: groupKey }
    report.metrics.forEach(metric => {
      const nums = rows.map(r => parseFloat(getNestedValue(r, metric.field) ?? '0')).filter(n => !isNaN(n))
      switch (metric.aggregate) {
        case 'count': entry[metric.label] = rows.length; break
        case 'sum': entry[metric.label] = Math.round(nums.reduce((a, b) => a + b, 0)); break
        case 'avg': entry[metric.label] = nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0; break
        case 'min': entry[metric.label] = nums.length ? Math.round(Math.min(...nums)) : 0; break
        case 'max': entry[metric.label] = nums.length ? Math.round(Math.max(...nums)) : 0; break
      }
    })
    return entry
  })

  // Sort
  if (report.sort) {
    const sortKey = report.metrics.find(m => m.field === report.sort!.field)?.label ?? report.sort.field
    result.sort((a, b) => {
      const av = a[sortKey] ?? a._group
      const bv = b[sortKey] ?? b._group
      return report.sort!.order === 'asc'
        ? String(av).localeCompare(String(bv), undefined, { numeric: true })
        : String(bv).localeCompare(String(av), undefined, { numeric: true })
    })
  }

  return result.slice(0, report.limit)
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

// ─── Chart rendering ──────────────────────────────────────────────────────────
function ReportChart({ data, report }: { data: Record<string, any>[]; report: Report }) {
  const metricKeys = report.metrics.map(m => m.label)
  const tooltipStyle = {
    contentStyle: { backgroundColor: CHART_BG, border: `1px solid ${CHART_BORDER}`, borderRadius: '8px', color: CHART_FG },
    labelStyle: { color: CHART_FG },
    itemStyle: { color: CHART_FG },
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <FileBarChart className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No data matches the current filters</p>
      </div>
    )
  }

  if (report.chartType === 'table') {
    return (
      <div className="overflow-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{MODULE_FIELDS[report.module].find(f => f.key === report.groupByField)?.label ?? 'Group'}</TableHead>
              {metricKeys.map(k => <TableHead key={k} className="text-right">{k}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium capitalize">{String(row._group).replace(/_|-/g, ' ')}</TableCell>
                {metricKeys.map(k => (
                  <TableCell key={k} className="text-right">
                    {typeof row[k] === 'number' ? row[k].toLocaleString() : row[k]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  const formatted = data.map(d => ({
    ...d,
    name: String(d._group).replace(/_|-/g, ' '),
  }))

  if (report.chartType === 'pie' && metricKeys.length > 0) {
    const key = metricKeys[0]
    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={formatted} dataKey={key} nameKey="name" cx="50%" cy="50%" outerRadius={110} paddingAngle={3} label={({ name, percent }) => `${name} (${Math.round(percent * 100)}%)`} labelLine={false}>
            {formatted.map((_, idx) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (report.chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_BORDER} />
          <XAxis dataKey="name" stroke={CHART_MUTED} fontSize={12} tickLine={false} />
          <YAxis stroke={CHART_MUTED} fontSize={12} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Legend />
          {metricKeys.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i]} strokeWidth={2} dot={{ r: 4 }} />)}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (report.chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={formatted}>
          <defs>
            {metricKeys.map((k, i) => (
              <linearGradient key={k} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS[i]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_BORDER} />
          <XAxis dataKey="name" stroke={CHART_MUTED} fontSize={12} tickLine={false} />
          <YAxis stroke={CHART_MUTED} fontSize={12} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Legend />
          {metricKeys.map((k, i) => (
            <Area key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i]} strokeWidth={2} fill={`url(#grad-${i})`} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  // Default: bar
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_BORDER} />
        <XAxis dataKey="name" stroke={CHART_MUTED} fontSize={12} tickLine={false} />
        <YAxis stroke={CHART_MUTED} fontSize={12} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Legend />
        {metricKeys.map((k, i) => <Bar key={k} dataKey={k} fill={CHART_COLORS[i]} radius={[4, 4, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Report Builder Dialog ─────────────────────────────────────────────────────
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2)}` }

function newMetric(): ReportMetric {
  return { id: uid(), field: 'value', aggregate: 'count', label: 'Count' }
}
function newFilter(): ReportFilter {
  return { id: uid(), field: 'status', operator: 'equals', value: '' }
}

interface BuilderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: Report | null
  onSave: (report: Omit<Report, 'id' | 'starred' | 'createdAt'>) => void
}

const CHART_TYPE_OPTIONS: { type: ChartType; label: string; icon: React.ReactNode }[] = [
  { type: 'bar', label: 'Bar', icon: <BarChart3 className="h-4 w-4" /> },
  { type: 'line', label: 'Line', icon: <LineIcon className="h-4 w-4" /> },
  { type: 'area', label: 'Area', icon: <TrendingUp className="h-4 w-4" /> },
  { type: 'pie', label: 'Pie', icon: <PieIcon className="h-4 w-4" /> },
  { type: 'table', label: 'Table', icon: <Table2 className="h-4 w-4" /> },
]

function BuilderDialog({ open, onOpenChange, editing, onSave }: BuilderDialogProps) {
  const [step, setStep] = useState<'data' | 'visualize' | 'filters'>('data')
  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [module, setModule] = useState<ReportModule>(editing?.module ?? 'deals')
  const [chartType, setChartType] = useState<ChartType>(editing?.chartType ?? 'bar')
  const [groupBy, setGroupBy] = useState(editing?.groupByField ?? '')
  const [metrics, setMetrics] = useState<ReportMetric[]>(editing?.metrics ?? [newMetric()])
  const [filters, setFilters] = useState<ReportFilter[]>(editing?.filters ?? [])
  const [sortField, setSortField] = useState(editing?.sort?.field ?? 'none')
  const [sortOrder, setSortOrder] = useState<SortOrder>(editing?.sort?.order ?? 'desc')
  const [limit, setLimit] = useState(String(editing?.limit ?? 10))

  const fields = MODULE_FIELDS[module]

  const reset = useCallback(() => {
    setStep('data')
    setName(editing?.name ?? '')
    setDescription(editing?.description ?? '')
    setModule(editing?.module ?? 'deals')
    setChartType(editing?.chartType ?? 'bar')
    setGroupBy(editing?.groupByField ?? fields[0]?.key ?? '')
    setMetrics(editing?.metrics ?? [newMetric()])
    setFilters(editing?.filters ?? [])
    setSortField(editing?.sort?.field ?? '')
    setSortOrder(editing?.sort?.order ?? 'desc')
    setLimit(String(editing?.limit ?? 10))
  }, [editing, fields])

  const handleOpen = (o: boolean) => { if (o) reset(); onOpenChange(o) }

  const handleModuleChange = (m: ReportModule) => {
    setModule(m)
    const newFields = MODULE_FIELDS[m]
    setGroupBy(newFields[0]?.key ?? '')
    setMetrics([newMetric()])
    setFilters([])
  }

  const updateMetric = (idx: number, patch: Partial<ReportMetric>) =>
    setMetrics(prev => prev.map((m, i) => i === idx ? { ...m, ...patch } : m))

  const updateFilter = (idx: number, patch: Partial<ReportFilter>) =>
    setFilters(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f))

  const handleSave = () => {
    if (!name.trim()) { toast.error('Report name is required'); return }
    if (metrics.length === 0) { toast.error('Add at least one metric'); return }
    if (!groupBy) { toast.error('Select a group-by field'); return }
    onSave({
      name, description, module, chartType,
      groupByField: groupBy,
      metrics, filters,
      sort: sortField && sortField !== 'none' ? { field: sortField, order: sortOrder } : null,
      limit: parseInt(limit) || 10,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Report' : 'Build a Report'}</DialogTitle>
          <DialogDescription>Configure data source, metrics, and visualisation.</DialogDescription>
        </DialogHeader>

        {/* Step tabs */}
        <div className="flex items-center gap-1 mb-2">
          {(['data', 'visualize', 'filters'] as const).map((s, idx) => (
            <div key={s} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStep(s)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  step === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <span>{idx + 1}.</span> {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
              {idx < 2 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* ── Step 1: Data ── */}
        {step === 'data' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 grid gap-2">
                <Label>Report name</Label>
                <Input placeholder="e.g. Pipeline by Stage" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="col-span-2 grid gap-2">
                <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input placeholder="What does this report show?" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Module</Label>
                <Select value={module} onValueChange={v => handleModuleChange(v as ReportModule)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(MODULE_LABELS) as ReportModule[]).map(m => (
                      <SelectItem key={m} value={m}>{MODULE_LABELS[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Group by</Label>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                  <SelectContent>
                    {fields.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Metrics</Label>
                <Button variant="outline" size="sm" onClick={() => setMetrics(prev => [...prev, newMetric()])}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add metric
                </Button>
              </div>
              {metrics.map((m, idx) => (
                <div key={m.id} className="flex gap-2 items-end rounded-lg border border-border/60 p-3">
                  <div className="grid gap-1.5 flex-1">
                    <Label className="text-xs">Field</Label>
                    <Select value={m.field} onValueChange={v => updateMetric(idx, { field: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {fields.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5 w-32">
                    <Label className="text-xs">Aggregate</Label>
                    <Select value={m.aggregate} onValueChange={v => updateMetric(idx, { aggregate: v as AggregateFunc })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(['count','sum','avg','min','max'] as AggregateFunc[]).map(a => (
                          <SelectItem key={a} value={a}>{a.toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5 flex-1">
                    <Label className="text-xs">Display label</Label>
                    <Input value={m.label} onChange={e => updateMetric(idx, { label: e.target.value })} placeholder="Label" />
                  </div>
                  <Button
                    variant="ghost" size="icon-sm"
                    onClick={() => setMetrics(prev => prev.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-destructive mb-0.5"
                    disabled={metrics.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep('visualize')}>Next: Visualize <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Visualize ── */}
        {step === 'visualize' && (
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>Chart type</Label>
              <div className="grid grid-cols-5 gap-2">
                {CHART_TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setChartType(opt.type)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border p-3 text-xs font-medium transition-colors',
                      chartType === opt.type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                    )}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Sort by</Label>
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger><SelectValue placeholder="No sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No sort</SelectItem>
                    {metrics.map(m => <SelectItem key={m.id} value={m.field}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Sort order</Label>
                <Select value={sortOrder} onValueChange={v => setSortOrder(v as SortOrder)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending (highest first)</SelectItem>
                    <SelectItem value="asc">Ascending (lowest first)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Max rows / groups</Label>
                <Input type="number" min={1} max={50} value={limit} onChange={e => setLimit(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('data')}><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep('filters')}>Next: Filters <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Filters ── */}
        {step === 'filters' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Optional. Only rows matching all filters will be included in the report.</p>

            {filters.map((f, idx) => (
              <div key={f.id} className="flex gap-2 items-end rounded-lg border border-border/60 p-3">
                <div className="grid gap-1.5 flex-1">
                  <Label className="text-xs">Field</Label>
                  <Select value={f.field} onValueChange={v => updateFilter(idx, { field: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {fields.map(ff => <SelectItem key={ff.key} value={ff.key}>{ff.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5 w-36">
                  <Label className="text-xs">Operator</Label>
                  <Select value={f.operator} onValueChange={v => updateFilter(idx, { operator: v as FilterOperator })}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['equals','not_equals','contains','greater_than','less_than'] as FilterOperator[]).map(op => (
                        <SelectItem key={op} value={op}>{op.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5 flex-1">
                  <Label className="text-xs">Value</Label>
                  <Input placeholder="Filter value" value={f.value} onChange={e => updateFilter(idx, { value: e.target.value })} />
                </div>
                <Button
                  variant="ghost" size="icon-sm"
                  onClick={() => setFilters(prev => prev.filter((_, i) => i !== idx))}
                  className="text-muted-foreground hover:text-destructive mb-0.5"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={() => setFilters(prev => [...prev, newFilter()])}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add filter
            </Button>

            <div className="flex justify-between pt-1">
              <Button variant="outline" onClick={() => setStep('visualize')}><ChevronLeft className="mr-1 h-4 w-4" /> Back</Button>
              <Button onClick={handleSave}>{editing ? 'Save changes' : 'Create report'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Report Viewer Card ────────────────────────────────────────────────────────
function ReportViewerCard({
  report,
  data,
  onEdit,
  onDelete,
  onStar,
  onDuplicate,
}: {
  report: Report
  data: Record<string, any>[]
  onEdit: () => void
  onDelete: () => void
  onStar: () => void
  onDuplicate: () => void
}) {
  const chartIcon = {
    bar: <BarChart3 className="h-4 w-4" />,
    line: <LineIcon className="h-4 w-4" />,
    area: <TrendingUp className="h-4 w-4" />,
    pie: <PieIcon className="h-4 w-4" />,
    table: <Table2 className="h-4 w-4" />,
  }[report.chartType]

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-muted-foreground">{chartIcon}</span>
              <Badge variant="outline" className="text-xs capitalize">{report.module}</Badge>
              {report.starred && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
            </div>
            <CardTitle className="text-base truncate">{report.name}</CardTitle>
            {report.description && (
              <CardDescription className="text-xs mt-0.5 line-clamp-1">{report.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit report</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={onStar}>
                {report.starred
                  ? <><StarOff className="mr-2 h-4 w-4" /> Unstar</>
                  : <><Star className="mr-2 h-4 w-4" /> Star</>}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <ReportChart data={data} report={report} />
      </CardContent>
      {report.lastRunAt && (
        <div className="px-5 pb-4 text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Last run {formatDistanceToNow(new Date(report.lastRunAt), { addSuffix: true })}
        </div>
      )}
    </Card>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function ReportsView() {
  const { deals, contacts, leads, tickets, tasks } = useCRM()
  const [reports, setReports] = useState<Report[]>(SEED_REPORTS)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [tab, setTab] = useState<'all' | 'starred'>('all')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<Report | null>(null)

  const crmData = useMemo(() => ({
    deals: deals ?? [],
    contacts: contacts ?? [],
    leads: leads ?? [],
    tickets: tickets ?? [],
    tasks: tasks ?? [],
  }), [deals, contacts, leads, tickets, tasks])

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
      const matchModule = moduleFilter === 'all' || r.module === moduleFilter
      const matchTab = tab === 'all' || r.starred
      return matchSearch && matchModule && matchTab
    })
  }, [reports, search, moduleFilter, tab])

  const reportData = useMemo(() => {
    const map: Record<string, Record<string, any>[]> = {}
    filteredReports.forEach(r => { map[r.id] = runReport(r, crmData) })
    return map
  }, [filteredReports, crmData])

  const handleSave = useCallback((payload: Omit<Report, 'id' | 'starred' | 'createdAt'>) => {
    if (editingReport) {
      setReports(prev => prev.map(r => r.id === editingReport.id
        ? { ...r, ...payload, lastRunAt: new Date().toISOString() }
        : r))
      toast.success('Report updated')
    } else {
      const newReport: Report = {
        ...payload,
        id: `r-${Date.now()}`,
        starred: false,
        lastRunAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
      setReports(prev => [newReport, ...prev])
      toast.success('Report created')
    }
    setEditingReport(null)
  }, [editingReport])

  const handleEdit = (r: Report) => { setEditingReport(r); setBuilderOpen(true) }
  const handleDelete = (id: string) => { setReports(prev => prev.filter(r => r.id !== id)); toast.success('Report deleted') }
  const handleStar = (id: string) => setReports(prev => prev.map(r => r.id === id ? { ...r, starred: !r.starred } : r))
  const handleDuplicate = (r: Report) => {
    const copy: Report = { ...r, id: `r-${Date.now()}`, name: `${r.name} (copy)`, starred: false, createdAt: new Date().toISOString() }
    setReports(prev => [copy, ...prev])
    toast.success('Report duplicated')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileBarChart className="h-7 w-7 text-primary" />
            Custom Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Build, save and visualise reports from any CRM module.
          </p>
        </div>
        <Button onClick={() => { setEditingReport(null); setBuilderOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> New Report
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Total Reports</p>
          <p className="text-3xl font-bold mt-1">{reports.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Starred</p>
          <p className="text-3xl font-bold mt-1 text-yellow-500">{reports.filter(r => r.starred).length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Modules covered</p>
          <p className="text-3xl font-bold mt-1 text-primary">{new Set(reports.map(r => r.module)).size}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Chart types used</p>
          <p className="text-3xl font-bold mt-1">{new Set(reports.map(r => r.chartType)).size}</p>
        </CardContent></Card>
      </div>

      {/* Tabs + filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All reports <Badge variant="secondary" className="ml-1.5">{reports.length}</Badge></TabsTrigger>
            <TabsTrigger value="starred">
              <Star className="mr-1.5 h-3.5 w-3.5" /> Starred
              <Badge variant="secondary" className="ml-1.5">{reports.filter(r => r.starred).length}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-52" />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All modules" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {(Object.keys(MODULE_LABELS) as ReportModule[]).map(m => (
                <SelectItem key={m} value={m}>{MODULE_LABELS[m]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report grid */}
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileBarChart className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No reports found</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {search || moduleFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first report to get started.'}
          </p>
          {!search && moduleFilter === 'all' && (
            <Button onClick={() => { setEditingReport(null); setBuilderOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" /> Create Report
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredReports.map(report => (
            <ReportViewerCard
              key={report.id}
              report={report}
              data={reportData[report.id] ?? []}
              onEdit={() => handleEdit(report)}
              onDelete={() => handleDelete(report.id)}
              onStar={() => handleStar(report.id)}
              onDuplicate={() => handleDuplicate(report)}
            />
          ))}
        </div>
      )}

      {/* Builder dialog */}
      <BuilderDialog
        open={builderOpen}
        onOpenChange={o => { setBuilderOpen(o); if (!o) setEditingReport(null) }}
        editing={editingReport}
        onSave={handleSave}
      />
    </div>
  )
}