'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sparkles,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Zap,
  Building2,
  Receipt,
  MessageSquare,
  Activity,
  BarChart3,
  Calendar,
  CheckSquare,
  FileBarChart,
  HeadphonesIcon,
  Home,
  Kanban,
  TicketCheck,
  UserPlus,
  Users,
  Megaphone,
  GitBranch,
  Package,
  RefreshCw,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { clearStoredAccessToken } from '@/lib/auth'
import { useCRM } from '@/lib/crm-context'
import { GlobalSearch } from './global-search'
import { NotificationCenter } from './notification-center'

type NavItem  = { name: string; href: string; icon: React.ElementType }
type NavGroup = { name: string; icon: React.ElementType; items: NavItem[] }
type NavEntry = { type: 'item'; item: NavItem } | { type: 'group'; group: NavGroup }

const NAV: NavEntry[] = [
  { type: 'item',  item:  { name: 'Home', href: '/', icon: Home } },
  { type: 'group', group: { name: 'Sales', icon: Kanban, items: [
    { name: 'Deals',      href: '/deals',     icon: Kanban    },
    { name: 'Accounts',   href: '/accounts',  icon: Building2 },
    { name: 'Contacts',   href: '/contacts',  icon: Users     },
    { name: 'Leads',      href: '/leads',     icon: UserPlus  },
    { name: 'Quotes',     href: '/quotes',    icon: Receipt   },
    { name: 'Campaigns',  href: '/campaigns', icon: Megaphone },
    { name: 'Products',   href: '/products',  icon: Package   },
  ]}},
  { type: 'group', group: { name: 'Activities', icon: Activity, items: [
    { name: 'Activity Feed',    href: '/activity',         icon: Activity    },
    { name: 'Calendar',         href: '/calendar',         icon: Calendar    },
    { name: 'Tasks',            href: '/tasks',            icon: CheckSquare },
    { name: 'Recurring Tasks',  href: '/recurring-tasks',  icon: RefreshCw   },
  ]}},
  { type: 'group', group: { name: 'Support', icon: HeadphonesIcon, items: [
    { name: 'Tickets', href: '/tickets', icon: TicketCheck },
  ]}},
  { type: 'group', group: { name: 'Analytics', icon: BarChart3, items: [
    { name: 'Reports & Analytics', href: '/analytics', icon: FileBarChart },
  ]}},
  { type: 'group', group: { name: 'Automation', icon: Zap, items: [
    { name: 'Workflows',         href: '/workflows',         icon: Zap       },
    { name: 'Assignment Rules',  href: '/assignment-rules',  icon: GitBranch },
    { name: 'AI Insights',       href: '/insights',          icon: Sparkles  },
  ]}},
]

