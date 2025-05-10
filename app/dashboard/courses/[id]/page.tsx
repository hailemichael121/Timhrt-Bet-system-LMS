import { CourseDetails } from "@/components/courses/course-details"
import { CourseEnrollments } from "@/components/courses/course-enrollments"
import { CourseAssignments } from "@/components/courses/course-assignments"
import { CourseDiscussion } from "@/components/courses/course-discussion"
import { EnrollmentRequest } from "@/components/courses/enrollment-request"
import { PageTitle } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { ArrowLeft, PlusCircle } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { notFound } from "next/navigation"

export default async function CoursePage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null // Will be handled by middleware
  }

  // Fetch course details
  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      *,
      instructor:instructor_id (
        id,
        first_name,
        last_name
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !course) {
    notFound()
  }

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", params.id)
    .eq("student_id", session.user.id)
    .maybeSingle()

  const isEnrolled = !!enrollment

  // Get user role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  const isAdmin = profile?.role === "admin"
  const isTeacher = profile?.role === "teacher"
  const isStudent = profile?.role === "student"
  const isInstructor = course.instructor_id === session.user.id

  // If student is not enrolled and not admin/teacher, show enrollment request
  if (isStudent && !isEnrolled && !isAdmin && !isTeacher) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <PageTitle title={course.title} description={`${course.code} • ${course.department}`} />
        </div>

        <CourseDetails course={course} />

        <EnrollmentRequest courseId={params.id} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageTitle title={course.title} description={`${course.code} • ${course.department}`} />
        <div className="ml-auto flex gap-2">
          {(isAdmin || isInstructor) && (
            <Link href={`/dashboard/courses/${params.id}/assignments/create`}>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Assignment
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-6">
          <CourseDetails course={course} />
        </TabsContent>
        <TabsContent value="students" className="pt-6">
          <CourseEnrollments courseId={params.id} />
        </TabsContent>
        <TabsContent value="assignments" className="pt-6">
          <CourseAssignments courseId={params.id} />
        </TabsContent>
        <TabsContent value="discussion" className="pt-6">
          <CourseDiscussion courseId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
