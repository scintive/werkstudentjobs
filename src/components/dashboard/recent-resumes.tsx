import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, Building, ArrowRight, MoreHorizontal, Eye, Edit3, Download } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

interface TailoredResume {
  id: string
  job_id: string
  variant_name: string
  match_score: number
  created_at: string
  updated_at: string
  jobs: {
    id: string
    title: string
    companies: {
      name: string
    }
  }
}

interface RecentResumesProps {
  resumes: TailoredResume[]
}

const statusColors = {
  optimized: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  applied: "bg-primary/10 text-primary border-primary/20",
}

export function RecentResumes({ resumes }: RecentResumesProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Recent Tailored Resumes</CardTitle>
        <Button variant="ghost" size="sm" className="gap-2">
          View All
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {resumes.length > 0 ? (
          resumes.map((resume) => (
            <div
              key={resume.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-border transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-balance group-hover:text-primary transition-colors">
                    {resume.jobs?.title || resume.variant_name || 'Tailored Resume'}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      {resume.jobs?.companies?.name || 'Company'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDistanceToNow(new Date(resume.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right space-y-1">
                  <div className="text-sm font-medium">{resume.match_score || 0}% match</div>
                  <Badge variant="outline" className={statusColors.optimized}>
                    optimized
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/jobs/${resume.job_id}/tailor`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Resume
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/jobs/${resume.job_id}/tailor`)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Resume
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm">No tailored resumes yet</p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => router.push('/jobs')}
            >
              Browse Jobs to Tailor
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}