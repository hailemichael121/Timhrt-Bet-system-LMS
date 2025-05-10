"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookLoader } from "@/components/animations/book-loader"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"
import { format } from "date-fns"
import { motion } from "framer-motion"
import { CheckCircle, MessageSquare, Clock, Eye, XCircle, RotateCcw, Loader2 } from "lucide-react"
import Link from "next/link"

export function GradeReviewInterface() {
  const { user, profile } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])
  const [filteredReviews, setFilteredReviews] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("pending")
  const [requestingReview, setRequestingReview] = useState(false)
  const [submissionToReview, setSubmissionToReview] = useState<any | null>(null)
  const [reviewReason, setReviewReason] = useState("")

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`
  }

  useEffect(() => {
    if (user) {
      fetchGradeReviews()
    }
  }, [user])

  useEffect(() => {
    filterReviews()
  }, [reviews, activeTab])

  const fetchGradeReviews = async () => {
    try {
      setLoading(true)

      let query

      if (user.role === "student") {
        // Student: Fetch grade reviews they've requested
        query = supabase
          .from("grade_reviews")
          .select(`
            id,
            submission_id,
            requested_by,
            requested_at,
            status,
            reason,
            response,
            resolved_at,
            resolved_by,
            submissions (
              id,
              assignment_id,
              grade,
              original_grade,
              assignments (
                id,
                title,
                points,
                course_id,
                courses (
                  id,
                  title,
                  code
                )
              )
            )
          `)
          .eq("requested_by", user.id)
          .order("requested_at", { ascending: false })
      } else if (user.role === "teacher") {
        // Teacher: Fetch grade reviews for submissions they graded
        // First get courses taught by this teacher
        const { data: courses, error: coursesError } = await supabase
          .from("courses")
          .select("id")
          .eq("instructor_id", user.id)

        if (coursesError) throw coursesError

        if (!courses || courses.length === 0) {
          setReviews([])
          setFilteredReviews([])
          setLoading(false)
          return
        }

        const courseIds = courses.map((course) => course.id)

        // Get assignments for these courses
        const { data: assignments, error: assignmentsError } = await supabase
          .from("assignments")
          .select("id")
          .in("course_id", courseIds)

        if (assignmentsError) throw assignmentsError

        if (!assignments || assignments.length === 0) {
          setReviews([])
          setFilteredReviews([])
          setLoading(false)
          return
        }

        const assignmentIds = assignments.map((assignment) => assignment.id)

        // Get grade reviews for these assignments
        query = supabase
          .from("grade_reviews")
          .select(`
            id,
            submission_id,
            requested_by,
            profiles!requested_by (
              id,
              first_name,
              last_name,
              avatar_url,
              student_id
            ),
            requested_at,
            status,
            reason,
            response,
            resolved_at,
            resolved_by,
            submissions (
              id,
              assignment_id,
              grade,
              original_grade,
              assignments (
                id,
                title,
                points,
                course_id,
                courses (
                  id,
                  title,
                  code
                )
              )
            )
          `)
          .in("submissions.assignment_id", assignmentIds)
          .order("requested_at", { ascending: false })
      } else if (user.role === "admin") {
        // Admin: Fetch all grade reviews
        query = supabase
          .from("grade_reviews")
          .select(`
            id,
            submission_id,
            requested_by,
            profiles!requested_by (
              id,
              first_name,
              last_name,
              avatar_url,
              student_id
            ),
            requested_at,
            status,
            reason,
            response,
            resolved_at,
            resolved_by,
            submissions (
              id,
              assignment_id,
              grade,
              original_grade,
              assignments (
                id,
                title,
                points,
                course_id,
                courses (
                  id,
                  title,
                  code
                )
              )
            )
          `)
          .order("requested_at", { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error
      setReviews(data || [])
    } catch (err) {
      console.error("Error fetching grade reviews:", err)
      toast({
        title: "Error",
        description: "Failed to load grade reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterReviews = () => {
    if (activeTab === "all") {
      setFilteredReviews(reviews)
    } else {
      setFilteredReviews(reviews.filter((review) => review.status === activeTab))
    }
  }

  const handleRequestReview = async () => {
    if (!submissionToReview || !reviewReason.trim()) return

    try {
      setRequestingReview(true)

      // Create a grade review request
      const { error } = await supabase.from("grade_reviews").insert({
        submission_id: submissionToReview.id,
        requested_by: user.id,
        requested_at: new Date().toISOString(),
        status: "pending",
        reason: reviewReason,
      })

      if (error) throw error

      // Add the original grade to the submissions table
      await supabase
        .from("submissions")
        .update({
          original_grade: submissionToReview.grade,
        })
        .eq("id", submissionToReview.id)

      // Create a notification for the teacher
      const { data: courseData } = await supabase
        .from("courses")
        .select("instructor_id")
        .eq("id", submissionToReview.assignment.course_id)
        .single()

      if (courseData) {
        await supabase.from("notifications").insert({
          user_id: courseData.instructor_id,
          title: "Grade Review Requested",
          message: `A student has requested a review of their grade for "${submissionToReview.assignment.title}"`,
          type: "grade_review",
          read: false,
          link: `/dashboard/grade-reviews`,
          related_id: submissionToReview.id,
        })
      }

      toast({
        title: "Review Requested",
        description: "Your grade review request has been submitted successfully",
      })

      // Reset form and refresh
      setSubmissionToReview(null)
      setReviewReason("")
      fetchGradeReviews()
    } catch (err) {
      console.error("Error requesting grade review:", err)
      toast({
        title: "Error",
        description: "Failed to submit grade review request",
        variant: "destructive",
      })
    } finally {
      setRequestingReview(false)
    }
  }

  const handleResolveReview = async (reviewId: string, studentId: string, approved: boolean, response: string) => {
    try {
      // Update the review status
      const { error } = await supabase
        .from("grade_reviews")
        .update({
          status: approved ? "approved" : "rejected",
          response,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq("id", reviewId)

      if (error) throw error

      // Create a notification for the student
      await supabase.from("notifications").insert({
        user_id: studentId,
        title: `Grade Review ${approved ? "Approved" : "Rejected"}`,
        message: `Your grade review request has been ${approved ? "approved" : "rejected"}`,
        type: "grade_review",
        read: false,
        link: `/dashboard/grade-reviews`,
        related_id: reviewId,
      })

      toast({
        title: `Review ${approved ? "Approved" : "Rejected"}`,
        description: `The grade review request has been ${approved ? "approved" : "rejected"}`,
      })

      // Refresh
      fetchGradeReviews()
    } catch (err) {
      console.error("Error resolving grade review:", err)
      toast({
        title: "Error",
        description: "Failed to resolve grade review",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <BookLoader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Grade Reviews</h2>
          <p className="text-muted-foreground">
            {user.role === "student"
              ? "Request reviews for grades you believe need reassessment"
              : user.role === "teacher"
                ? "Respond to grade review requests from students"
                : "Manage grade review requests between students and teachers"}
          </p>
        </div>

        {user.role === "student" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button className="self-start">Request Grade Review</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Request Grade Review</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="submission">Select Assignment</Label>
                  <select
                    id="submission"
                    className="w-full p-2 border rounded-md"
                    value={submissionToReview?.id || ""}
                    onChange={(e) => {
                      // This would typically fetch the submission details
                      // For simplicity, we're just setting a mock object
                      setSubmissionToReview({
                        id: e.target.value,
                        grade: 75,
                        assignment: {
                          title: "Selected Assignment",
                          course_id: "course-123",
                        },
                      })
                    }}
                  >
                    <option value="">Select a graded assignment</option>
                    {/* This would be populated with actual submissions */}
                    <option value="submission-1">Assignment 1 - Grade: 75/100</option>
                    <option value="submission-2">Assignment 2 - Grade: 82/100</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Review</Label>
                  <Textarea
                    id="reason"
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    placeholder="Explain why you believe this grade should be reviewed..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <DialogTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogTrigger>
                <Button
                  onClick={handleRequestReview}
                  disabled={requestingReview || !submissionToReview || !reviewReason.trim()}
                >
                  {requestingReview ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending
            {reviews.filter((review) => review.status === "pending").length > 0 && (
              <Badge className="ml-2 bg-amber-500">
                {reviews.filter((review) => review.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <GradeReviewsList
            reviews={filteredReviews}
            userRole={user.role}
            onResolve={handleResolveReview}
            emptyMessage="No pending grade review requests."
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <GradeReviewsList
            reviews={filteredReviews}
            userRole={user.role}
            emptyMessage="No approved grade review requests."
          />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <GradeReviewsList
            reviews={filteredReviews}
            userRole={user.role}
            emptyMessage="No rejected grade review requests."
          />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <GradeReviewsList
            reviews={filteredReviews}
            userRole={user.role}
            onResolve={handleResolveReview}
            emptyMessage="No grade review requests found."
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface GradeReviewsListProps {
  reviews: any[]
  userRole: string
  onResolve?: (reviewId: string, studentId: string, approved: boolean, response: string) => void
  emptyMessage: string
}

function GradeReviewsList({ reviews, userRole, onResolve, emptyMessage }: GradeReviewsListProps) {
  const [reviewResponse, setReviewResponse] = useState<Record<string, string>>({})
  const [processingReview, setProcessingReview] = useState<string | null>(null)

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {review.status === "pending" ? (
                      <Clock className="h-5 w-5 text-amber-500" />
                    ) : review.status === "approved" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span>Grade Review - {userRole === "student" ? "Your Request" : "Student Request"}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    Requested on {format(new Date(review.requested_at), "MMM d, yyyy")}
                    {review.resolved_at && (
                      <>
                        <span>•</span>
                        <span>
                          {review.status === "approved" ? "Approved" : "Rejected"} on{" "}
                          {format(new Date(review.resolved_at), "MMM d, yyyy")}
                        </span>
                      </>
                    )}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    review.status === "pending" ? "outline" : review.status === "approved" ? "secondary" : "destructive"
                  }
                  className="self-start"
                >
                  {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Assignment</h4>
                  <p className="font-medium">{review.submissions.assignments.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {review.submissions.assignments.courses.code}: {review.submissions.assignments.courses.title}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Current Grade</h4>
                  <p className="font-medium">
                    {review.submissions.grade}/{review.submissions.assignments.points} (
                    {((review.submissions.grade / review.submissions.assignments.points) * 100).toFixed(1)}%)
                  </p>
                  {review.submissions.original_grade && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Original: {review.submissions.original_grade}/{review.submissions.assignments.points}
                    </p>
                  )}
                </div>

                {(userRole === "teacher" || userRole === "admin") && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Student</h4>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={review.profiles?.avatar_url || ""} />
                        <AvatarFallback>
                          {getInitials(review.profiles?.first_name || "", review.profiles?.last_name || "")}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium">
                        {review.profiles?.first_name} {review.profiles?.last_name}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">ID: {review.profiles?.student_id || "N/A"}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Review Reason</h4>
                <div className="p-3 rounded-md bg-muted/50 text-sm">{review.reason}</div>
              </div>

              {review.response && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Response</h4>
                  <div className="p-3 rounded-md bg-muted/50 text-sm">{review.response}</div>
                </div>
              )}

              {review.status === "pending" && (userRole === "teacher" || userRole === "admin") && onResolve && (
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-sm font-medium">Your Response</h4>
                  <Textarea
                    value={reviewResponse[review.id] || ""}
                    onChange={(e) => setReviewResponse({ ...reviewResponse, [review.id]: e.target.value })}
                    placeholder="Provide a response to the student's review request..."
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/submissions/${review.submission_id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Submission
                </Link>
              </Button>

              {review.status === "pending" && (userRole === "teacher" || userRole === "admin") && onResolve && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setProcessingReview(review.id)
                      onResolve(review.id, review.requested_by, false, reviewResponse[review.id] || "").finally(() =>
                        setProcessingReview(null),
                      )
                    }}
                    disabled={processingReview === review.id || !reviewResponse[review.id]?.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setProcessingReview(review.id)
                      onResolve(review.id, review.requested_by, true, reviewResponse[review.id] || "").finally(() =>
                        setProcessingReview(null),
                      )
                    }}
                    disabled={processingReview === review.id || !reviewResponse[review.id]?.trim()}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
