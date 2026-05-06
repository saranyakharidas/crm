'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAccounts, type Account, type AccountIndustry, type AccountType } from '@/lib/accounts-context'
import { useCRM } from '@/lib/crm-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
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
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  DollarSign,
  TrendingUp,
  Kanban,
  Filter,
  List,
  Grid3X3,
  ExternalLink,
  Tag,
  ChevronRight,
  X,
  Download,
  Star,
  ArrowUpRight,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

// ─── Config maps ──────────────────────────────────────────────────────────────
const INDUSTRY_LABELS: Record<AccountIndustry, string> = {
  technology: 'Technology',
  finance: 'Finance',
  healthcare: 'Healthcare',
  retail: 'Retail',
  manufacturing: 'Manufacturing',
  education: 'Education',
  real_estate: 'Real Estate',
  consulting: 'Consulting',
  media: 'Media',
  other: 'Other',
}

const TYPE_CONFIG: Record<AccountType, { label: string; className: string }> = {
  prospect:  { label: 'Prospect',  className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  customer:  { label: 'Customer',  className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  partner:   { label: 'Partner',   className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  vendor:    { label: 'Vendor',    className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  churned:   { label: 'Churned',   className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
}

const INDUSTRY_COLORS: Record<AccountIndustry, string> = {
  technology:    'bg-indigo-500/10 text-indigo-400',
  finance:       'bg-emerald-500/10 text-emerald-400',
  healthcare:    'bg-rose-500/10 text-rose-400',
  retail:        'bg-amber-500/10 text-amber-400',
  manufacturing: 'bg-cyan-500/10 text-cyan-400',
  education:     'bg-violet-500/10 text-violet-400',
  real_estate:   'bg-teal-500/10 text-teal-400',
  consulting:    'bg-sky-500/10 text-sky-400',
  media:         'bg-pink-500/10 text-pink-400',
  other:         'bg-slate-500/10 text-slate-400',
}

function formatRevenue(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// Avatar colour deterministically from account id
const AVATAR_COLORS = [
  'bg-indigo-500/20 text-indigo-400',
  'bg-emerald-500/20 text-emerald-400',
  'bg-amber-500/20 text-amber-400',
  'bg-rose-500/20 text-rose-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-violet-500/20 text-violet-400',
]
function avatarColor(id: string): string {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

// ─── Add / Edit Dialog ─────────────────────────────────────────────────────────
interface AccountFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing?: Account | null
}

const BLANK_FORM = {
  name: '', domain: '', industry: 'technology' as AccountIndustry, type: 'prospect' as AccountType,
  employees: '', annualRevenue: '', phone: '', email: '', website: '', description: '',
  street: '', city: '', state: '', country: 'USA', tags: '', ownedBy: '',
}

function AccountFormDialog({ open, onOpenChange, editing }: AccountFormProps) {
  const { addAccount, updateAccount } = useAccounts()
  const [form, setForm] = useState({ ...BLANK_FORM })

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    if (open && editing) {
      setForm({
        name: editing.name, domain: editing.domain, industry: editing.industry,
        type: editing.type, employees: String(editing.employees),
        annualRevenue: String(editing.annualRevenue), phone: editing.phone,
        email: editing.email, website: editing.website, description: editing.description,
        street: editing.address.street, city: editing.address.city,
        state: editing.address.state, country: editing.address.country,
        tags: editing.tags.join(', '), ownedBy: editing.ownedBy,
      })
    } else if (open) {
      setForm({ ...BLANK_FORM })
    }
  }, [open, editing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Account name is required'); return }

    const payload = {
      name: form.name.trim(),
      domain: form.domain.trim(),
      industry: form.industry,
      type: form.type,
      employees: parseInt(form.employees) || 0,
      annualRevenue: parseFloat(form.annualRevenue) || 0,
      phone: form.phone.trim(),
      email: form.email.trim(),
      website: form.website.trim(),
      description: form.description.trim(),
      address: { street: form.street, city: form.city, state: form.state, country: form.country },
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      contactIds: editing?.contactIds ?? [],
      dealIds: editing?.dealIds ?? [],
      ownedBy: form.ownedBy.trim() || 'Unassigned',
    }

    if (editing) {
      updateAccount(editing.id, payload)
    } else {
      addAccount(payload)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Account' : 'Add Account'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Update this company record.' : 'Create a new company account in your CRM.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Core info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid gap-2">
              <Label>Company name *</Label>
              <Input placeholder="Acme Corporation" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Domain</Label>
              <Input placeholder="acme.com" value={form.domain} onChange={e => set('domain', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Website</Label>
              <Input placeholder="https://acme.com" value={form.website} onChange={e => set('website', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={v => set('industry', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(INDUSTRY_LABELS) as AccountIndustry[]).map(i => (
                    <SelectItem key={i} value={i}>{INDUSTRY_LABELS[i]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Account type</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_CONFIG) as AccountType[]).map(t => (
                    <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Employees</Label>
              <Input type="number" min={0} placeholder="500" value={form.employees} onChange={e => set('employees', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Annual revenue ($)</Label>
              <Input type="number" min={0} placeholder="5000000" value={form.annualRevenue} onChange={e => set('annualRevenue', e.target.value)} />
            </div>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" placeholder="hello@acme.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
          </div>

          {/* Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid gap-2">
              <Label>Street address</Label>
              <Input placeholder="100 Main St" value={form.street} onChange={e => set('street', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>City</Label>
              <Input placeholder="San Francisco" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>State</Label>
              <Input placeholder="CA" value={form.state} onChange={e => set('state', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Country</Label>
              <Input placeholder="USA" value={form.country} onChange={e => set('country', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Account owner</Label>
              <Input placeholder="e.g. Sarah Johnson" value={form.ownedBy} onChange={e => set('ownedBy', e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tags <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
            <Input placeholder="Enterprise, Key Account, Strategic" value={form.tags} onChange={e => set('tags', e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea placeholder="Brief description of this company..." value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Create account'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Detail side panel ────────────────────────────────────────────────────────
function AccountDetailSheet({
  account,
  open,
  onOpenChange,
  onEdit,
}: {
  account: Account | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (a: Account) => void
}) {
  const { contacts, deals } = useCRM()

  if (!account) return null

  // Related contacts & deals derived from company name match (since contactIds may be empty in seed)
  const relatedContacts = contacts.filter(c =>
    c.company?.toLowerCase() === account.name.toLowerCase() ||
    account.contactIds.includes(c.id)
  ).slice(0, 6)

  const relatedDeals = deals.filter(d =>
    d.contact?.company?.toLowerCase() === account.name.toLowerCase() ||
    account.dealIds.includes(d.id)
  ).slice(0, 5)

  const totalDealValue = relatedDeals.reduce((sum, d) => sum + d.value, 0)
  const wonDeals = relatedDeals.filter(d => d.stage === 'closed-won').length

  const typeConf = TYPE_CONFIG[account.type]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{account.name}</SheetTitle>
          <SheetDescription>Account details for {account.name}</SheetDescription>
        </SheetHeader>

        {/* Header */}
        <div className="border-b border-border p-6">
          <div className="flex items-start gap-4">
            <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold', avatarColor(account.id))}>
              {getInitials(account.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold leading-tight">{account.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{account.domain}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onEdit(account) }}>
                  <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', typeConf.className)}>
                  {typeConf.label}
                </span>
                <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', INDUSTRY_COLORS[account.industry])}>
                  {INDUSTRY_LABELS[account.industry]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 border-b border-border">
          {[
            { label: 'Employees', value: account.employees.toLocaleString(), icon: <Users className="h-4 w-4" /> },
            { label: 'Annual Rev.', value: formatRevenue(account.annualRevenue), icon: <DollarSign className="h-4 w-4" /> },
            { label: 'Open Deals', value: relatedDeals.filter(d => !['closed-won','closed-lost'].includes(d.stage)).length, icon: <Kanban className="h-4 w-4" /> },
          ].map(kpi => (
            <div key={kpi.label} className="flex flex-col items-center justify-center gap-1 py-4 border-r last:border-r-0 border-border text-center">
              <span className="text-muted-foreground">{kpi.icon}</span>
              <span className="text-lg font-bold">{kpi.value}</span>
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {/* Contact info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact Info</h3>
            <div className="space-y-2">
              {account.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{account.phone}</span>
                </div>
              )}
              {account.email && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{account.email}</span>
                </div>
              )}
              {account.website && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={account.website} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                    {account.website.replace(/^https?:\/\//, '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {account.address.city && (
                <div className="flex items-center gap-2.5 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{[account.address.city, account.address.state, account.address.country].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {account.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{account.description}</p>
            </div>
          )}

          {/* Tags */}
          {account.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {account.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Related deals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Deals</h3>
              {relatedDeals.length > 0 && (
                <span className="text-xs text-muted-foreground">{formatRevenue(totalDealValue)} total · {wonDeals} won</span>
              )}
            </div>
            {relatedDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deals linked yet.</p>
            ) : (
              <div className="space-y-2">
                {relatedDeals.map(deal => (
                  <div key={deal.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{deal.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{deal.stage.replace(/-/g, ' ')}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold">${deal.value.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{deal.probability}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Related contacts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contacts</h3>
              <span className="text-xs text-muted-foreground">{relatedContacts.length} people</span>
            </div>
            {relatedContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No contacts linked yet.</p>
            ) : (
              <div className="space-y-2">
                {relatedContacts.map(contact => (
                  <div key={contact.id} className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {contact.firstName?.[0]}{contact.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.position}</p>
                    </div>
                    <div className="shrink-0">
                      <Badge variant="secondary" className={cn('text-xs', contact.status === 'active' ? '' : 'opacity-60')}>
                        {contact.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground space-y-1">
            <p>Owner: <span className="text-foreground">{account.ownedBy}</span></p>
            <p>Created {formatDistanceToNow(new Date(account.createdAt), { addSuffix: true })}</p>
            <p>Updated {formatDistanceToNow(new Date(account.updatedAt), { addSuffix: true })}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Account Grid Card ────────────────────────────────────────────────────────
function AccountCard({ account, onView, onEdit, onDelete }: {
  account: Account
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const typeConf = TYPE_CONFIG[account.type]

  return (
    <Card
      className="group hover:border-border/80 transition-colors cursor-pointer"
      onClick={onView}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold', avatarColor(account.id))}>
              {getInitials(account.name)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{account.name}</p>
              <p className="text-xs text-muted-foreground truncate">{account.domain}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onView() }}><Edit className="mr-2 h-4 w-4" /> View details</DropdownMenuItem>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit() }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={e => { e.stopPropagation(); onDelete() }}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium', typeConf.className)}>
            {typeConf.label}
          </span>
          <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium', INDUSTRY_COLORS[account.industry])}>
            {INDUSTRY_LABELS[account.industry]}
          </span>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span>{account.employees.toLocaleString()} employees</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span>{formatRevenue(account.annualRevenue)} annual revenue</span>
          </div>
          {account.address.city && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{account.address.city}, {account.address.state}</span>
            </div>
          )}
        </div>

        {account.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {account.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">{tag}</Badge>
            ))}
            {account.tags.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">+{account.tags.length - 3}</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function AccountsView() {
  const { accounts, deleteAccount, isLoading, error, refreshAccounts } = useAccounts()
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [formOpen, setFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [detailAccount, setDetailAccount] = useState<Account | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filtered = useMemo(() => {
    return accounts.filter(a => {
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.domain.toLowerCase().includes(search.toLowerCase()) ||
        a.address.city.toLowerCase().includes(search.toLowerCase())
      const matchIndustry = industryFilter === 'all' || a.industry === industryFilter
      const matchType = typeFilter === 'all' || a.type === typeFilter
      return matchSearch && matchIndustry && matchType
    })
  }, [accounts, search, industryFilter, typeFilter])

  const stats = useMemo(() => ({
    total: accounts.length,
    customers: accounts.filter(a => a.type === 'customer').length,
    prospects: accounts.filter(a => a.type === 'prospect').length,
    totalRevenue: accounts.filter(a => a.type === 'customer').reduce((s, a) => s + a.annualRevenue, 0),
  }), [accounts])

  const openDetail = (account: Account) => {
    setDetailAccount(account)
    setDetailOpen(true)
  }

  const openEdit = (account: Account) => {
    setEditingAccount(account)
    setFormOpen(true)
  }

  const exportCSV = () => {
    const csv = [
      ['Name','Domain','Industry','Type','Employees','Annual Revenue','City','Owner'].join(','),
      ...filtered.map(a => [a.name, a.domain, INDUSTRY_LABELS[a.industry], TYPE_CONFIG[a.type].label, a.employees, a.annualRevenue, a.address.city, a.ownedBy].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const el = document.createElement('a')
    el.href = url; el.download = 'accounts.csv'; el.click()
    toast.success('Accounts exported')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            Accounts
          </h1>
          <p className="text-muted-foreground mt-1">Company records linked to your contacts and deals.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button onClick={() => { setEditingAccount(null); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" /> Add Account
          </Button>
        </div>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading accounts from the backend...
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-destructive">Could not load accounts</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={() => void refreshAccounts()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Accounts', value: stats.total },
          { label: 'Customers', value: stats.customers, accent: 'text-green-500' },
          { label: 'Prospects', value: stats.prospects, accent: 'text-blue-400' },
          { label: 'Customer Revenue', value: formatRevenue(stats.totalRevenue), accent: 'text-primary' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn('text-3xl font-bold mt-1', s.accent)}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-56" />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="All industries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {(Object.keys(INDUSTRY_LABELS) as AccountIndustry[]).map(i => (
                <SelectItem key={i} value={i}>{INDUSTRY_LABELS[i]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {(Object.keys(TYPE_CONFIG) as AccountType[]).map(t => (
                <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center rounded-md border bg-card">
          <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="rounded-r-none"><List className="h-4 w-4" /></Button>
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="rounded-l-none"><Grid3X3 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Table view */}
      {viewMode === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Annual Revenue</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No accounts found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : filtered.map(account => (
                <TableRow
                  key={account.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => openDetail(account)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold', avatarColor(account.id))}>
                        {getInitials(account.name)}
                      </div>
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.domain}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', INDUSTRY_COLORS[account.industry])}>
                      {INDUSTRY_LABELS[account.industry]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', TYPE_CONFIG[account.type].className)}>
                      {TYPE_CONFIG[account.type].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {account.employees.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{formatRevenue(account.annualRevenue)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {[account.address.city, account.address.state].filter(Boolean).join(', ') || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{account.ownedBy}</p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); openDetail(account) }}><Building2 className="mr-2 h-4 w-4" /> View details</DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); openEdit(account) }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={e => { e.stopPropagation(); deleteAccount(account.id) }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && (
        !isLoading && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No accounts found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                onView={() => openDetail(account)}
                onEdit={() => openEdit(account)}
                onDelete={() => deleteAccount(account.id)}
              />
            ))}
          </div>
        )
      )}

      {/* Form dialog */}
      <AccountFormDialog
        open={formOpen}
        onOpenChange={o => { setFormOpen(o); if (!o) setEditingAccount(null) }}
        editing={editingAccount}
      />

      {/* Detail sheet */}
      <AccountDetailSheet
        account={detailAccount}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={openEdit}
      />
    </div>
  )
}
