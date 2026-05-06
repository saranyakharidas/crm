"use client"

import { useState, useMemo } from "react"
import { useCRM } from "@/lib/crm-context"
import { Ticket } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  MoreHorizontal,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  User,
  Filter,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Inbox,
  Send,
} from "lucide-react"
import { toast } from "sonner"

const priorityConfig: Record<Ticket["priority"], { color: string; icon: React.ReactNode }> = {
  low: { color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: <ArrowDown className="h-3 w-3" /> },
  medium: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <ArrowRight className="h-3 w-3" /> },
  high: { color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: <ArrowUp className="h-3 w-3" /> },
  urgent: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: <AlertTriangle className="h-3 w-3" /> },
}

const statusConfig: Record<Ticket["status"], { color: string; icon: React.ReactNode }> = {
  open: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: <Inbox className="h-3 w-3" /> },
  "in-progress": { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: <Clock className="h-3 w-3" /> },
  waiting: { color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: <Clock className="h-3 w-3" /> },
  resolved: { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: <CheckCircle2 className="h-3 w-3" /> },
  closed: { color: "bg-slate-500/10 text-slate-500 border-slate-500/20", icon: <XCircle className="h-3 w-3" /> },
}

const categoryIcons: Record<Ticket["category"], string> = {
  billing: "billing",
  technical: "technical",
  general: "general",
  "feature-request": "feature",
  bug: "bug",
}

export function TicketsView() {
  const { tickets, contacts, addTicket, updateTicket, deleteTicket } = useCRM()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replyText, setReplyText] = useState("")

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
        ticket.customerName.toLowerCase().includes(search.toLowerCase()) ||
        ticket.id.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, search, statusFilter, priorityFilter])

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === "open").length
    const inProgress = tickets.filter((t) => t.status === "in_progress").length
    const resolved = tickets.filter((t) => t.status === "resolved").length
    const urgent = tickets.filter((t) => t.priority === "urgent" && t.status !== "closed").length

    return { open, inProgress, resolved, urgent }
  }, [tickets])

  const handleAddTicket = (formData: FormData) => {
    const newTicket: Ticket = {
      id: `TKT-${String(tickets.length + 1).padStart(4, "0")}`,
      subject: formData.get("subject") as string,
      description: formData.get("description") as string,
      status: "open",
      priority: formData.get("priority") as Ticket["priority"],
      category: formData.get("category") as Ticket["category"],
      customerName: formData.get("customerName") as string,
      customerEmail: formData.get("customerEmail") as string,
      assignedTo: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          content: formData.get("description") as string,
          sender: "customer",
          senderName: formData.get("customerName") as string,
          timestamp: new Date().toISOString(),
        },
      ],
    }
    addTicket(newTicket)
    setIsAddDialogOpen(false)
    toast.success("Ticket created successfully")
  }

  const handleStatusChange = (ticketId: string, status: Ticket["status"]) => {
    const ticket = tickets.find((t) => t.id === ticketId)
    if (ticket) {
      updateTicket({ ...ticket, status, updatedAt: new Date().toISOString() })
      toast.success("Ticket status updated")
    }
  }

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return

    const updatedTicket: Ticket = {
      ...selectedTicket,
      messages: [
        ...selectedTicket.messages,
        {
          id: `msg-${Date.now()}`,
          content: replyText,
          sender: "agent",
          senderName: "Support Agent",
          timestamp: new Date().toISOString(),
        },
      ],
      status: selectedTicket.status === "open" ? "in_progress" : selectedTicket.status,
      updatedAt: new Date().toISOString(),
    }
    updateTicket(updatedTicket)
    setSelectedTicket(updatedTicket)
    setReplyText("")
    toast.success("Reply sent")
  }

  const handleDeleteTicket = (id: string) => {
    deleteTicket(id)
    toast.success("Ticket deleted")
  }

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer support requests
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription className="sr-only">Fill out the form to create a new support ticket.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAddTicket(new FormData(e.currentTarget))
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input id="subject" name="subject" required placeholder="Brief description of the issue" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input id="customerName" name="customerName" required placeholder="John Doe" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="customerEmail">Customer Email *</Label>
                  <Input id="customerEmail" name="customerEmail" type="email" required placeholder="john@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue="general">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" name="description" required placeholder="Detailed description of the issue..." rows={4} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Ticket</Button>
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
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3">
                <Inbox className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <div className="rounded-full bg-yellow-500/10 p-3">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.urgent > 0 ? "border-red-500/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">{stats.urgent}</p>
              </div>
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Ticket List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tickets */}
          <div className="flex flex-col gap-2">
            {filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedTicket?.id === ticket.id ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">{ticket.id}</span>
                        <Badge variant="outline" className={`text-xs ${priorityConfig[ticket.priority].color}`}>
                          {priorityConfig[ticket.priority].icon}
                          <span className="ml-1 capitalize">{ticket.priority}</span>
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${statusConfig[ticket.status].color}`}>
                          {statusConfig[ticket.status].icon}
                          <span className="ml-1 capitalize">{ticket.status.replace("_", " ")}</span>
                        </Badge>
                      </div>
                      <h3 className="mt-1 font-medium truncate">{ticket.subject}</h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
                        {ticket.description}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(ticket.updatedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.messages.length}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(ticket.id, "in_progress"); }}>
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(ticket.id, "resolved"); }}>
                          Mark Resolved
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDeleteTicket(ticket.id); }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No tickets found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Ticket Detail Panel */}
        <div className="lg:col-span-1">
          {selectedTicket ? (
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">{selectedTicket.id}</p>
                    <CardTitle className="text-lg mt-1">{selectedTicket.subject}</CardTitle>
                  </div>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => {
                      handleStatusChange(selectedTicket.id, value as Ticket["status"])
                      setSelectedTicket({ ...selectedTicket, status: value as Ticket["status"] })
                    }}
                  >
                    <SelectTrigger className={`w-32 ${statusConfig[selectedTicket.status].color}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting">Waiting</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Customer Info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedTicket.customerName.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedTicket.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.customerEmail}</p>
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Priority</p>
                    <Badge variant="outline" className={`mt-1 ${priorityConfig[selectedTicket.priority].color}`}>
                      {priorityConfig[selectedTicket.priority].icon}
                      <span className="ml-1 capitalize">{selectedTicket.priority}</span>
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="capitalize font-medium mt-1">{selectedTicket.category.replace("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium mt-1">{new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Updated</p>
                    <p className="font-medium mt-1">{getTimeAgo(selectedTicket.updatedAt)}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Conversation
                  </h4>
                  <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                    {selectedTicket.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg text-sm ${
                          message.sender === "customer"
                            ? "bg-muted/50"
                            : "bg-primary/10 border border-primary/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{message.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reply */}
                <div className="border-t pt-4">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <Button
                    className="mt-2 w-full"
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No ticket selected</h3>
                <p className="text-muted-foreground">
                  Select a ticket to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
