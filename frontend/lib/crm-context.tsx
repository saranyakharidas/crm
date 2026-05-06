'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type {
  Contact,
  Lead,
  Deal,
  Ticket,
  Task,
  CalendarEvent,
  AIInsight,
  DealStage,
} from './types'
import {
  contacts as initialContacts,
  leads as initialLeads,
  deals as initialDeals,
  tickets as initialTickets,
  tasks as initialTasks,
  calendarEvents as initialEvents,
  aiInsights as initialInsights,
  currentUser,
  teamMembers,
  dashboardStats,
} from './mock-data'
import { getStoredAccessToken } from './auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000'

interface CRMContextType {
  // Data
  contacts: Contact[]
  leads: Lead[]
  deals: Deal[]
  tickets: Ticket[]
  tasks: Task[]
  events: CalendarEvent[]
  teamMembers: typeof teamMembers
  dashboardStats: typeof dashboardStats

  // Contact Actions
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  deleteContact: (id: string) => void

  // Lead Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void
  updateLead: (id: string, updates: Partial<Lead>) => void
  deleteLead: (id: string) => void
  convertLeadToContact: (leadId: string) => void

  // Deal Actions
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'activities'>) => void
  updateDeal: (id: string, updates: Partial<Deal>) => void
  deleteDeal: (id: string) => void
  moveDealStage: (dealId: string, newStage: DealStage) => void

  // Ticket Actions
  addTicket: (ticket: any) => Promise<void>
  updateTicket: (id: string, updates: any) => Promise<void>
  deleteTicket: (id: string) => Promise<void>

  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskComplete: (id: string) => void

  // Event Actions
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void

  // Search
  searchAll: (query: string) => SearchResults

  currentUser: typeof currentUser
}

interface SearchResults {
  contacts: Contact[]
  leads: Lead[]
  deals: Deal[]
  tickets: Ticket[]
  tasks: Task[]
}

const CRMContext = createContext<CRMContextType | undefined>(undefined)

export function CRMProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts)
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [insights] = useState<AIInsight[]>(initialInsights)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate unique ID
  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // API helper
  const apiRequest = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = getStoredAccessToken()
    if (!token) return null

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) return null
    if (response.status === 204) return null
    return response.json()
  }, [])

  const refreshTickets = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiRequest('/tickets')
      if (data) setTickets(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [apiRequest])

  useEffect(() => {
    void refreshTickets()
  }, [refreshTickets])

  // Contact Actions
  const addContact = useCallback((contact: Omit<Contact, 'id' | 'createdAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: generateId('contact'),
      createdAt: new Date().toISOString(),
    }
    setContacts(prev => [newContact, ...prev])
  }, [])

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])

  const deleteContact = useCallback((id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id))
  }, [])

  // Lead Actions
  const addLead = useCallback((lead: Omit<Lead, 'id' | 'createdAt'>) => {
    const newLead: Lead = {
      ...lead,
      id: generateId('lead'),
      createdAt: new Date().toISOString(),
    }
    setLeads(prev => [newLead, ...prev])
  }, [])

  const updateLead = useCallback((id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }, [])

  const deleteLead = useCallback((id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id))
  }, [])

  const convertLeadToContact = useCallback((leadId: string) => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    const nameParts = lead.name.split(' ')
    const newContact: Contact = {
      id: generateId('contact'),
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      position: '',
      tags: [lead.source],
      notes: lead.notes,
      createdAt: new Date().toISOString(),
      lastContactedAt: new Date().toISOString(),
      status: 'active',
    }

    setContacts(prev => [newContact, ...prev])
    setLeads(prev => prev.filter(l => l.id !== leadId))
  }, [leads])

  // Deal Actions
  const addDeal = useCallback((deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'activities'>) => {
    const now = new Date().toISOString()
    const newDeal: Deal = {
      ...deal,
      id: generateId('deal'),
      activities: [],
      createdAt: now,
      updatedAt: now,
    }
    setDeals(prev => [newDeal, ...prev])
  }, [])

  const updateDeal = useCallback((id: string, updates: Partial<Deal>) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d))
  }, [])

  const deleteDeal = useCallback((id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id))
  }, [])

  const moveDealStage = useCallback((dealId: string, newStage: DealStage) => {
    const probabilityMap: Record<DealStage, number> = {
      'lead': 10,
      'qualified': 25,
      'proposal': 50,
      'negotiation': 75,
      'closed-won': 100,
      'closed-lost': 0,
    }

    setDeals(prev => prev.map(d => {
      if (d.id === dealId) {
        return {
          ...d,
          stage: newStage,
          probability: probabilityMap[newStage],
          updatedAt: new Date().toISOString(),
          ...(newStage === 'closed-won' || newStage === 'closed-lost' 
            ? { actualCloseDate: new Date().toISOString() }
            : {}
          ),
        }
      }
      return d
    }))
  }, [])

  // Ticket Actions
  const addTicket = useCallback(async (ticket: any) => {
    try {
      const data = await apiRequest('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticket),
      })
      if (data) setTickets(prev => [data, ...prev])
    } catch (err: any) {
      setError(err.message)
    }
  }, [apiRequest])

  const updateTicket = useCallback(async (id: string, updates: any) => {
    try {
      const data = await apiRequest(`/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      if (data) setTickets(prev => prev.map(t => t.id === id ? data : t))
    } catch (err: any) {
      setError(err.message)
    }
  }, [apiRequest])

  const deleteTicket = useCallback(async (id: string) => {
    try {
      await apiRequest(`/tickets/${id}`, { method: 'DELETE' })
      setTickets(prev => prev.filter(t => t.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }, [apiRequest])

  // Task Actions
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: generateId('task'),
      createdAt: new Date().toISOString(),
    }
    setTasks(prev => [newTask, ...prev])
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const toggleTaskComplete = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newStatus = t.status === 'completed' ? 'pending' : 'completed'
        return { ...t, status: newStatus }
      }
      return t
    }))
  }, [])

  // Event Actions
  const addEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: generateId('event'),
    }
    setEvents(prev => [newEvent, ...prev])
  }, [])

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  // Search
  const searchAll = useCallback((query: string): SearchResults => {
    const q = query.toLowerCase()
    
    return {
      contacts: contacts.filter(c => 
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
      ),
      leads: leads.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q)
      ),
      deals: deals.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.contact.company.toLowerCase().includes(q)
      ),
      tickets: tickets.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      ),
      tasks: tasks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      ),
    }
  }, [contacts, leads, deals, tickets, tasks])

  const value: CRMContextType = {
    contacts,
    leads,
    deals,
    tickets,
    tasks,
    events,
    teamMembers,
    dashboardStats,
    addContact,
    updateContact,
    deleteContact,
    addLead,
    updateLead,
    deleteLead,
    convertLeadToContact,
    addDeal,
    updateDeal,
    deleteDeal,
    moveDealStage,
    addTicket,
    updateTicket,
    deleteTicket,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    addEvent,
    updateEvent,
    deleteEvent,
    searchAll,
    currentUser,
  }

  return <CRMContext.Provider value={value}>{children}</CRMContext.Provider>
}

export function useCRM() {
  const context = useContext(CRMContext)
  if (context === undefined) {
    throw new Error('useCRM must be used within a CRMProvider')
  }
  return context
}
