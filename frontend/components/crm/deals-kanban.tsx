'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  Filter,
  MoreHorizontal,
  DollarSign,
  Calendar,
  User,
  Building,
  GripVertical,
  Phone,
  Mail,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ActivityTimeline } from '@/components/crm/activity-timeline'
import { cn } from '@/lib/utils'
import { useCRM } from '@/lib/crm-context'
import type { Deal, DealStage } from '@/lib/types'
import { toast } from 'sonner'

const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: 'lead', label: 'Lead', color: 'bg-slate-500' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'closed-won', label: 'Closed Won', color: 'bg-green-500' },
  { id: 'closed-lost', label: 'Closed Lost', color: 'bg-red-500' },
]

export function DealsKanban() {
  const { deals, moveDealStage, addDeal, deleteDeal, contacts } = useCRM()
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [filterStage, setFilterStage] = useState<string>('all')
  const [detailDeal, setDetailDeal] = useState<Deal | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const filteredDeals = useMemo(() => {
    if (filterStage === 'all') return deals
    return deals.filter(d => d.stage === filterStage)
  }, [deals, filterStage])

  const dealsByStage = useMemo(() => {
    const grouped: Record<DealStage, Deal[]> = {
      lead: [],
      qualified: [],
      proposal: [],
      negotiation: [],
      'closed-won': [],
      'closed-lost': [],
    }

    filteredDeals.forEach((deal) => {
      grouped[deal.stage].push(deal)
    })

    return grouped
  }, [filteredDeals])

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id)
    if (deal) {
      setActiveDeal(deal)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDeal(null)

    if (!over) return

    const dealId = active.id as string
    const newStage = over.id as DealStage

    if (STAGES.some((s) => s.id === newStage)) {
      const deal = deals.find((d) => d.id === dealId)
      if (deal && deal.stage !== newStage) {
        moveDealStage(dealId, newStage)
        toast.success(`Deal moved to ${STAGES.find(s => s.id === newStage)?.label}`)
      }
    }
  }

  const totalValue = useMemo(() => {
    return deals
      .filter(d => d.stage !== 'closed-lost')
      .reduce((sum, deal) => sum + deal.value, 0)
  }, [deals])

  const weightedValue = useMemo(() => {
    return deals
      .filter(d => d.stage !== 'closed-lost' && d.stage !== 'closed-won')
      .reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0)
  }, [deals])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Drag and drop deals between stages
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-4">
            <p className="text-sm text-muted-foreground">Pipeline Value</p>
            <p className="text-2xl font-bold">${(totalValue / 1000).toFixed(0)}K</p>
          </div>
          <div className="text-right mr-4">
            <p className="text-sm text-muted-foreground">Weighted Value</p>
            <p className="text-2xl font-bold text-primary">${(weightedValue / 1000).toFixed(0)}K</p>
          </div>
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STAGES.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AddDealDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            contacts={contacts}
            onAdd={addDeal}
          />
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage[stage.id]}
              onDelete={deleteDeal}
              onViewDetail={(deal) => { setDetailDeal(deal); setDetailOpen(true) }}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Deal Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Deal Details</SheetTitle>
            <SheetDescription>View deal information and activity history.</SheetDescription>
          </SheetHeader>
          {detailDeal && (
            <>
              <div className="border-b border-border p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${STAGES.find(s => s.id === detailDeal.stage)?.color.replace('bg-', '') === detailDeal.stage ? '#6b728020' : '#6b728020'}`,
                          color: '#9ca3af'
                        }}
                      >
                        {STAGES.find(s => s.id === detailDeal.stage)?.label}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold leading-tight">{detailDeal.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {detailDeal.contact.firstName} {detailDeal.contact.lastName} · {detailDeal.contact.company}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Phone className="mr-1.5 h-3.5 w-3.5" /> Call
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    { label: 'Value',       value: `$${detailDeal.value.toLocaleString()}` },
                    { label: 'Probability', value: `${detailDeal.probability}%` },
                    { label: 'Close date',  value: new Date(detailDeal.expectedCloseDate).toLocaleDateString() },
                    { label: 'Company',     value: detailDeal.contact.company },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                      <p className="font-medium">{f.value}</p>
                    </div>
                  ))}
                </div>

                {detailDeal.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm leading-relaxed">{detailDeal.description}</p>
                  </div>
                )}

                <Separator />

                <ActivityTimeline
                  dealId={detailDeal.id}
                  dealTitle={detailDeal.title}
                  maxHeight="420px"
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Stage Column Component
interface StageColumnProps {
  stage: { id: DealStage; label: string; color: string }
  deals: Deal[]
  onDelete: (id: string) => void
  onViewDetail: (deal: Deal) => void
}

