import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { PageTitle } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AddCourseMaterialForm } from "@/components/courses/add-course-material-form"

export default async function AddCourseMaterialPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null // Will be handled by middleware
  }

  // Fetch course details
  const { data: course, error } = await supabase.from("courses").select("*").eq("id", params.id).single()

  if (error || !course) {
    notFound()
  }

  // Get user role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  const isAdmin = profile?.role === "admin"
  const isInstructor = course.teacher_id === session.user.id

  // Only admin or course instructor can add materials
  if (!isAdmin && !isInstructor) {
    redirect(`/dashboard/courses/${params.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/courses/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageTitle title="Add Course Material" description={`Add learning materials to ${course.title}`} />
      </div>

      <AddCourseMaterialForm courseId={params.id} />
    </div>
  )
}
