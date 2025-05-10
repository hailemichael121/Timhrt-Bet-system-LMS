"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Download, FileText, CheckCircle, AlertCircle, Clock, Loader2, MessageSquare } from "lucide-react"
import Link from "next/link"

export function TeacherGradingInterface() {
  const params = useParams()
  const router = useRouter()
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submission, setSubmission] = useState<any>(null)
  const [assignment, setAssignment] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [grade, setGrade] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [addingComment, setAddingComment] = useState(false)

  useEffect(() => {
    if (user && params.id) {
      fetchSubmissionData()
    }
  }, [user, params.id])

  const fetchSubmissionData = async () => {
    try {
      setLoading(true)

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

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("submission_comments")
        .select(
          `
          id,
          content,
          created_at,
          user_id,
          profiles (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `,
        )
        .eq("submission_id", params.id)
        .order("created_at", { ascending: true })

      if (commentsError) throw commentsError

      setSubmission(submissionData)
      setAssignment(assignmentData)
      setStudent(studentData)
      setGrade(submissionData.grade || 0)
      setFeedback(submissionData.feedback || "")
      setComments(commentsData || [])
    } catch (error) {
      console.error("Error fetching submission data:", error)
      toast({
        title: "Error",
        description: "Failed to load submission data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmit = async () => {
    if (!user || !submission) return

    try {
      setSubmitting(true)

      // Update submission with grade and feedback
      const { error } = await supabase
        .from("submissions")
        .update({
          grade,
          feedback,
          graded_at: new Date().toISOString(),
          needs_review: true, // Mark for admin review
        })
        .eq("id", submission.id)

      if (error) throw error

      // Create notification for the student
      await supabase.from("notifications").insert({
        user_id: student.id,
        title: "Assignment Graded",
        message: `Your submission for "${assignment.title}" has been graded`,
        type: "grade",
        read: false,
        link: `/dashboard/submissions/${submission.id}`,
        related_id: submission.id,
      })

      // Create notification for admin
      const { data: admins, error: adminsError } = await supabase.from("profiles").select("id").eq("role", "admin")

      if (!adminsError && admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.id,
            title: "Grade Needs Review",
            message: `A grade for "${assignment.title}" needs your review`,
            type: "grade_review",
            read: false,
            link: `/dashboard/admin/grades/${submission.id}`,
            related_id: submission.id,
          })
        }
      }

      toast({
        title: "Grade Submitted",
        description: "The grade and feedback have been submitted successfully",
      })

      // Refresh the data
      fetchSubmissionData()
    } catch (error) {
      console.error("Error submitting grade:", error)
      toast({
        title: "Error",
        description: "Failed to submit grade",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddComment = async () => {
    if (!user || !submission || !newComment.trim()) return

    try {
      setAddingComment(true)

      // Add comment
      const { error } = await supabase.from("submission_comments").insert({
        submission_id: submission.id,
        user_id: user.id,
        content: newComment,
      })

      if (error) throw error

      // Create notification for the student
      if (user.id !== student.id) {
        await supabase.from("notifications").insert({
          user_id: student.id,
          title: "New Comment",
          message: `A new comment has been added to your submission for "${assignment.title}"`,
          type: "comment",
          read: false,
          link: `/dashboard/submissions/${submission.id}`,
          related_id: submission.id,
        })
      }

      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully",
      })

      // Clear comment field and refresh comments
      setNewComment("")
      fetchSubmissionData()
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setAddingComment(false)
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading submission..." />
      </div>
    )
  }

  if (!submission || !assignment || !student) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
        <h2 className="text-xl font-semibold mb-2">Submission Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The submission you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => router.push("/dashboard/assignments")}>Back to Assignments</Button>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{assignment.courses.code}</span>
            <span>•</span>
            <span>{assignment.courses.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {assignment.points} Points
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Due {format(new Date(assignment.due_date), "MMM d, yyyy")}</span>
          </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Student Submission</span>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  <span>Submitted {format(new Date(submission.submitted_at), "MMM d, yyyy")}</span>
                </Badge>
              </CardTitle>
              <CardDescription>
                Submitted by{" "}
                <Link href={`/dashboard/students/${student.id}`} className="font-medium hover:underline">
                  {student.first_name} {student.last_name}
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="content">Submission Content</TabsTrigger>
                  <TabsTrigger value="file">Attached Files</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="p-4 border rounded-md mt-4">
                  {submission.content ? (
                    <div className="prose max-w-none dark:prose-invert">
                      <div dangerouslySetInnerHTML={{ __html: submission.content }} />
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No written content submitted</p>
                  )}
                </TabsContent>
                <TabsContent value="file" className="p-4 border rounded-md mt-4">
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
              <CardTitle>Comments</CardTitle>
              <CardDescription>Discussion about this submission</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 p-4 border rounded-md">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.profiles.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {getInitials(comment.profiles.first_name, comment.profiles.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-medium">
                            {comment.profiles.first_name} {comment.profiles.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(comment.created_at), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                        <p className="mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}

                <div className="flex gap-4 mt-6">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback>
                      {getInitials(user?.user_metadata?.first_name || "", user?.user_metadata?.last_name || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-24"
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleAddComment} disabled={!newComment.trim() || addingComment}>
                        {addingComment ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Post Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-1/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Grade Submission</CardTitle>
              <CardDescription>Assign a grade and provide feedback</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Grade</label>
                  <span className="text-sm font-medium">
                    {grade} / {assignment.points}
                  </span>
                </div>
                <Slider
                  value={[grade]}
                  max={assignment.points}
                  step={1}
                  onValueChange={(value) => setGrade(value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span>{assignment.points}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Percentage</label>
                <div className="text-2xl font-bold">
                  {assignment.points > 0 ? Math.round((grade / assignment.points) * 100) : 0}%
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${assignment.points > 0 ? (grade / assignment.points) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Feedback</label>
                <Textarea
                  placeholder="Provide detailed feedback on the submission..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-32"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button onClick={handleGradeSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Grade"
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={student.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">
                    {getInitials(student.first_name, student.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">
                    {student.first_name} {student.last_name}
                  </h3>
                  <p className="text-muted-foreground">{student.email}</p>
                  {student.student_id && <p className="text-sm text-muted-foreground">ID: {student.student_id}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/students/${student.id}`}>View Student Profile</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/dashboard/students/${student.id}/assignments`}>View All Submissions</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