function StageColumn({ stage, deals, onDelete, onViewDetail }: StageColumnProps) {
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0)

  return (
    <div
      className="flex-shrink-0 w-80 flex flex-col bg-muted/30 rounded-xl"
    >
      {/* Column Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn('h-3 w-3 rounded-full', stage.color)} />
            <h3 className="font-semibold">{stage.label}</h3>
            <Badge variant="secondary" className="text-xs">
              {deals.length}
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          ${totalValue.toLocaleString()}
        </p>
      </div>

      {/* Deals List */}
      <SortableContext
        id={stage.id}
        items={deals.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]" data-stage={stage.id}>
          {deals.map((deal) => (
            <SortableDealCard key={deal.id} deal={deal} onDelete={onDelete} onViewDetail={onViewDetail} />
          ))}
          {deals.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg">
              Drop deals here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// Sortable Deal Card
interface SortableDealCardProps {
  deal: Deal
  onDelete: (id: string) => void
  onViewDetail: (deal: Deal) => void
}

function SortableDealCard({ deal, onDelete, onViewDetail }: SortableDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: {
      type: 'deal',
      deal,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DealCard
        deal={deal}
        isDragging={isDragging}
        dragHandleProps={listeners}
        onDelete={onDelete}
        onViewDetail={onViewDetail}
      />
    </div>
  )
}

// Deal Card Component
interface DealCardProps {
  deal: Deal
  isDragging?: boolean
  dragHandleProps?: any
  onDelete?: (id: string) => void
  onViewDetail?: (deal: Deal) => void
}

function DealCard({ deal, isDragging, dragHandleProps, onDelete, onViewDetail }: DealCardProps) {
  const daysUntilClose = Math.ceil(
    (new Date(deal.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all',
        isDragging && 'opacity-50 shadow-2xl rotate-2 scale-105'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div {...dragHandleProps} className="cursor-grab">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <h4 className="font-medium leading-tight line-clamp-2">{deal.title}</h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetail?.(deal)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Deal
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Phone className="mr-2 h-4 w-4" />
                Call Contact
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(deal.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Deal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Avatar className="h-6 w-6">
              <AvatarImage src={deal.contact.avatar} />
              <AvatarFallback className="text-xs">
                {deal.contact.firstName[0]}{deal.contact.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-muted-foreground">
              {deal.contact.firstName} {deal.contact.lastName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building className="h-4 w-4" />
            <span className="truncate">{deal.contact.company}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="font-semibold">${deal.value.toLocaleString()}</span>
            </div>
            <Badge
              variant={daysUntilClose < 0 ? 'destructive' : daysUntilClose < 7 ? 'default' : 'secondary'}
              className="text-xs"
            >
              {daysUntilClose < 0 ? 'Overdue' : daysUntilClose === 0 ? 'Today' : `${daysUntilClose}d`}
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Probability</span>
              <span className="font-medium">{deal.probability}%</span>
            </div>
            <Progress value={deal.probability} className="h-1.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Add Deal Dialog
interface AddDealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: any[]
  onAdd: (deal: any) => void
}

function AddDealDialog({ open, onOpenChange, contacts, onAdd }: AddDealDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    contactId: '',
    stage: 'lead' as DealStage,
    expectedCloseDate: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const contact = contacts.find(c => c.id === formData.contactId)
    if (!contact) return

    onAdd({
      title: formData.title,
      value: parseFloat(formData.value) || 0,
      currency: 'USD',
      stage: formData.stage,
      probability: 10,
      contactId: formData.contactId,
      contact,
      expectedCloseDate: formData.expectedCloseDate || new Date().toISOString(),
      notes: formData.notes,
    })

    toast.success('Deal created successfully')
    onOpenChange(false)
    setFormData({
      title: '',
      value: '',
      contactId: '',
      stage: 'lead',
      expectedCloseDate: '',
      notes: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
                <DialogDescription className="sr-only">Fill out the form to create a new deal in your pipeline.</DialogDescription>
            <DialogDescription>
              Add a new deal to your pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Deal Title</Label>
              <Input
                id="title"
                placeholder="Enterprise License Deal"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="value">Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="50000"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => setFormData({ ...formData, stage: value as DealStage })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.slice(0, 4).map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact">Contact</Label>
              <Select
                value={formData.contactId}
                onValueChange={(value) => setFormData({ ...formData, contactId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName} - {contact.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="closeDate">Expected Close Date</Label>
              <Input
                id="closeDate"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this deal..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Deal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}