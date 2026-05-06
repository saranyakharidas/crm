"use client"

import { useState, useMemo } from "react"
import { useLeads, type Lead } from "@/lib/leads-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  Sparkles,
  Target,
  Zap,
  Trash2,
  UserPlus,
  Filter,
} from "lucide-react"

const statusColors: Record<Lead["status"], string> = {
  new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  contacted: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  qualified: "bg-green-500/10 text-green-500 border-green-500/20",
  unqualified: "bg-red-500/10 text-red-500 border-red-500/20",
}

const sourceIcons: Record<Lead["source"], React.ReactNode> = {
  website: <Target className="h-4 w-4" />,
  referral: <UserPlus className="h-4 w-4" />,
  linkedin: <Building2 className="h-4 w-4" />,
  cold_call: <Phone className="h-4 w-4" />,
  event: <Sparkles className="h-4 w-4" />,
  other: <Zap className="h-4 w-4" />,
}

export function LeadsView() {
  const { leads, addLead, updateLead, deleteLead, isLoading, error, refreshLeads } = useLeads()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.company.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter

      return matchesSearch && matchesStatus && matchesSource
    })
  }, [leads, search, statusFilter, sourceFilter])

  const stats = useMemo(() => {
    const total = leads.length
    const qualified = leads.filter((l) => l.status === "qualified").length
    const avgScore = leads.reduce((acc, l) => acc + l.score, 0) / total || 0
    const hotLeads = leads.filter((l) => l.score >= 80).length

    return { total, qualified, avgScore: Math.round(avgScore), hotLeads }
  }, [leads])

  const handleAddLead = (formData: FormData) => {
    const newLead = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: (formData.get("phone") as string) || "",
      company: (formData.get("company") as string) || "",
      position: (formData.get("position") as string) || "",
      source: formData.get("source") as Lead["source"],
      status: "new" as Lead["status"],
      score: Math.floor(Math.random() * 40) + 40, // Random score 40-80
      assignedTo: "",
      notes: (formData.get("notes") as string) || "",
      lastActivityAt: new Date().toISOString(),
    }

    void addLead(newLead).then(() => {
      setIsAddDialogOpen(false)
    })
  }

  const handleDeleteLead = (id: string) => {
    void deleteLead(id)
  }

  const handleStatusChange = (leadId: string, status: Lead["status"]) => {
    const lead = leads.find((l) => l.id === leadId)
    if (lead) {
      void updateLead(leadId, {
        status,
        lastActivityAt: new Date().toISOString(),
      })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    if (score >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Track and qualify your leads with AI-powered scoring
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription className="sr-only">Fill out the form to add a new lead to your CRM.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAddLead(new FormData(e.currentTarget))
              }}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required placeholder="John Doe" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required placeholder="john@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="+1 234 567 890" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" placeholder="Acme Inc" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="position">Position</Label>
                  <Input id="position" name="position" placeholder="CEO" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Select name="source" defaultValue="website">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Additional notes..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Lead</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Qualified</p>
                <p className="text-2xl font-bold">{stats.qualified}</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <Target className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Score</p>
                <p className="text-2xl font-bold">{stats.avgScore}</p>
              </div>
              <div className="rounded-full bg-yellow-500/10 p-3">
                <TrendingUp className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hot Leads</p>
                <p className="text-2xl font-bold">{stats.hotLeads}</p>
              </div>
              <div className="rounded-full bg-red-500/10 p-3">
                <Zap className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading leads from the backend...
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-destructive">Could not load leads</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" onClick={() => void refreshLeads()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="unqualified">Unqualified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="cold_call">Cold Call</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Leads Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {lead.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-sm text-muted-foreground">{lead.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p>{lead.company}</p>
                    <p className="text-sm text-muted-foreground">{lead.position}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {sourceIcons[lead.source]}
                    <span className="capitalize">{lead.source.replace("_", " ")}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={lead.status}
                    onValueChange={(value) => handleStatusChange(lead.id, value as Lead["status"])}
                  >
                    <SelectTrigger className={`w-32 border ${statusColors[lead.status]}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="unqualified">Unqualified</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3 w-28">
                    <div className="flex-1">
                      <Progress
                        value={lead.score}
                        className="h-2"
                        style={{
                          // @ts-ignore
                          "--progress-background": lead.score >= 80 ? "rgb(34 197 94)" : lead.score >= 60 ? "rgb(234 179 8)" : lead.score >= 40 ? "rgb(249 115 22)" : "rgb(239 68 68)",
                        }}
                      />
                    </div>
                    <span className={`font-semibold ${getScoreColor(lead.score)}`}>
                      {lead.score}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground">
                    {new Date(lead.lastActivityAt).toLocaleDateString()}
                  </p>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone className="mr-2 h-4 w-4" />
                        Call
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* AI Insight Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                AI Lead Insights
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.hotLeads > 0
                  ? `You have ${stats.hotLeads} hot leads with scores above 80. Consider prioritizing outreach to these high-potential prospects.`
                  : "Focus on engaging new leads to build your pipeline. Website and referral sources typically yield the highest conversion rates."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredLeads.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No leads found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  )
}
