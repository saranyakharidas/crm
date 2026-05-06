"use client"

import { useState, useMemo } from "react"
import { useCRM } from "@/lib/crm-context"
import { Task } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  Filter,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Trash2,
  Star,
  Target,
  ListTodo,
} from "lucide-react"
import { toast } from "sonner"

const priorityConfig: Record<Task["priority"], { color: string; icon: React.ReactNode }> = {
  low: { color: "text-slate-500", icon: <ArrowDown className="h-4 w-4" /> },
  medium: { color: "text-blue-500", icon: <ArrowRight className="h-4 w-4" /> },
  high: { color: "text-orange-500", icon: <ArrowUp className="h-4 w-4" /> },
  urgent: { color: "text-red-500", icon: <AlertCircle className="h-4 w-4" /> },
}

const statusConfig: Record<Task["status"], { color: string; label: string }> = {
  todo: { color: "bg-slate-500/10 text-slate-500 border-slate-500/20", label: "To Do" },
  in_progress: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "In Progress" },
  completed: { color: "bg-green-500/10 text-green-500 border-green-500/20", label: "Completed" },
  cancelled: { color: "bg-red-500/10 text-red-500 border-red-500/20", label: "Cancelled" },
}

export function TasksView() {
  const { tasks, addTask, updateTask, deleteTask, contacts, deals } = useCRM()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === "all" || task.status === statusFilter
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

      if (activeTab === "today") {
        const today = new Date()
        const dueDate = new Date(task.dueDate)
        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          dueDate.toDateString() === today.toDateString()
        )
      }
      if (activeTab === "overdue") {
        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          new Date(task.dueDate) < new Date() &&
          task.status !== "completed" &&
          task.status !== "cancelled"
        )
      }
      if (activeTab === "upcoming") {
        const nextWeek = new Date()
        nextWeek.setDate(nextWeek.getDate() + 7)
        return (
          matchesSearch &&
          matchesStatus &&
          matchesPriority &&
          new Date(task.dueDate) > new Date() &&
          new Date(task.dueDate) <= nextWeek
        )
      }

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tasks, search, statusFilter, priorityFilter, activeTab])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === "completed").length
    const overdue = tasks.filter(
      (t) => new Date(t.dueDate) < new Date() && t.status !== "completed" && t.status !== "cancelled"
    ).length
    const dueToday = tasks.filter((t) => {
      const today = new Date()
      const dueDate = new Date(t.dueDate)
      return dueDate.toDateString() === today.toDateString() && t.status !== "completed"
    }).length

    return { total, completed, overdue, dueToday, completionRate: Math.round((completed / total) * 100) || 0 }
  }, [tasks])

  const handleAddTask = (formData: FormData) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      status: "todo",
      priority: formData.get("priority") as Task["priority"],
      dueDate: formData.get("dueDate") as string,
      assignedTo: "current-user",
      relatedTo: formData.get("relatedTo") as string || undefined,
      relatedType: formData.get("relatedType") as "contact" | "deal" | undefined,
      createdAt: new Date().toISOString(),
    }
    addTask(newTask)
    setIsAddDialogOpen(false)
    toast.success("Task created successfully")
  }

  const handleToggleComplete = (task: Task) => {
    const newStatus = task.status === "completed" ? "todo" : "completed"
    updateTask({ ...task, status: newStatus })
    toast.success(newStatus === "completed" ? "Task completed!" : "Task reopened")
  }

  const handleDeleteTask = (id: string) => {
    deleteTask(id)
    toast.success("Task deleted")
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) return "Today"
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow"
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Manage your tasks and stay organized
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription className="sr-only">Fill out the form to create a new task.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAddTask(new FormData(e.currentTarget))
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" name="title" required placeholder="Task title" />
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
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input id="dueDate" name="dueDate" type="date" required />
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
                      {contacts.slice(0, 10).map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Task details..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Task</Button>
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
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <ListTodo className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Today</p>
                <p className="text-2xl font-bold">{stats.dueToday}</p>
              </div>
              <div className="rounded-full bg-yellow-500/10 p-3">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stats.overdue > 0 ? "border-red-500/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-sm font-semibold">{stats.completionRate}%</p>
              </div>
              <Progress value={stats.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="overdue" className={stats.overdue > 0 ? "text-red-500" : ""}>
              Overdue {stats.overdue > 0 && `(${stats.overdue})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32">
              <Filter className="mr-2 h-4 w-4" />
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

      {/* Task List */}
      <div className="flex flex-col gap-2">
        {filteredTasks.map((task) => (
          <Card
            key={task.id}
            className={`transition-all ${
              task.status === "completed" ? "opacity-60" : ""
            } ${isOverdue(task.dueDate) && task.status !== "completed" ? "border-red-500/50" : ""}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={task.status === "completed"}
                  onCheckedChange={() => handleToggleComplete(task)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-medium ${
                            task.status === "completed" ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                        <span className={priorityConfig[task.priority]?.color ?? 'text-slate-500'}>
                          {priorityConfig[task.priority]?.icon ?? <ArrowRight className="h-4 w-4" />}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isOverdue(task.dueDate) && task.status !== "completed"
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : ""
                          }`}
                        >
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDueDate(task.dueDate)}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${statusConfig[task.status]?.color ?? ''}`}>
                          {statusConfig[task.status]?.label ?? task.status}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleToggleComplete(task)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {task.status === "completed" ? "Reopen" : "Complete"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateTask({ ...task, status: "in_progress" })}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {activeTab === "overdue"
              ? "No overdue tasks"
              : activeTab === "today"
              ? "No tasks due today"
              : "No tasks found"}
          </h3>
          <p className="text-muted-foreground">
            {activeTab === "overdue"
              ? "Great job staying on top of your tasks!"
              : "Create a new task to get started"}
          </p>
        </div>
      )}
    </div>
  )
}