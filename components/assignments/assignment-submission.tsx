"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileUpload } from "@/components/file-upload"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { format, isPast } from "date-fns"
import { FileText, Clock, CheckCircle, AlertTriangle, Download, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface AssignmentSubmissionProps {
  assignmentId: string
}

export function AssignmentSubmission({ assignmentId }: AssignmentSubmissionProps) {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [assignment, setAssignment] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [content, setContent] = useState("")
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchAssignmentAndSubmission()
    }
  }, [user, assignmentId])

  const fetchAssignmentAndSubmission = async () => {
    try {
      setLoading(true)

      // Fetch assignment details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("assignments")
        .select(`
          id, 
          title, 
          description, 
          due_date, 
          points,
          file_url,
          file_name,
          course_id,
          courses (
            id,
            title,
            code
          )
        `)
        .eq("id", assignmentId)
        .single()

      if (assignmentError) throw assignmentError

      setAssignment(assignmentData)

      // Fetch existing submission if any
      const { data: submissionData, error: submissionError } = await supabase
        .from("submissions")
        .select("*")
        .eq("assignment_id", assignmentId)
        .eq("student_id", user?.id)
        .maybeSingle()

      if (submissionError) throw submissionError

      if (submissionData) {
        setSubmission(submissionData)
        setContent(submissionData.content || "")
        setFileUrl(submissionData.file_url || null)
        setFileName(submissionData.file_name || null)
      }
    } catch (error) {
      console.error("Error fetching assignment data:", error)
      toast({
        title: "Error",
        description: "Failed to load assignment details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUploadComplete = (url: string, name: string) => {
    setFileUrl(url)
    setFileName(name)
    toast({
      title: "File uploaded",
      description: `${name} has been uploaded successfully`,
    })
  }

  const handleSubmit = async () => {
    if (!user || !assignment) return

    try {
      setSubmitting(true)

      const isDueDatePassed = assignment.due_date ? isPast(new Date(assignment.due_date)) : false
      const submissionData = {
        assignment_id: assignmentId,
        student_id: user.id,
        content,
        file_url: fileUrl,
        file_name: fileName,
        submitted_at: new Date().toISOString(),
        late: isDueDatePassed,
      }

      if (submission) {
        // Update existing submission
        const { error } = await supabase.from("submissions").update(submissionData).eq("id", submission.id)

        if (error) throw error

        setSubmission({
          ...submission,
          ...submissionData,
        })

        toast({
          title: "Submission updated",
          description: "Your assignment submission has been updated successfully",
        })
      } else {
        // Create new submission
        const { data, error } = await supabase.from("submissions").insert(submissionData).select().single()

        if (error) throw error

        setSubmission(data)

        // Create notification for the instructor
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("instructor_id")
          .eq("id", assignment.course_id)
          .single()

        if (!courseError && courseData) {
          await supabase.from("notifications").insert({
            user_id: courseData.instructor_id,
            title: "New Assignment Submission",
            message: `A student has submitted their work for "${assignment.title}"`,
            type: "submission",
            read: false,
            link: `/dashboard/submissions/${data.id}`,
            related_id: data.id,
          })
        }

        toast({
          title: "Submission successful",
          description: "Your assignment has been submitted successfully",
        })
      }
    } catch (error: any) {
      console.error("Error submitting assignment:", error.message)
      toast({
        title: "Error",
        description: "Failed to submit assignment",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading assignment details..." />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
        <h3 className="text-lg font-medium">Assignment not found</h3>
        <p className="text-muted-foreground">The assignment you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }

  const isDueDatePassed = assignment.due_date ? isPast(new Date(assignment.due_date)) : false
  const isGraded = submission?.grade !== null && submission?.grade !== undefined

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{assignment.title}</CardTitle>
              <CardDescription>
                {assignment.courses?.code}: {assignment.courses?.title}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Due: {assignment.due_date ? format(new Date(assignment.due_date), "PPP 'at' p") : "No due date"}
              </span>
              {isDueDatePassed && !submission && (
                <Badge variant="destructive" className="ml-2">
                  Past Due
                </Badge>
              )}
              {submission && (
                <Badge
                  variant={submission.late ? "outline" : "secondary"}
                  className={submission.late ? "bg-amber-50 text-amber-700 border-amber-200" : ""}
                >
                  {submission.late ? "Submitted Late" : "Submitted"}
                </Badge>
              )}
              {isGraded && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Graded: {submission.grade}/{assignment.points}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <h3 className="text-lg font-medium">Instructions</h3>
            <div className="whitespace-pre-wrap">{assignment.description}</div>
          </div>

          {assignment.file_url && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Assignment Materials</h3>
              <div className="p-3 border rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  <span>{assignment.file_name || "Assignment file"}</span>
                </div>
                <a
                  href={assignment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          )}

          {isGraded ? (
            <div className="mt-6 space-y-4">
              <div className="p-4 border rounded-md bg-muted/30">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Feedback</span>
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Grade:</span>
                    <span className="text-lg font-bold">
                      {submission.grade}/{assignment.points} (
                      {((submission.grade / assignment.points) * 100).toFixed(1)}
                      %)
                    </span>
                  </div>
                  {submission.feedback && (
                    <div>
                      <span className="font-medium">Instructor Feedback:</span>
                      <p className="mt-1 whitespace-pre-wrap">{submission.feedback}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Your Submission</h3>
                {submission.content && (
                  <div className="p-4 border rounded-md mb-4">
                    <p className="whitespace-pre-wrap">{submission.content}</p>
                  </div>
                )}
                {submission.file_url && (
                  <div className="p-3 border rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-primary" />
                      <span>{submission.file_name || "Submission file"}</span>
                    </div>
                    <a
                      href={submission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Your Submission</h3>
              <div>
                <label htmlFor="content" className="block text-sm font-medium mb-1">
                  Response
                </label>
                <Textarea
                  id="content"
                  placeholder="Type your response here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Attachment (Optional)</label>
                <FileUpload
                  bucket="submissions"
                  path={`assignment-${assignmentId}/${user?.id}`}
                  onUploadComplete={handleFileUploadComplete}
                  acceptedFileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                  maxSizeMB={20}
                />
                {fileName && (
                  <div className="mt-2 p-2 border rounded flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">{fileName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFileUrl(null)
                        setFileName(null)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      &times;
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Link href={`/dashboard/courses/${assignment.course_id}`}>
            <Button variant="outline">Back to Course</Button>
          </Link>
          {!isGraded && (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>{submission ? "Updating..." : "Submitting..."}</span>
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>{submission ? "Update Submission" : "Submit Assignment"}</span>
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
