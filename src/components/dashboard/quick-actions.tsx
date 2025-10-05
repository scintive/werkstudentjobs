import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Wand2, BarChart3, Target, BookOpen, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

export function QuickActions() {
  const router = useRouter()

  const actions = [
    {
      title: "Find Your Next Job",
      description: "Browse tailored job matches",
      icon: Search,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/jobs",
    },
    {
      title: "Optimize Resume",
      description: "AI-powered improvements",
      icon: Wand2,
      color: "text-accent",
      bgColor: "bg-accent/10",
      href: "/",
    },
    {
      title: "Career Insights",
      description: "Track your progress",
      icon: BarChart3,
      color: "text-warning",
      bgColor: "bg-warning/10",
      href: "/dashboard",
    },
    {
      title: "Skill Assessment",
      description: "Identify skill gaps",
      icon: Target,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      href: "/",
    },
    {
      title: "Interview Prep",
      description: "Practice with AI",
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
      href: "/",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant="ghost"
            className="w-full h-auto p-4 justify-start hover:bg-muted/50 group"
            onClick={() => router.push(action.href)}
          >
            <div className="flex items-center gap-4 w-full">
              <div className={`w-10 h-10 rounded-lg ${action.bgColor} flex items-center justify-center`}>
                <action.icon className={`w-5 h-5 ${action.color}`} />
              </div>
              <div className="flex-1 text-left space-y-1">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground">{action.description}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}