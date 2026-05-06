'use client'

import { useState } from 'react'
import {
  Sparkles,
  BarChart3,
  Kanban,
  Zap,
  Users,
  Layout,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Monitor,
  Database,
  Layers,
  Palette,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AppShell } from '@/components/crm/app-shell'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const SLIDES = [
  {
    id: 'intro',
    title: 'NexusCRM',
    subtitle: 'The Next Generation of Customer Relationship Management',
    content: 'A high-performance platform designed for visibility, intelligence, and speed.',
    icon: Sparkles,
    color: 'text-primary',
  },
  {
    id: 'tech',
    title: 'Modern Architecture',
    subtitle: 'Built for Performance & Scalability',
    items: [
      { icon: Monitor, label: 'Next.js 14 App Router', desc: 'Server-side rendering & optimized routing.' },
      { icon: Palette, label: 'Tailwind & Shadcn/UI', desc: 'Consistent, premium, and accessible design system.' },
      { icon: Layers, label: 'TypeScript Foundation', desc: '100% type-safe codebase for reliability.' },
      { icon: Database, label: 'Context API Hub', desc: 'Seamless state management across modules.' },
    ],
    icon: Zap,
    color: 'text-yellow-500',
  },
  {
    id: 'analytics',
    title: 'Intelligent Analytics',
    subtitle: 'Data-Driven Insights at Your Fingertips',
    content: 'Leveraging Recharts for beautiful, responsive data visualization. Track KPIs, revenue trends, and pipeline health in real-time.',
    icon: BarChart3,
    color: 'text-indigo-500',
  },
  {
    id: 'pipeline',
    title: 'Visual Sales Pipeline',
    subtitle: 'Manage Deals with Precision',
    content: 'Interactive Kanban board with automated value forecasting and deal health tracking. Drag-and-drop workflow to accelerate your sales cycle.',
    icon: Kanban,
    color: 'text-cyan-500',
  },
  {
    id: 'contacts',
    title: 'Lead Management',
    subtitle: 'Nurture Prospects Faster',
    content: 'Centralized lead database with advanced scoring and activity timelines. Never miss a follow-up with intelligent reminders.',
    icon: Users,
    color: 'text-purple-500',
  },
  {
    id: 'automation',
    title: 'AI & Automation',
    subtitle: 'Work Smarter, Not Harder',
    content: 'Automated lead assignment, recurring tasks, and AI-powered insights that suggest the best next steps for your sales reps.',
    icon: Sparkles,
    color: 'text-pink-500',
  },
  {
    id: 'conclusion',
    title: 'Experience NexusCRM',
    subtitle: 'Ready to Transform Your Workflow?',
    content: 'A complete, production-ready solution for modern business needs.',
    icon: Layout,
    color: 'text-green-500',
    final: true,
  },
]

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const slide = SLIDES[currentSlide]

  const next = () => setCurrentSlide(prev => Math.min(prev + 1, SLIDES.length - 1))
  const prev = () => setCurrentSlide(prev => Math.max(prev - 1, 0))

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight">NexusCRM</span>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-muted-foreground uppercase tracking-widest text-[10px]">
            Project Showcase
          </Badge>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Exit to App
            </Button>
          </Link>
        </div>
      </header>

      {/* Slide Content */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-6 max-w-5xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full"
          >
            <div className="flex flex-col items-center text-center space-y-8">
              {/* Icon */}
              <div className={cn(
                "w-20 h-20 rounded-2xl bg-muted flex items-center justify-center p-4",
                slide.color
              )}>
                <slide.icon className="w-full h-full" />
              </div>

              {/* Title group */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                  {slide.title}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                  {slide.subtitle}
                </p>
              </div>

              {/* Content */}
              {slide.content && (
                <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                  {slide.content}
                </p>
              )}

              {/* Grid items for tech slide */}
              {slide.items && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
                  {slide.items.map((item, i) => (
                    <Card key={i} className="border-border/50 bg-card/50 backdrop-blur-sm text-left hover:border-primary/50 transition-colors">
                      <CardHeader className="p-5 flex flex-row items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <CardTitle className="text-base">{item.label}</CardTitle>
                          <CardDescription className="text-xs">{item.desc}</CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}

              {/* Final action */}
              {slide.final && (
                <div className="pt-8">
                  <Link href="/">
                    <Button size="lg" className="h-12 px-8 text-lg font-semibold group">
                      Get Started Now
                      <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation Controls */}
      <footer className="relative z-10 px-8 py-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === currentSlide ? "w-8 bg-primary" : "w-1.5 bg-muted"
              )}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            disabled={currentSlide === 0}
            onClick={prev}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            onClick={next}
            disabled={currentSlide === SLIDES.length - 1}
            className="rounded-full px-6 h-10"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
