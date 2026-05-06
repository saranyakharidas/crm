"use client"

import { useState, useMemo } from "react"
import { useCRM } from "@/lib/crm-context"
import { Contact } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ActivityTimeline } from "@/components/crm/activity-timeline"
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
  Grid3X3,
  List,
  Filter,
  Download,
  Trash2,
  Edit,
  Eye,
} from "lucide-react"
import { toast } from "sonner"

export function ContactsView() {
  const { contacts, addContact, deleteContact } = useCRM()
  const [search, setSearch] = useState("")
  const [companyFilter, setCompanyFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("table")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Derive unique companies from contacts
  const companies = useMemo(() => {
    const uniqueCompanies = new Map<string, { id: string; name: string }>()
    contacts.forEach((contact) => {
      if (contact?.company && !uniqueCompanies.has(contact.company)) {
        uniqueCompanies.set(contact.company, {
          id: contact.company.toLowerCase().replace(/\s+/g, '-'),
          name: contact.company,
        })
      }
    })
    return Array.from(uniqueCompanies.values())
  }, [contacts])

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      if (!contact) return false
      const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
      const matchesSearch =
        fullName.toLowerCase().includes(search.toLowerCase()) ||
        (contact.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (contact.company || '').toLowerCase().includes(search.toLowerCase())
      const matchesCompany =
        companyFilter === "all" || contact.company === companyFilter

      return matchesSearch && matchesCompany
    })
  }, [contacts, search, companyFilter])

  const handleAddContact = (formData: FormData) => {
    const fullName = formData.get("name") as string
    const nameParts = fullName.trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      firstName,
      lastName,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string || '',
      company: formData.get("company") as string || '',
      position: formData.get("position") as string || '',
      notes: formData.get("notes") as string || '',
      tags: ((formData.get("tags") as string) || '').split(",").map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      lastContactedAt: new Date().toISOString(),
      status: 'active',
    }
    addContact(newContact)
    setIsAddDialogOpen(false)
    toast.success("Contact added successfully")
  }

  const handleDeleteContact = (id: string) => {
    deleteContact(id)
    toast.success("Contact deleted")
  }

  const exportContacts = () => {
    const csv = [
      ["First Name", "Last Name", "Email", "Phone", "Company", "Position"].join(","),
      ...filteredContacts.map((c) =>
        [c.firstName, c.lastName, c.email, c.phone, c.company, c.position].join(",")
      ),
    ].join("\n")
    
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "contacts.csv"
    a.click()
    toast.success("Contacts exported")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your contacts and relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportContacts}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription className="sr-only">Fill out the form to add a new contact to your CRM.</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAddContact(new FormData(e.currentTarget))
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
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" placeholder="New York, USA" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input id="tags" name="tags" placeholder="VIP, Decision Maker" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" name="notes" placeholder="Additional notes..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add Contact</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.name}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-md border bg-card">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-l-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Contacts</p>
            <p className="text-2xl font-bold">{contacts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Companies</p>
            <p className="text-2xl font-bold">{companies.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">VIP Contacts</p>
            <p className="text-2xl font-bold">
              {contacts.filter((c) => c.tags.includes("VIP")).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Added This Month</p>
            <p className="text-2xl font-bold">
              {contacts.filter((c) => {
                const date = new Date(c.createdAt)
                const now = new Date()
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
              }).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {viewMode === "table" ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {contact.firstName?.[0] || ''}{contact.lastName?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.company}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{contact.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {contact.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{contact.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedContact(contact)
                            setIsDetailOpen(true)
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteContact(contact.id)}
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
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredContacts.map((contact) => (
            <Card key={contact.id} className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {contact.firstName?.[0] || ''}{contact.lastName?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{contact.firstName} {contact.lastName}</p>
                      <p className="text-sm text-muted-foreground">{contact.position}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedContact(contact)
                          setIsDetailOpen(true)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{contact.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{contact.phone}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {contact.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contact Detail Sheet */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-[480px] sm:w-[540px] overflow-y-auto p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Contact Details</SheetTitle>
            <SheetDescription>View contact information and activity history.</SheetDescription>
          </SheetHeader>
          {selectedContact && (
            <>
              {/* Header */}
              <div className="border-b border-border p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {selectedContact.firstName?.[0] || ''}{selectedContact.lastName?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-tight">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedContact.position}{selectedContact.company ? ` at ${selectedContact.company}` : ''}
                    </p>
                    <Badge
                      variant={selectedContact.status === 'active' ? 'default' : 'secondary'}
                      className="mt-1.5 capitalize text-xs"
                    >
                      {selectedContact.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1">
                    <Mail className="mr-1.5 h-3.5 w-3.5" /> Email
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Phone className="mr-1.5 h-3.5 w-3.5" /> Call
                  </Button>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    { label: 'Email',        value: selectedContact.email },
                    { label: 'Phone',        value: selectedContact.phone },
                    { label: 'Company',      value: selectedContact.company },
                    { label: 'Last contact', value: selectedContact.lastContactedAt
                        ? new Date(selectedContact.lastContactedAt).toLocaleDateString()
                        : 'Never' },
                  ].map(f => (
                    <div key={f.label}>
                      <p className="text-xs text-muted-foreground mb-0.5">{f.label}</p>
                      <p className="font-medium truncate">{f.value || '—'}</p>
                    </div>
                  ))}
                </div>

                {selectedContact.tags?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedContact.tags.map(t => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedContact.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm leading-relaxed">{selectedContact.notes}</p>
                  </div>
                )}

                <Separator />

                {/* Activity Timeline */}
                <ActivityTimeline
                  contactId={selectedContact.id}
                  contactName={`${selectedContact.firstName} ${selectedContact.lastName}`}
                  maxHeight="420px"
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {filteredContacts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No contacts found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  )
}