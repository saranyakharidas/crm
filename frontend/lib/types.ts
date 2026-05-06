// CRM Core Types

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  position: string
  avatar?: string
  tags: string[]
  notes: string
  createdAt: string
  lastContactedAt: string
  status: 'active' | 'inactive'
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  source: 'website' | 'referral' | 'linkedin' | 'cold-call' | 'event' | 'other'
  status: 'new' | 'contacted' | 'qualified' | 'unqualified'
  score: number // AI-powered lead score 0-100
  assignedTo: string
  notes: string
  createdAt: string
  lastActivityAt: string
}

export interface Deal {
  id: string
  title: string
  value: number
  currency: string
  stage: DealStage
  probability: number
  contactId: string
  contact: Contact
  expectedCloseDate: string
  actualCloseDate?: string
  notes: string
  activities: Activity[]
  createdAt: string
  updatedAt: string
}

export type DealStage = 
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed-won'
  | 'closed-lost'

export interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  title: string
  description: string
  date: string
  completed: boolean
  relatedTo: {
    type: 'contact' | 'lead' | 'deal' | 'ticket'
    id: string
  }
  createdBy: string
}

export interface Ticket {
  id: string
  subject: string
  description: string
  status: 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: 'billing' | 'technical' | 'general' | 'feature-request' | 'bug'
  contactId: string
  contact: Contact
  assignedTo: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  messages: TicketMessage[]
}

export interface TicketMessage {
  id: string
  content: string
  sender: 'customer' | 'agent'
  senderName: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed'
  relatedTo?: {
    type: 'contact' | 'lead' | 'deal' | 'ticket'
    id: string
    name: string
  }
  assignedTo: string
  createdAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  start: string
  end: string
  type: 'meeting' | 'call' | 'task' | 'reminder'
  attendees: string[]
  relatedTo?: {
    type: 'contact' | 'lead' | 'deal' | 'ticket'
    id: string
  }
}

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: 'admin' | 'sales' | 'support' | 'manager'
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  link?: string
}

export interface AIInsight {
  id: string
  type: 'lead-score' | 'deal-prediction' | 'churn-risk' | 'recommendation'
  title: string
  description: string
  confidence: number
  relatedTo: {
    type: 'contact' | 'lead' | 'deal'
    id: string
    name: string
  }
  suggestedAction?: string
  createdAt: string
}

// Dashboard Stats
export interface DashboardStats {
  totalRevenue: number
  revenueChange: number
  totalDeals: number
  dealsChange: number
  newLeads: number
  leadsChange: number
  openTickets: number
  ticketsChange: number
  conversionRate: number
  conversionChange: number
  avgDealSize: number
  avgDealSizeChange: number
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}
