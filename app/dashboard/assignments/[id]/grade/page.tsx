"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageTitle } from "@/components/page-title"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { GradingSidebar } from "@/components/assignments/grading-sidebar"
import { BookLoader } from "@/components/animations/book-loader"
import { BookError } from "@/components/animations/book-error"
import { BookPageTransition } from "@/components/animations/page-transitions"
import { supabase } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"
import { format } from "date-fns"
import { FileText, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GradeAssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [assignment, setAssignment] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)

  useEffect(() => {
    if (user && params.id) {
      fetchSubmissionData()
    }
  }, [user, params.id])

  const fetchSubmissionData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: submissionData, error: submissionError } = await supabase
        .from("submissions")
        .select(
          `
          id,
          content,
          file_url,
          grade,
          feedback,
          submitted_at,
          graded_at,
          assignment_id,
          student_id
        `,
        )
        .eq("id", params.id)
        .single()

      if (submissionError) throw submissionError

      // Fetch assignment data
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select(
          `
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
        `,
        )
        .eq("id", submissionData.assignment_id)
        .single()

      if (assignmentError) throw assignmentError

      // Fetch student data
      const { data: studentData, error: studentError } = await supabase
        .from("profiles")
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          avatar_url,
          student_id
        `,
        )
        .eq("id", submissionData.student_id)
        .single()

      if (studentError) throw studentError

      setSubmission(submissionData)
      setAssignment(assignmentData)
      setStudent(studentData)
    } catch (err) {
      console.error("Error fetching submission data:", err)
      setError("Failed to load submission data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <BookLoader />
  }

  if (error || !submission || !assignment || !student) {
    return (
      <BookError
        title="Could not load submission"
        message={error || "The submission could not be found"}
        reset={() => fetchSubmissionData()}
      />
    )
  }

  return (
    <BookPageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageTitle
            title={`Grade: ${assignment.title}`}
            description={`Submitted by ${student.first_name} ${student.last_name}`}
          />
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submission</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="content">
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="file">Attached Files</TabsTrigger>
                  </TabsList>
                  <TabsContent value="content">
                    {submission.content ? (
                      <div className="prose max-w-none dark:prose-invert">
                        <div dangerouslySetInnerHTML={{ __html: submission.content }} />
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No written content submitted</p>
                    )}
                  </TabsContent>
                  <TabsContent value="file">
                    {submission.file_url ? (
                      <div className="flex items-center justify-between p-4 border rounded-md">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium">Submission File</p>
                            <p className="text-sm text-muted-foreground">{submission.file_url.split("/").pop()}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={submission.file_url} target="_blank" rel="noopener noreferrer" download>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No files attached</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="mt-1">{assignment.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium">Course</h3>
                      <p className="mt-1">
                        {assignment.courses.code}: {assignment.courses.title}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Due Date</h3>
                      <p className="mt-1">{format(new Date(assignment.due_date), "PPP")}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Points</h3>
                      <p className="mt-1">{assignment.points}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Submission Date</h3>
                      <p className="mt-1">{format(new Date(submission.submitted_at), "PPP")}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {student.avatar_url ? (
                        <img
                          src={student.avatar_url || "/placeholder.svg"}
                          alt={`${student.first_name} ${student.last_name}`}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-medium">
                          {student.first_name[0]}
                          {student.last_name[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium">Student ID</h3>
                      <p className="mt-1">{student.student_id || "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">View Profile</h3>
                      <p className="mt-1">
                        <Link href={`/dashboard/students/${student.id}`} className="text-primary hover:underline">
                          Student Profile
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <GradingSidebar
              submissionId={submission.id}
              assignmentId={assignment.id}
              studentId={student.id}
              initialGrade={submission.grade || 0}
              initialFeedback={submission.feedback || ""}
              maxPoints={assignment.points}
              onGradeSubmit={fetchSubmissionData}
            />
          </div>
        </div>
      </div>
    </BookPageTransition>
  )
}
