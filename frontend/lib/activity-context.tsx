'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────
export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'task'
  | 'deal_stage'
  | 'deal_created'
  | 'contact_created'
  | 'document'
  | 'whatsapp'

export interface Activity {
  id:          string
  type:        ActivityType
  title:       string
  description: string
  outcome?:    string          // e.g. "Positive", "No answer", "Follow-up needed"
  duration?:   number          // minutes (for calls/meetings)
  // Association — activity can belong to a contact, a deal, or both
  contactId?:  string
  contactName?:string
  dealId?:     string
  dealTitle?:  string
  createdBy:   string
  createdAt:   string
  scheduledAt?:string          // for future tasks/meetings
  completed:   boolean
}

// ─── Seed factory ──────────────────────────────────────────────────────────────
const d = (daysAgo: number, hoursAgo = 0) =>
  new Date(Date.now() - daysAgo * 86_400_000 - hoursAgo * 3_600_000).toISOString()

function seed(overrides: Partial<Activity> & Pick<Activity, 'type' | 'title' | 'description' | 'createdAt'>): Activity {
  return {
    id:        `act-${Math.random().toString(36).slice(2, 9)}`,
    completed: true,
    createdBy: 'Sarah Johnson',
    outcome:   undefined,
    duration:  undefined,
    ...overrides,
  }
}

// Seed activities for contact "c1" and deal "d1" — these IDs should align with
// whatever contacts/deals exist in the CRM mock data. We key by company name
// as well so the timeline can match by contactId OR by name.
export const SEED_ACTIVITIES: Activity[] = [
  seed({ type: 'contact_created', title: 'Contact created', description: 'Added to CRM from web form submission.', createdAt: d(60), contactId: 'contact-1', contactName: 'James Miller' }),
  seed({ type: 'email', title: 'Intro email sent', description: 'Sent welcome email introducing CRM Pro and scheduling a discovery call.', createdAt: d(55), contactId: 'contact-1', contactName: 'James Miller', completed: true }),
  seed({ type: 'call', title: 'Discovery call', description: 'Discussed pain points around their current CRM. Strong interest in pipeline automation.', outcome: 'Positive', duration: 35, createdAt: d(50), contactId: 'contact-1', contactName: 'James Miller' }),
  seed({ type: 'deal_created', title: 'Deal created', description: 'Acme Corp — Enterprise deal added to pipeline at Lead stage.', createdAt: d(48), contactId: 'contact-1', contactName: 'James Miller', dealId: 'deal-1', dealTitle: 'Acme Corp — Enterprise' }),
  seed({ type: 'meeting', title: 'Product demo', description: 'Walkthrough of the dashboard, deal pipeline, and automation features. Decision maker attended.', outcome: 'Follow-up needed', duration: 60, createdAt: d(40), contactId: 'contact-1', contactName: 'James Miller', dealId: 'deal-1', dealTitle: 'Acme Corp — Enterprise' }),
  seed({ type: 'email', title: 'Proposal sent', description: 'Sent full proposal deck and quote QUO-2025-0001 for the enterprise tier.', createdAt: d(30), contactId: 'contact-1', contactName: 'James Miller', dealId: 'deal-1', dealTitle: 'Acme Corp — Enterprise' }),
  seed({ type: 'deal_stage', title: 'Stage moved → Proposal', description: 'Deal advanced from Qualified to Proposal after positive demo feedback.', createdAt: d(29), dealId: 'deal-1', dealTitle: 'Acme Corp — Enterprise' }),
  seed({ type: 'call', title: 'Pricing negotiation call', description: 'James requested a 10% discount for 2-year commitment. Agreed to check with management.', outcome: 'Positive', duration: 25, createdAt: d(20), contactId: 'contact-1', contactName: 'James Miller', dealId: 'deal-1', dealTitle: 'Acme Corp — Enterprise' }),
  seed({ type: 'note', title: 'Internal note', description: 'Management approved 10% discount for 2yr commitment. Need to send revised quote.', createdAt: d(19), dealId: 'deal-1', dealTitle: 'Acme Corp — Enterprise', createdBy: 'Michael Chen' }),
  seed({ type: 'deal_stage', title: 'Stage moved → Negotiation', description: 'Moved to Negotiation after discount was approved.', createdAt: d(18), dealId: 'deal-1', dealTitle: 'Acme Corp — Enterprise' }),
  seed({ type: 'document', title: 'Revised quote sent', description: 'Sent updated quote QUO-2025-0001 with 10% annual commitment discount applied.', createdAt: d(17), contactId: 'contact-1', contactName: 'James Miller', dealId: 'deal-1', dealTitle: 'Acme Corp — Enterprise' }),
  seed({ type: 'email', title: 'Contract accepted', description: 'James confirmed acceptance over email. Contract signed via DocuSign.', createdAt: d(8), contactId: 'contact-1', contactName: 'James Miller', dealId: 'deal-1', dealTitle: 'Acme Corp — Enterprise' }),
  seed({ type: 'deal_stage', title: 'Stage moved → Closed Won', description: 'Deal closed! Contract signed and payment received.', createdAt: d(8), dealId: 'deal-1', dealTitle: 'Acme Corp — Enterprise' }),

  // Activities for a second contact
  seed({ type: 'contact_created', title: 'Contact created', description: 'Added manually after LinkedIn outreach.', createdAt: d(45), contactId: 'contact-2', contactName: 'Laura Chen', createdBy: 'Michael Chen' }),
  seed({ type: 'email', title: 'Cold outreach', description: 'Initial LinkedIn InMail + follow-up email about Globex\'s expansion plans.', createdAt: d(42), contactId: 'contact-2', contactName: 'Laura Chen', createdBy: 'Michael Chen' }),
  seed({ type: 'call', title: 'Qualification call', description: 'Laura confirmed budget authority. Looking for 50 seat licence. Timeline Q3.', outcome: 'Qualified', duration: 20, createdAt: d(38), contactId: 'contact-2', contactName: 'Laura Chen', createdBy: 'Michael Chen' }),
  seed({ type: 'meeting', title: 'Technical review', description: 'IT team joined to assess API requirements and SSO integration.', outcome: 'Positive', duration: 90, createdAt: d(20), contactId: 'contact-2', contactName: 'Laura Chen', createdBy: 'Michael Chen' }),
  seed({ type: 'note', title: 'Follow-up required', description: 'IT team needs 2 weeks to review security compliance docs. Check back on Monday.', createdAt: d(18), contactId: 'contact-2', contactName: 'Laura Chen', createdBy: 'Michael Chen' }),
  seed({ type: 'whatsapp', title: 'WhatsApp check-in', description: 'Quick message to confirm they received the security docs. Laura replied positively.', createdAt: d(5), contactId: 'contact-2', contactName: 'Laura Chen', createdBy: 'Michael Chen' }),
]

