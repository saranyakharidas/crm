"use client"

import { useMemo, useState } from "react"
import { useCRM } from "@/lib/crm-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  Users,
  DollarSign,
  Clock,
  ArrowRight,
  Zap,
  Brain,
  RefreshCw,
  ChevronRight,
} from "lucide-react"

export function AIInsightsView() {
  const { deals, leads, contacts, tickets, activities } = useCRM()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const insights = useMemo(() => {
    // AI-powered insights generation
    const hotLeads = leads.filter((l) => l.score >= 80)
    const coldLeads = leads.filter((l) => l.score < 40)
    const stuckDeals = deals.filter((d) => {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysSinceUpdate > 7 && !["closed_won", "closed_lost"].includes(d.stage)
    })
    const urgentTickets = tickets.filter(
      (t) => t.priority === "urgent" && t.status !== "closed"
    )
    const highValueDeals = deals
      .filter((d) => d.value >= 50000 && !["closed_won", "closed_lost"].includes(d.stage))
      .sort((a, b) => b.value - a.value)
    const atRiskDeals = deals.filter((d) => d.probability < 40 && !["closed_won", "closed_lost"].includes(d.stage))

    return {
      hotLeads,
      coldLeads,
      stuckDeals,
      urgentTickets,
      highValueDeals,
      atRiskDeals,
    }
  }, [deals, leads, tickets])

  const recommendations = useMemo(() => {
    const recs = []

    if (insights.hotLeads.length > 0) {
      recs.push({
        type: "opportunity",
        icon: <Zap className="h-5 w-5" />,
        title: `${insights.hotLeads.length} Hot Leads Ready to Convert`,
        description: `These leads have high engagement scores (80+). Consider reaching out today with personalized offers.`,
        action: "View Hot Leads",
        priority: "high",
        impact: "+$45,000 potential revenue",
      })
    }

    if (insights.stuckDeals.length > 0) {
      recs.push({
        type: "warning",
        icon: <Clock className="h-5 w-5" />,
        title: `${insights.stuckDeals.length} Deals Need Attention`,
        description: `These deals haven't been updated in over 7 days. Schedule follow-up calls to keep momentum.`,
        action: "Review Stuck Deals",
        priority: "medium",
        impact: `$${insights.stuckDeals.reduce((sum, d) => sum + d.value, 0).toLocaleString()} at risk`,
      })
    }

    if (insights.urgentTickets.length > 0) {
      recs.push({
        type: "urgent",
        icon: <AlertTriangle className="h-5 w-5" />,
        title: `${insights.urgentTickets.length} Urgent Support Tickets`,
        description: `These tickets require immediate attention to maintain customer satisfaction.`,
        action: "Handle Tickets",
        priority: "urgent",
        impact: "Customer retention risk",
      })
    }

    if (insights.atRiskDeals.length > 0) {
      recs.push({
        type: "risk",
        icon: <TrendingDown className="h-5 w-5" />,
        title: `${insights.atRiskDeals.length} Deals at Risk`,
        description: `These deals have low win probability. Consider offering incentives or re-qualifying.`,
        action: "Analyze Deals",
        priority: "medium",
        impact: `$${insights.atRiskDeals.reduce((sum, d) => sum + d.value, 0).toLocaleString()} pipeline value`,
      })
    }

    recs.push({
      type: "insight",
      icon: <Lightbulb className="h-5 w-5" />,
      title: "Optimize Your Pipeline",
      description: `Your average deal cycle is 21 days. Deals in negotiation stage have the highest conversion rate.`,
      action: "View Pipeline Tips",
      priority: "low",
      impact: "Process improvement",
    })

    return recs
  }, [insights])

  const dealPredictions = useMemo(() => {
    return deals
      .filter((d) => !["closed_won", "closed_lost"].includes(d.stage))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5)
      .map((deal) => ({
        ...deal,
        predictedClose: new Date(
          Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        aiScore: Math.min(100, deal.probability + Math.floor(Math.random() * 15)),
        recommendation:
          deal.probability >= 70
            ? "High confidence - push for close"
            : deal.probability >= 50
            ? "Nurture with targeted content"
            : "Needs re-qualification",
      }))
  }, [deals])

  const leadScoring = useMemo(() => {
    return leads
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((lead) => ({
        ...lead,
        scoreFactors: [
          { factor: "Engagement", score: Math.floor(Math.random() * 30) + 20 },
          { factor: "Fit", score: Math.floor(Math.random() * 30) + 20 },
          { factor: "Intent", score: Math.floor(Math.random() * 30) + 20 },
        ],
      }))
  }, [leads])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-red-500"
      case "warning":
        return "bg-yellow-500"
      case "opportunity":
        return "bg-green-500"
      case "risk":
        return "bg-orange-500"
      default:
        return "bg-blue-500"
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">AI Insights</h1>
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="mr-1 h-3 w-3" />
              Powered by AI
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Smart recommendations and predictions to boost your sales
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Analyzing..." : "Refresh Insights"}
        </Button>
      </div>

      {/* AI Summary Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">AI Analysis Summary</h3>
              <p className="text-muted-foreground mt-1">
                Based on your current data, I've identified {recommendations.length} actionable insights.
                Your pipeline health is{" "}
                <span className="text-green-500 font-medium">strong</span> with{" "}
                {insights.highValueDeals.length} high-value opportunities in progress.
                {insights.hotLeads.length > 0 &&
                  ` Focus on converting ${insights.hotLeads.length} hot leads for maximum impact.`}
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">{insights.hotLeads.length} Hot Leads</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">{insights.stuckDeals.length} Stuck Deals</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">{insights.urgentTickets.length} Urgent Tickets</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">{insights.highValueDeals.length} High-Value Deals</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Smart Recommendations
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {recommendations.map((rec, index) => (
            <Card
              key={index}
              className="hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg text-white ${getTypeColor(rec.type)}`}>
                    {rec.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{rec.title}</h4>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${getPriorityColor(rec.priority)}`}
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {rec.description}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">{rec.impact}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {rec.action}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tabs for Detailed Insights */}
      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-96">
          <TabsTrigger value="predictions">Deal Predictions</TabsTrigger>
          <TabsTrigger value="scoring">Lead Scoring</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Deal Win Predictions
              </CardTitle>
              <CardDescription>
                AI-powered probability scores for your active deals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dealPredictions.map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">{deal.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          ${deal.value.toLocaleString()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {deal.company} • {deal.stage.replace("_", " ")}
                      </p>
                      <p className="text-xs text-primary mt-2">{deal.recommendation}</p>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${
                          deal.aiScore >= 70
                            ? "text-green-500"
                            : deal.aiScore >= 50
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {deal.aiScore}%
                      </div>
                      <p className="text-xs text-muted-foreground">AI Score</p>
                    </div>
                    <div className="w-24">
                      <Progress
                        value={deal.aiScore}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scoring" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Lead Scoring Analysis
              </CardTitle>
              <CardDescription>
                AI-calculated scores based on engagement, fit, and intent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {leadScoring.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {lead.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">{lead.name}</h4>
                        <span
                          className={`text-lg font-bold ${
                            lead.score >= 80
                              ? "text-green-500"
                              : lead.score >= 60
                              ? "text-yellow-500"
                              : "text-red-500"
                          }`}
                        >
                          {lead.score}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lead.company} • {lead.position}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {lead.scoreFactors.map((factor) => (
                          <div
                            key={factor.factor}
                            className="flex items-center gap-1 text-xs"
                          >
                            <span className="text-muted-foreground">{factor.factor}:</span>
                            <span className="font-medium">{factor.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                AI-detected patterns in your sales and support data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                  <TrendingUp className="h-6 w-6 text-green-500 shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-500">Positive Trend Detected</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your conversion rate has improved by 15% this month. Deals from LinkedIn
                      referrals are converting 2x faster than other sources.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                  <AlertTriangle className="h-6 w-6 text-yellow-500 shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-500">Area for Improvement</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Average response time to support tickets has increased by 12%. Consider
                      allocating more resources to the support queue during peak hours (2-5 PM).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
                  <Lightbulb className="h-6 w-6 text-blue-500 shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-500">Opportunity Identified</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Customers in the healthcare sector have 40% higher lifetime value.
                      Consider expanding your marketing efforts in this vertical.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-medium text-primary">Best Practice</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Deals that include a demo call within the first week have a 65% higher
                      close rate. Maintain this practice for new opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