const DEFAULT_OPEN = new Set(['Sales'])

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const { currentUser } = useCRM()
  const [collapsed,   setCollapsed]   = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [isDarkMode,  setIsDarkMode]  = useState(false)

  // Find which group contains the active route, fall back to 'Sales'
  const activeGroup = NAV.find(e =>
    e.type === 'group' && e.group.items.some(i => i.href === pathname)
  )
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set([(activeGroup?.type === 'group' && activeGroup.group.name) || 'Sales'])
  )

  const toggleGroup = (name: string) =>
    setOpenGroups(prev => {
      if (prev.has(name)) {
        // clicking open group → close it
        const n = new Set(prev); n.delete(name); return n
      } else {
        // clicking closed group → open only this one, close all others
        return new Set([name])
      }
    })

  const toggleTheme = () => {
    setIsDarkMode(m => !m)
    document.documentElement.classList.toggle('dark', !isDarkMode)
  }

  const handleLogout = () => {
    clearStoredAccessToken()
    window.location.assign('/login')
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden bg-background">

        {/* ── Sidebar ── */}
        <aside className={cn(
          'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 select-none',
          collapsed ? 'w-16' : 'w-60'
        )}>

          {/* Logo row */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-3">
            {collapsed ? (
              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary">
                    <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="truncate text-sm font-semibold text-sidebar-foreground">CRM Pro</span>
                </div>
                <button
                  onClick={() => setCollapsed(true)}
                  className="ml-1 shrink-0 rounded p-1 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Search */}
          {!collapsed && (
            <div className="shrink-0 px-3 pt-3 pb-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-1.5 text-xs text-sidebar-foreground/50 hover:bg-sidebar-accent transition-colors"
              >
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span>Search</span>
              </button>
            </div>
          )}

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-0.5">
            {NAV.map(entry => {
              if (entry.type === 'item') {
                const { item } = entry
                const active = pathname === item.href
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <Link href={item.href} className={cn(
                        'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                        active ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                        collapsed && 'justify-center px-2'
                      )}>
                        <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-sidebar-primary')} />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">{item.name}</TooltipContent>}
                  </Tooltip>
                )
              }

              const { group } = entry
              const isOpen    = collapsed || openGroups.has(group.name)
              const hasActive = group.items.some(i => i.href === pathname)

              return (
                <div key={group.name}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => !collapsed && toggleGroup(group.name)}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                          hasActive ? 'text-sidebar-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                          collapsed && 'justify-center px-2'
                        )}
                      >
                        <group.icon className={cn('h-4 w-4 shrink-0', hasActive && 'text-sidebar-primary')} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate text-left">{group.name}</span>
                            <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40 transition-transform duration-200', isOpen && 'rotate-180')} />
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    {collapsed && <TooltipContent side="right">{group.name}</TooltipContent>}
                  </Tooltip>

                  {/* Expanded sub-items */}
                  {!collapsed && isOpen && (
                    <div className="mt-0.5 ml-3 pl-3 border-l border-sidebar-border/60 space-y-0.5">
                      {group.items.map(item => {
                        const active = pathname === item.href
                        return (
                          <Link key={item.name} href={item.href} className={cn(
                            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                            active ? 'bg-sidebar-accent text-sidebar-primary font-medium' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                          )}>
                            <item.icon className={cn('h-3.5 w-3.5 shrink-0', active && 'text-sidebar-primary')} />
                            <span className="truncate">{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}

                  {/* Collapsed: flat icon list */}
                  {collapsed && (
                    <div className="mt-0.5 space-y-0.5">
                      {group.items.map(item => {
                        const active = pathname === item.href
                        return (
                          <Tooltip key={item.name}>
                            <TooltipTrigger asChild>
                              <Link href={item.href} className={cn(
                                'flex items-center justify-center rounded-md p-2 transition-colors',
                                active ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                              )}>
                                <item.icon className="h-4 w-4 shrink-0" />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.name}</TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* ── Bottom bar ── */}
          <div className="shrink-0 border-t border-sidebar-border">
            {/* User */}
            <div className={cn('flex items-center gap-2.5 px-3 py-2.5', collapsed && 'justify-center')}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2.5 cursor-pointer min-w-0">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
                      <AvatarFallback className="text-xs">
                        {currentUser?.name?.split(' ').map((n: string) => n[0]).join('') ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {!collapsed && currentUser && (
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-sidebar-foreground truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-sidebar-foreground/50 truncate">{currentUser.email}</p>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                {collapsed && currentUser && (
                  <TooltipContent side="right">
                    <p className="font-medium">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>

            {/* Icon strip */}
            <div className={cn(
              'flex items-center border-t border-sidebar-border/60 px-2 py-1.5 gap-1',
              collapsed ? 'flex-col justify-center' : 'justify-between'
            )}>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="rounded p-1.5 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={collapsed ? 'right' : 'top'}>Chats</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="rounded p-1.5 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
                      <Settings className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={collapsed ? 'right' : 'top'}>Settings</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleLogout}
                      className="rounded p-1.5 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={collapsed ? 'right' : 'top'}>Log out</TooltipContent>
                </Tooltip>
              </div>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setCollapsed(false)}
                      className="rounded p-1.5 text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Expand</TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-[10px] text-sidebar-foreground/30 pr-1">v2.0</span>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-5">
            <div />
            <div className="flex items-center gap-1">
              <NotificationCenter />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
                    {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isDarkMode ? 'Light mode' : 'Dark mode'}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSearchOpen(true)}>
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search (Ctrl K)</TooltipContent>
              </Tooltip>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </div>
    </TooltipProvider>
  )
}