// ─── Context ───────────────────────────────────────────────────────────────────
interface ActivityContextValue {
  activities:   Activity[]
  addActivity:  (a: Omit<Activity, 'id' | 'createdAt'>) => void
  deleteActivity:(id: string) => void
  getActivitiesForContact: (contactId: string, contactName?: string) => Activity[]
  getActivitiesForDeal:    (dealId: string, dealTitle?: string) => Activity[]
}

const ActivityContext = createContext<ActivityContextValue | null>(null)

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>(SEED_ACTIVITIES)

  const addActivity = useCallback((a: Omit<Activity, 'id' | 'createdAt'>) => {
    const newAct: Activity = {
      ...a,
      id:        `act-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setActivities(prev => [newAct, ...prev])
  }, [])

  const deleteActivity = useCallback((id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id))
  }, [])

  const getActivitiesForContact = useCallback((contactId: string, contactName?: string) => {
    return activities
      .filter(a =>
        a.contactId === contactId ||
        (contactName && a.contactName?.toLowerCase() === contactName.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [activities])

  const getActivitiesForDeal = useCallback((dealId: string, dealTitle?: string) => {
    return activities
      .filter(a =>
        a.dealId === dealId ||
        (dealTitle && a.dealTitle?.toLowerCase() === dealTitle.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [activities])

  return (
    <ActivityContext.Provider value={{
      activities, addActivity, deleteActivity,
      getActivitiesForContact, getActivitiesForDeal,
    }}>
      {children}
    </ActivityContext.Provider>
  )
}

export function useActivities() {
  const ctx = useContext(ActivityContext)
  if (!ctx) throw new Error('useActivities must be used inside ActivityProvider')
  return ctx
}