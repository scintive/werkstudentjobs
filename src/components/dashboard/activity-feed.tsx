import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Edit3, Eye, Wand2, Activity } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  type: 'application' | 'resume_edit' | 'job_view' | 'tailor'
  title: string
  description: string
  timestamp: string
  icon: 'success' | 'info' | 'warning'
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

const statusConfig = {
  success: {
    color: "text-success",
    bgColor: "bg-success/10",
    badge: "bg-success/10 text-success border-success/20",
  },
  info: {
    color: "text-primary",
    bgColor: "bg-primary/10",
    badge: "bg-primary/10 text-primary border-primary/20",
  },
  warning: {
    color: "text-warning",
    bgColor: "bg-warning/10",
    badge: "bg-warning/10 text-warning border-warning/20",
  },
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'application':
      return Send
    case 'resume_edit':
      return Edit3
    case 'job_view':
      return Eye
    case 'tailor':
      return Wand2
    default:
      return Activity
  }
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const IconComponent = getActivityIcon(activity.type)
            const status = statusConfig[activity.icon]

            return (
              <div key={activity.id} className="flex items-start gap-4 relative">
                {index !== activities.length - 1 && <div className="absolute left-6 top-12 w-px h-8 bg-border" />}
                <div
                  className={`w-12 h-12 rounded-lg ${status.bgColor} flex items-center justify-center flex-shrink-0`}
                >
                  <IconComponent className={`w-5 h-5 ${status.color}`} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium text-sm text-balance">{activity.title}</h3>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <Badge variant="outline" className={`${status.badge} text-xs whitespace-nowrap`}>
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Start by creating or tailoring a resume</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}