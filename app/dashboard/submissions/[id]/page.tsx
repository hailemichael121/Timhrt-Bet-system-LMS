import { PageTitle } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Download, FileText, Calendar, Award } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"
import { notFound } from "next/navigation"

export default async function SubmissionPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: submission, error } = await supabase
    .from("submissions")
    .select(`
      *,
      assignments (
        id,
        title,
        description,
        due_date,
        points,
        course_id,
        courses (
          id,
          title,
          code
        )
      ),
      profiles (
        id,
        first_name,
        last_name,
        student_id
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !submission) {
    notFound()
  }

  const assignment = submission.assignments
  const student = submission.profiles
  const course = assignment.courses

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/courses/${assignment.course_id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageTitle title={`Submission: ${assignment.title}`} description={`${course.code} • ${course.title}`} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>Information about the assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="font-medium">Description</div>
              <p className="text-sm text-muted-foreground">{assignment.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Due Date
                </div>
                <p className="text-sm text-muted-foreground">{format(new Date(assignment.due_date), "PPP")}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  Points
                </div>
                <p className="text-sm text-muted-foreground">{assignment.points}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Student who submitted this assignment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="font-medium">Name</div>
              <p className="text-sm text-muted-foreground">
                {student.first_name} {student.last_name}
              </p>
            </div>

            <div className="space-y-1">
              <div className="font-medium">Student ID</div>
              <p className="text-sm text-muted-foreground">{student.student_id}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission</CardTitle>
          <CardDescription>Submitted on {format(new Date(submission.submitted_at), "PPP p")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {submission.content && (
            <div className="space-y-2">
              <div className="font-medium">Content</div>
              <div className="rounded-md border p-4 whitespace-pre-wrap text-sm">{submission.content}</div>
            </div>
          )}

          {submission.file_url && (
            <div className="space-y-2">
              <div className="font-medium">Attached File</div>
              <div className="flex items-center gap-2 p-4 border rounded-md">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{submission.file_url.split("/").pop()}</p>
                  <p className="text-xs text-muted-foreground">Uploaded with submission</p>
                </div>
                <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </a>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="font-medium">Grading</div>
            {submission.grade ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">
                    {submission.grade} / {assignment.points}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ({((submission.grade / assignment.points) * 100).toFixed(1)}%)
                  </div>
                </div>

                {submission.feedback && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Feedback</div>
                    <div className="rounded-md border p-4 whitespace-pre-wrap text-sm">{submission.feedback}</div>
                  </div>
                )}

                {submission.graded_at && (
                  <p className="text-xs text-muted-foreground">
                    Graded on {format(new Date(submission.graded_at), "PPP p")}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">This submission has not been graded yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
