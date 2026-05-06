'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  useProducts,
  type Product, type PriceBook, type PriceBookEntry,
  type ProductCategory, type ProductStatus, type PricingModel,
} from '@/lib/products-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package, BookOpen, Plus, Search, MoreHorizontal, Edit, Trash2,
  Tag, DollarSign, Layers, Star, StarOff, Copy, X, ChevronRight,
  TrendingUp, ShoppingCart, Grid3X3, List,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'

// ─── Config ────────────────────────────────────────────────────────────────────
const CATEGORY_CFG: Record<ProductCategory, { label: string; color: string }> = {
  software:  { label: 'Software',  color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'  },
  hardware:  { label: 'Hardware',  color: 'bg-orange-500/10 text-orange-400 border-orange-500/20'  },
  service:   { label: 'Service',   color: 'bg-violet-500/10 text-violet-400 border-violet-500/20'  },
  support:   { label: 'Support',   color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'        },
  training:  { label: 'Training',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'},
  addon:     { label: 'Add-on',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20'     },
}

const STATUS_CFG: Record<ProductStatus, { label: string; color: string; dot: string }> = {
  active:       { label: 'Active',       color: 'bg-green-500/10 text-green-400 border-green-500/20',    dot: 'bg-green-400'  },
  inactive:     { label: 'Inactive',     color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',    dot: 'bg-slate-400'  },
  discontinued: { label: 'Discontinued', color: 'bg-red-500/10 text-red-400 border-red-500/20',          dot: 'bg-red-400'    },
}

const PRICING_LABELS: Record<PricingModel, string> = {
  one_time: 'One-time',
  monthly:  'Monthly',
  annual:   'Annual',
  per_user: 'Per user',
  usage:    'Usage-based',
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

// ─── Product Form Dialog ───────────────────────────────────────────────────────
function ProductFormDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing?: Product | null }) {
  const { addProduct, updateProduct } = useProducts()

  const blank = {
    name: '', code: '', description: '', category: 'software' as ProductCategory,
    status: 'active' as ProductStatus, pricingModel: 'annual' as PricingModel,
    basePrice: '', taxRate: '0', unit: 'license', tags: '',
  }
  const [f, setF] = useState({ ...blank })
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (open && editing) {
      setF({
        name: editing.name, code: editing.code, description: editing.description,
        category: editing.category, status: editing.status,
        pricingModel: editing.pricingModel, basePrice: String(editing.basePrice),
        taxRate: String(editing.taxRate), unit: editing.unit,
        tags: editing.tags.join(', '),
      })
    } else if (open) setF({ ...blank })
  }, [open, editing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.name.trim() || !f.code.trim()) { toast.error('Name and code are required'); return }
    const payload = {
      name: f.name.trim(), code: f.code.trim().toUpperCase(),
      description: f.description.trim(), category: f.category,
      status: f.status, pricingModel: f.pricingModel,
      basePrice: parseFloat(f.basePrice) || 0,
      taxRate: parseFloat(f.taxRate) || 0,
      unit: f.unit.trim() || 'unit',
      tags: f.tags.split(',').map(t => t.trim()).filter(Boolean),
      variants: editing?.variants ?? [],
    }
    if (editing) updateProduct(editing.id, payload)
    else addProduct(payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Product' : 'New Product'}</DialogTitle>
          <DialogDescription>Add a product or service to your catalog.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid gap-2">
              <Label>Product name *</Label>
              <Input placeholder="CRM Pro Platform" value={f.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Product code (SKU) *</Label>
              <Input placeholder="CRM-PRO-001" value={f.code} onChange={e => set('code', e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={f.category} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_CFG) as ProductCategory[]).map(c => (
                    <SelectItem key={c} value={c}>{CATEGORY_CFG[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Pricing model</Label>
              <Select value={f.pricingModel} onValueChange={v => set('pricingModel', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRICING_LABELS) as PricingModel[]).map(m => (
                    <SelectItem key={m} value={m}>{PRICING_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={f.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_CFG) as ProductStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CFG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Base price ($)</Label>
              <Input type="number" min={0} placeholder="49" value={f.basePrice} onChange={e => set('basePrice', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Tax rate (%)</Label>
              <Input type="number" min={0} max={100} placeholder="0" value={f.taxRate} onChange={e => set('taxRate', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Unit</Label>
              <Input placeholder="seat/month" value={f.unit} onChange={e => set('unit', e.target.value)} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Tags <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
              <Input placeholder="Core, SaaS, Annual" value={f.tags} onChange={e => set('tags', e.target.value)} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="What does this product include?" value={f.description} onChange={e => set('description', e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Create product'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Product Detail Sheet ──────────────────────────────────────────────────────
function ProductDetailSheet({
  product, priceBooks, open, onOpenChange, onEdit,
}: { product: Product | null; priceBooks: PriceBook[]; open: boolean; onOpenChange: (o: boolean) => void; onEdit: (p: Product) => void }) {
  if (!product) return null
  const catCfg = CATEGORY_CFG[product.category]
  const stsCfg = STATUS_CFG[product.status]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:w-[520px] overflow-y-auto p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{product.name}</SheetTitle>
          <SheetDescription>Product details and pricing</SheetDescription>
        </SheetHeader>

        <div className="border-b border-border p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', catCfg.color)}>
                  {catCfg.label}
                </span>
                <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium', stsCfg.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', stsCfg.dot)} />
                  {stsCfg.label}
                </span>
              </div>
              <h2 className="text-xl font-bold">{product.name}</h2>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">{product.code}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { onOpenChange(false); onEdit(product) }}>
              <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{product.description}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Pricing */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border/60 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">Base price</p>
                <p className="text-xl font-bold text-primary">{fmtMoney(product.basePrice)}</p>
                <p className="text-xs text-muted-foreground">per {product.unit}</p>
              </div>
              <div className="rounded-lg border border-border/60 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">Pricing model</p>
                <p className="font-semibold">{PRICING_LABELS[product.pricingModel]}</p>
                <p className="text-xs text-muted-foreground">Tax: {product.taxRate}%</p>
              </div>
            </div>
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Variants / Tiers</p>
              <div className="space-y-1.5">
                {product.variants.map(v => (
                  <div key={v.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{v.name}</p>
                      {v.maxUsers !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          {v.maxUsers === 0 ? 'Unlimited users' : `Up to ${v.maxUsers} users`}
                        </p>
                      )}
                    </div>
                    <span className="font-bold">{fmtMoney(v.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price across books */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Across Price Books</p>
            <div className="space-y-1.5">
              {priceBooks.map(pb => {
                const entry = pb.entries.find(e => e.productId === product.id)
                if (!entry) return null
                return (
                  <div key={pb.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pb.name}</span>
                      {pb.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.discount && <span className="text-xs text-emerald-400">−{entry.discount}%</span>}
                      <span className="font-semibold">{fmtMoney(entry.price)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
            </div>
          )}

          <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })} ·
            Updated {formatDistanceToNow(new Date(product.updatedAt), { addSuffix: true })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Price Book Dialog ─────────────────────────────────────────────────────────
function PriceBookDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing?: PriceBook | null }) {
  const { products, addPriceBook, updatePriceBook } = useProducts()

  const blank = { name: '', description: '', currency: 'USD', isDefault: false, validFrom: '', validTo: '' }
  const [f, setF] = useState({ ...blank })
  const [entries, setEntries] = useState<PriceBookEntry[]>([])
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (open && editing) {
      setF({
        name: editing.name, description: editing.description,
        currency: editing.currency, isDefault: editing.isDefault,
        validFrom: editing.validFrom?.slice(0, 10) ?? '',
        validTo: editing.validTo?.slice(0, 10) ?? '',
      })
      setEntries(editing.entries.map(e => ({ ...e })))
    } else if (open) {
      setF({ ...blank })
      setEntries(products.map(p => ({ productId: p.id, price: p.basePrice })))
    }
  }, [open, editing, products])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.name.trim()) { toast.error('Name is required'); return }
    const payload = {
      name: f.name.trim(), description: f.description.trim(),
      currency: f.currency, isDefault: f.isDefault,
      entries,
      validFrom: f.validFrom ? new Date(f.validFrom).toISOString() : undefined,
      validTo:   f.validTo   ? new Date(f.validTo).toISOString()   : undefined,
    }
    if (editing) updatePriceBook(editing.id, payload)
    else addPriceBook(payload)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Price Book' : 'New Price Book'}</DialogTitle>
          <DialogDescription>Configure custom pricing for a segment or promotion.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid gap-2">
              <Label>Name *</Label>
              <Input placeholder="Enterprise Discount" value={f.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Valid from</Label>
              <Input type="date" value={f.validFrom} onChange={e => set('validFrom', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Valid to</Label>
              <Input type="date" value={f.validTo} onChange={e => set('validTo', e.target.value)} />
            </div>
            <div className="col-span-2 grid gap-2">
              <Label>Description</Label>
              <Textarea placeholder="Who is this price book for?" value={f.description} onChange={e => set('description', e.target.value)} rows={2} />
            </div>
          </div>

          {/* Product prices */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Product Prices</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" className="text-xs h-7"
                  onClick={() => setEntries(prev => prev.map(e => {
                    const p = products.find(p => p.id === e.productId)
                    return p ? { ...e, price: Math.round(p.basePrice * 0.8), discount: 20 } : e
                  }))}>
                  Apply 20% off
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-xs h-7"
                  onClick={() => setEntries(prev => prev.map(e => {
                    const p = products.find(p => p.id === e.productId)
                    return p ? { ...e, price: p.basePrice, discount: undefined } : e
                  }))}>
                  Reset to base
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-border/60 divide-y divide-border/60 max-h-64 overflow-y-auto">
              {entries.map(entry => {
                const product = products.find(p => p.id === entry.productId)
                if (!product) return null
                return (
                  <div key={entry.productId} className="flex items-center gap-3 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Base: {fmtMoney(product.basePrice)}</p>
                    </div>
                    <Input
                      type="number" min={0}
                      className="w-28 h-7 text-xs text-right"
                      value={entry.price}
                      onChange={e => setEntries(prev => prev.map(en =>
                        en.productId === entry.productId ? { ...en, price: parseFloat(e.target.value) || 0 } : en
                      ))}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save changes' : 'Create price book'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main View ─────────────────────────────────────────────────────────────────
export function ProductsView() {
  const { products, priceBooks, deleteProduct, deletePriceBook, isLoading, error, refreshProducts } = useProducts()
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('all')
  const [stsFilter,  setStsFilter]  = useState('all')
  const [viewMode,   setViewMode]   = useState<'grid' | 'table'>('grid')
  const [formOpen,   setFormOpen]   = useState(false)
  const [pbOpen,     setPbOpen]     = useState(false)
  const [editing,    setEditing]    = useState<Product | null>(null)
  const [pbEditing,  setPbEditing]  = useState<PriceBook | null>(null)
  const [detailProd, setDetailProd] = useState<Product | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const filtered = useMemo(() => products.filter(p => {
    const s = search.toLowerCase()
    const matchSearch = p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s) || p.description.toLowerCase().includes(s)
    const matchCat = catFilter === 'all' || p.category === catFilter
    const matchSts = stsFilter === 'all' || p.status === stsFilter
    return matchSearch && matchCat && matchSts
  }), [products, search, catFilter, stsFilter])

  const stats = useMemo(() => ({
    total:  products.length,
    active: products.filter(p => p.status === 'active').length,
    books:  priceBooks.length,
    avgPrice: products.length ? Math.round(products.reduce((s, p) => s + p.basePrice, 0) / products.length) : 0,
  }), [products, priceBooks])

  const openEdit   = (p: Product)   => { setEditing(p);   setFormOpen(true) }
  const openDetail = (p: Product)   => { setDetailProd(p); setDetailOpen(true) }
  const openPbEdit = (pb: PriceBook)=> { setPbEditing(pb); setPbOpen(true) }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            Products & Price Books
          </h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog and pricing tiers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setPbEditing(null); setPbOpen(true) }}>
            <BookOpen className="mr-2 h-4 w-4" /> New Price Book
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" /> New Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Products', value: stats.total,            accent: '' },
          { label: 'Active',         value: stats.active,           accent: 'text-green-400' },
          { label: 'Price Books',    value: stats.books,            accent: 'text-primary' },
          { label: 'Avg Base Price', value: fmtMoney(stats.avgPrice), accent: 'text-amber-400' },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn('text-3xl font-bold mt-1', s.accent)}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading products from the backend...
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-destructive">Could not load products</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={() => void refreshProducts()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" /> Products
            <Badge variant="secondary" className="ml-1 text-xs">{products.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pricebooks" className="gap-2">
            <BookOpen className="h-4 w-4" /> Price Books
            <Badge variant="secondary" className="ml-1 text-xs">{priceBooks.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Products tab */}
        <TabsContent value="products" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-52" />
              </div>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {(Object.keys(CATEGORY_CFG) as ProductCategory[]).map(c => (
                    <SelectItem key={c} value={c}>{CATEGORY_CFG[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stsFilter} onValueChange={setStsFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {(Object.keys(STATUS_CFG) as ProductStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CFG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex rounded-md border bg-card">
              <Button variant={viewMode === 'grid'  ? 'secondary' : 'ghost'} size="sm" className="rounded-r-none" onClick={() => setViewMode('grid')}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm" className="rounded-l-none" onClick={() => setViewMode('table')}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Grid */}
          {viewMode === 'grid' && (
            filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-semibold mb-1">No products found</p>
                <Button onClick={() => { setEditing(null); setFormOpen(true) }}><Plus className="mr-2 h-4 w-4" /> New Product</Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map(p => {
                  const catCfg = CATEGORY_CFG[p.category]
                  const stsCfg = STATUS_CFG[p.status]
                  return (
                    <Card key={p.id} className="group hover:border-border/80 transition-colors cursor-pointer"
                      onClick={() => openDetail(p)}>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium', catCfg.color)}>
                              {catCfg.label}
                            </span>
                            <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium', stsCfg.color)}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', stsCfg.dot)} />
                              {stsCfg.label}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={e => { e.stopPropagation(); openEdit(p) }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={e => { e.stopPropagation(); deleteProduct(p.id) }}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{p.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">{p.code}</p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                        <div className="flex items-end justify-between pt-1">
                          <div>
                            <p className="text-xl font-bold text-primary">{fmtMoney(p.basePrice)}</p>
                            <p className="text-xs text-muted-foreground">per {p.unit} · {PRICING_LABELS[p.pricingModel]}</p>
                          </div>
                          {p.variants.length > 0 && (
                            <Badge variant="secondary" className="text-xs">{p.variants.length} tiers</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )
          )}

          {/* Table */}
          {viewMode === 'table' && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Base Price</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openDetail(p)}>
                      <TableCell className="font-medium text-sm">{p.name}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{p.code}</TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-medium', CATEGORY_CFG[p.category].color)}>
                          {CATEGORY_CFG[p.category].label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium', STATUS_CFG[p.status].color)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_CFG[p.status].dot)} />
                          {STATUS_CFG[p.status].label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{PRICING_LABELS[p.pricingModel]}</TableCell>
                      <TableCell className="text-right font-semibold">{fmtMoney(p.basePrice)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.unit}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(p)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteProduct(p.id)}>
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
        </TabsContent>

        {/* Price Books tab */}
        <TabsContent value="pricebooks" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {priceBooks.map(pb => (
              <Card key={pb.id} className="group">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{pb.name}</p>
                        {pb.isDefault && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Star className="h-2.5 w-2.5" /> Default
                          </Badge>
                        )}
                      </div>
                      {pb.description && <p className="text-xs text-muted-foreground">{pb.description}</p>}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openPbEdit(pb)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deletePriceBook(pb.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Products</span>
                      <span className="font-medium text-foreground">{pb.entries.length}</span>
                    </div>
                    {pb.validFrom && (
                      <div className="flex justify-between">
                        <span>Valid from</span>
                        <span>{format(new Date(pb.validFrom), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                    {pb.validTo && (
                      <div className="flex justify-between">
                        <span>Expires</span>
                        <span className={new Date(pb.validTo) < new Date() ? 'text-red-400' : ''}>
                          {format(new Date(pb.validTo), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sample of prices */}
                  <div className="border-t border-border/60 pt-2.5 space-y-1">
                    {pb.entries.slice(0, 3).map(entry => {
                      const prod = products.find(p => p.id === entry.productId)
                      if (!prod) return null
                      return (
                        <div key={entry.productId} className="flex justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[60%]">{prod.name}</span>
                          <div className="flex items-center gap-1.5">
                            {entry.discount && <span className="text-emerald-400">−{entry.discount}%</span>}
                            <span className="font-medium">{fmtMoney(entry.price)}</span>
                          </div>
                        </div>
                      )
                    })}
                    {pb.entries.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{pb.entries.length - 3} more products</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add new price book card */}
            <Card className="border-dashed cursor-pointer hover:border-border/80 transition-colors"
              onClick={() => { setPbEditing(null); setPbOpen(true) }}>
              <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[160px] gap-2 text-muted-foreground">
                <Plus className="h-8 w-8" />
                <p className="text-sm font-medium">New Price Book</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail sheet */}
      <ProductDetailSheet
        product={detailProd} priceBooks={priceBooks}
        open={detailOpen} onOpenChange={setDetailOpen} onEdit={openEdit}
      />

      {/* Product form */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={o => { setFormOpen(o); if (!o) setEditing(null) }}
        editing={editing}
      />

      {/* Price book form */}
      <PriceBookDialog
        open={pbOpen}
        onOpenChange={o => { setPbOpen(o); if (!o) setPbEditing(null) }}
        editing={pbEditing}
      />
    </div>
  )
}
