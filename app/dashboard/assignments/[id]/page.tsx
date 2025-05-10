import { AssignmentSubmission } from "@/components/assignments/assignment-submission"
import { PageTitle } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { notFound } from "next/navigation"

export default async function AssignmentPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null // Will be handled by middleware
  }

  // Fetch assignment details
  const { data: assignment, error } = await supabase
    .from("assignments")
    .select(`
      *,
      course:course_id (
        id,
        title,
        code
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !assignment) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/courses/${assignment.course_id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageTitle title={assignment.title} description={`${assignment.course.code} • ${assignment.course.title}`} />
      </div>

      <AssignmentSubmission assignmentId={params.id} />
    </div>
  )
}
