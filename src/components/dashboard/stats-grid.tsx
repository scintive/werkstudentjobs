import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, FileText, Briefcase, Target, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface StatsGridProps {
  stats: {
    profileCompletion: number
    activeApplications: number
    jobMatches: number
    avgMatchScore: number
  }
}

export function StatsGrid({ stats }: StatsGridProps) {
  const statCards = [
    {
      title: "Profile Completion",
      value: `${stats.profileCompletion}%`,
      description: stats.profileCompletion === 100 ? "Ready to apply" : "Complete your profile",
      icon: CheckCircle,
      color: stats.profileCompletion === 100 ? "text-success" : "text-warning",
      bgColor: stats.profileCompletion === 100 ? "bg-success/10" : "bg-warning/10",
      progress: stats.profileCompletion,
    },
    {
      title: "Active Applications",
      value: stats.activeApplications.toString(),
      description: "In progress",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      change: stats.activeApplications > 0 ? "+3 this week" : undefined,
    },
    {
      title: "Job Matches",
      value: stats.jobMatches.toString(),
      description: "New opportunities",
      icon: Briefcase,
      color: "text-accent",
      bgColor: "bg-accent/10",
      change: stats.jobMatches > 0 ? "+12 today" : undefined,
    },
    {
      title: "Match Score",
      value: `${stats.avgMatchScore}%`,
      description: "Average compatibility",
      icon: Target,
      color: "text-warning",
      bgColor: "bg-warning/10",
      progress: stats.avgMatchScore,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card
          key={stat.title}
          className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-balance">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
              {stat.change && (
                <div className="flex items-center gap-1 text-xs text-success">
                  <TrendingUp className="w-3 h-3" />
                  {stat.change}
                </div>
              )}
            </div>
            {stat.progress !== undefined && (
              <div className="mt-4">
                <Progress value={stat.progress} className="h-2" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}