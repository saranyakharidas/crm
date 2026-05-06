"use client"

import { useState, useMemo } from "react"
import { useCRM } from "@/lib/crm-context"
import { CalendarEvent } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Clock,
  Phone,
  Mail,
  Video,
  Calendar as CalendarIcon,
  CheckSquare,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"

const eventTypeConfig: Record<CalendarEvent["type"], { icon: React.ReactNode; color: string }> = {
  call: { icon: <Phone className="h-4 w-4" />, color: "bg-blue-500" },
  meeting: { icon: <Video className="h-4 w-4" />, color: "bg-purple-500" },
  demo: { icon: <Users className="h-4 w-4" />, color: "bg-green-500" },
  follow_up: { icon: <CalendarIcon className="h-4 w-4" />, color: "bg-orange-500" },
  other: { icon: <CalendarIcon className="h-4 w-4" />, color: "bg-slate-500" },
}

export function CalendarView() {
  const { events, addEvent, contacts, deals } = useCRM()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")

  const monthActivities = useMemo(() => {
    if (!events) return []
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    return events.filter((event) => {
      const date = new Date(event.start)
      return date.getFullYear() === year && date.getMonth() === month
    })
  }, [events, currentMonth])

  const selectedDateActivities = useMemo(() => {
    if (!events) return []
    return events.filter((event) => {
      const eventDate = new Date(event.start)
      return (
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate()
      )
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [events, selectedDate])

  const upcomingActivities = useMemo(() => {
    if (!events) return []
    const now = new Date()
    return events
      .filter((event) => new Date(event.start) >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5)
  }, [events])

  const activityDates = useMemo(() => {
    return new Set(
      monthActivities.map((event) => {
        const date = new Date(event.start)
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      })
    )
  }, [monthActivities])

  const handleAddEvent = (formData: FormData) => {
    const dateStr = formData.get("date") as string
    const timeStr = formData.get("time") as string
    const startTime = new Date(`${dateStr}T${timeStr}`)
    const duration = parseInt(formData.get("duration") as string) || 30
    const endTime = new Date(startTime.getTime() + duration * 60000)

    const newEvent: Omit<CalendarEvent, 'id'> = {
      title: formData.get("title") as string,
      type: formData.get("type") as CalendarEvent["type"],
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      description: formData.get("description") as string || undefined,
      attendees: [],
      location: undefined,
    }
    addEvent(newEvent)
    setIsAddDialogOpen(false)
    toast.success("Event scheduled")
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev)
      if (direction === "prev") {
        newMonth.setMonth(newMonth.getMonth() - 1)
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1)
      }
      return newMonth
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Schedule and manage your activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Activity</DialogTitle>
                <DialogDescription className="sr-only">Fill out the form to schedule a new activity.</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleAddEvent(new FormData(e.currentTarget))
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" required placeholder="Activity title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" defaultValue="meeting">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="demo">Demo</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="duration">Duration (min)</Label>
                    <Input id="duration" name="duration" type="number" defaultValue={30} min={5} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      required
                      defaultValue={selectedDate.toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="time">Time *</Label>
                    <Input id="time" name="time" type="time" required defaultValue="09:00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="relatedType">Related To</Label>
                    <Select name="relatedType">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="deal">Deal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="relatedTo">Select</Label>
                    <Select name="relatedTo">
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(contacts || []).slice(0, 10).map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Activity details..." />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Schedule</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentMonth(new Date())
                      setSelectedDate(new Date())
                    }}
                  >
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="w-full"
                modifiers={{
                  hasActivity: (date) =>
                    activityDates.has(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`),
                }}
                modifiersStyles={{
                  hasActivity: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                    textDecorationColor: "hsl(var(--primary))",
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Date Activities */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {formatDate(selectedDate)}
                {isToday(selectedDate) && (
                  <Badge variant="secondary">Today</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateActivities.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {selectedDateActivities.map((event) => {
                    const config = eventTypeConfig[event.type] || eventTypeConfig.other
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className={`p-2 rounded-lg text-white ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{event.title}</p>
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {event.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(event.start)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No activities scheduled for this day</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    Add an activity
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{monthActivities.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {monthActivities.filter((e) => e.type === "demo").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Demos</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {monthActivities.filter((e) => e.type === "meeting").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Meetings</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {monthActivities.filter((e) => e.type === "call").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Calls</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Activities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingActivities.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {upcomingActivities.map((event) => {
                    const config = eventTypeConfig[event.type] || eventTypeConfig.other
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedDate(new Date(event.start))}
                      >
                        <div className={`p-1.5 rounded text-white ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.start).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })} at {formatTime(event.start)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No upcoming events
                </p>
              )}
            </CardContent>
          </Card>

          {/* Event Types Legend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Event Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {Object.entries(eventTypeConfig).map(([type, config]) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`p-1.5 rounded text-white ${config.color}`}>
                      {config.icon}
                    </div>
                    <span className="capitalize text-sm">{type.replace('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {monthActivities.filter((e) => e.type === type).length}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
