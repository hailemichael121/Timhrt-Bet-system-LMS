import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { PageTitle } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Calendar, Clock, BookOpen, Users, FileText } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { CourseAssignments } from "@/components/courses/course-assignments"
import { CourseDiscussion } from "@/components/courses/course-discussion"
import { CourseEnrollments } from "@/components/courses/course-enrollments"

export default async function CourseViewPage({ params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null // Will be handled by middleware
  }

  // Fetch course details with instructor information
  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      *,
      profiles:teacher_id (
        id,
        first_name,
        last_name,
        avatar_url,
        email
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !course) {
    notFound()
  }

  // Get user role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  const isAdmin = profile?.role === "admin"
  const isTeacher = profile?.role === "teacher"
  const isInstructor = course.teacher_id === session.user.id

  // Fetch course materials if any
  const { data: materials } = await supabase
    .from("course_materials")
    .select("*")
    .eq("course_id", params.id)
    .order("created_at", { ascending: false })

  // Fetch course statistics
  const { data: enrollmentCount } = await supabase
    .from("enrollments")
    .select("id", { count: "exact" })
    .eq("course_id", params.id)

  const { data: assignmentCount } = await supabase
    .from("assignments")
    .select("id", { count: "exact" })
    .eq("course_id", params.id)

  const { data: discussionCount } = await supabase
    .from("discussions")
    .select("id", { count: "exact" })
    .eq("course_id", params.id)

  const instructor = course.profiles

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <PageTitle title={course.title} description={`${course.code || ""} • ${course.department || ""}`} />
        </div>
        {(isAdmin || isInstructor) && (
          <Link href={`/dashboard/courses/${params.id}/edit`}>
            <Button variant="outline">Edit Course</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
              <CardDescription>Detailed information about this course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose max-w-none dark:prose-invert">
                <p>{course.description || "No description provided."}</p>
              </div>

              {course.tags && course.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {course.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Semester: <span className="font-medium">{course.semester || "Not specified"}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Credits: <span className="font-medium">{course.credits || "Not specified"}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Department: <span className="font-medium">{course.department || "Not specified"}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Students: <span className="font-medium">{enrollmentCount?.count || 0}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="materials">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="assignments">
                Assignments{" "}
                <Badge variant="outline" className="ml-2">
                  {assignmentCount?.count || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="discussions">
                Discussions{" "}
                <Badge variant="outline" className="ml-2">
                  {discussionCount?.count || 0}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="materials" className="space-y-4 pt-4">
              {materials && materials.length > 0 ? (
                <div className="space-y-4">
                  {materials.map((material) => (
                    <Card key={material.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{material.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Added on {format(new Date(material.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No course materials available yet.</p>
                  {(isAdmin || isInstructor) && (
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href={`/dashboard/courses/${params.id}/materials/add`}>Add Course Material</Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="assignments" className="pt-4">
              <CourseAssignments courseId={params.id} />
            </TabsContent>
            <TabsContent value="discussions" className="pt-4">
              <CourseDiscussion courseId={params.id} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full overflow-hidden mb-4 bg-muted">
                {instructor.avatar_url ? (
                  <img
                    src={instructor.avatar_url || "/placeholder.svg"}
                    alt={`${instructor.first_name} ${instructor.last_name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary text-xl font-bold">
                    {instructor.first_name?.[0]}
                    {instructor.last_name?.[0]}
                  </div>
                )}
              </div>
              <h3 className="font-medium text-lg">
                {instructor.first_name} {instructor.last_name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{instructor.email}</p>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/dashboard/messages?to=${instructor.id}`}>Contact Instructor</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {enrollmentCount?.count || 0} student{enrollmentCount?.count !== 1 ? "s" : ""} enrolled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CourseEnrollments courseId={params.id} compact />
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/dashboard/courses/${params.id}?tab=students`}>View All Students</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {(isAdmin || isInstructor) && (
            <Card>
              <CardHeader>
                <CardTitle>Course Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/dashboard/courses/${params.id}/assignments/create`}>Add Assignment</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/dashboard/courses/${params.id}/materials/add`}>Add Material</Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/dashboard/courses/${params.id}/discussion/create`}>Start Discussion</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
