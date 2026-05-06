'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  Kanban,
  TicketCheck,
  CheckSquare,
  Search,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { useCRM } from '@/lib/crm-context'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const { searchAll } = useCRM()

  const results = query.length > 0 ? searchAll(query) : null

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const handleSelect = useCallback((type: string, id: string) => {
    onOpenChange(false)
    setQuery('')
    
    switch (type) {
      case 'contact':
        router.push(`/contacts?id=${id}`)
        break
      case 'lead':
        router.push(`/leads?id=${id}`)
        break
      case 'deal':
        router.push(`/deals?id=${id}`)
        break
      case 'ticket':
        router.push(`/tickets?id=${id}`)
        break
      case 'task':
        router.push(`/calendar?task=${id}`)
        break
    }
  }, [router, onOpenChange])

  const hasResults = results && (
    results.contacts.length > 0 ||
    results.leads.length > 0 ||
    results.deals.length > 0 ||
    results.tickets.length > 0 ||
    results.tasks.length > 0
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search contacts, deals, leads, tickets..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.length === 0 && (
          <CommandEmpty>Start typing to search...</CommandEmpty>
        )}
        {query.length > 0 && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {results?.contacts && results.contacts.length > 0 && (
          <CommandGroup heading="Contacts">
            {results.contacts.slice(0, 5).map((contact) => (
              <CommandItem
                key={contact.id}
                value={`contact-${contact.id}`}
                onSelect={() => handleSelect('contact', contact.id)}
                className="flex items-center gap-3"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">
                    {contact.firstName} {contact.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {contact.company} - {contact.email}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {contact.status}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.contacts && results.contacts.length > 0 && results?.leads && results.leads.length > 0 && (
          <CommandSeparator />
        )}

        {results?.leads && results.leads.length > 0 && (
          <CommandGroup heading="Leads">
            {results.leads.slice(0, 5).map((lead) => (
              <CommandItem
                key={lead.id}
                value={`lead-${lead.id}`}
                onSelect={() => handleSelect('lead', lead.id)}
                className="flex items-center gap-3"
              >
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.company} - Score: {lead.score}
                  </p>
                </div>
                <Badge
                  variant={lead.status === 'qualified' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {lead.status}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.leads && results.leads.length > 0 && results?.deals && results.deals.length > 0 && (
          <CommandSeparator />
        )}

        {results?.deals && results.deals.length > 0 && (
          <CommandGroup heading="Deals">
            {results.deals.slice(0, 5).map((deal) => (
              <CommandItem
                key={deal.id}
                value={`deal-${deal.id}`}
                onSelect={() => handleSelect('deal', deal.id)}
                className="flex items-center gap-3"
              >
                <Kanban className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{deal.title}</p>
                  <p className="text-xs text-muted-foreground">
                    ${deal.value.toLocaleString()} - {deal.stage}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {deal.probability}%
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.deals && results.deals.length > 0 && results?.tickets && results.tickets.length > 0 && (
          <CommandSeparator />
        )}

        {results?.tickets && results.tickets.length > 0 && (
          <CommandGroup heading="Tickets">
            {results.tickets.slice(0, 5).map((ticket) => (
              <CommandItem
                key={ticket.id}
                value={`ticket-${ticket.id}`}
                onSelect={() => handleSelect('ticket', ticket.id)}
                className="flex items-center gap-3"
              >
                <TicketCheck className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.contact.firstName} {ticket.contact.lastName}
                  </p>
                </div>
                <Badge
                  variant={ticket.priority === 'urgent' ? 'destructive' : 'outline'}
                  className="text-xs"
                >
                  {ticket.priority}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.tickets && results.tickets.length > 0 && results?.tasks && results.tasks.length > 0 && (
          <CommandSeparator />
        )}

        {results?.tasks && results.tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {results.tasks.slice(0, 5).map((task) => (
              <CommandItem
                key={task.id}
                value={`task-${task.id}`}
                onSelect={() => handleSelect('task', task.id)}
                className="flex items-center gap-3"
              >
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  variant={task.status === 'completed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {task.status}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
