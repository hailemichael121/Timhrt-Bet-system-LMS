"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { BookOpen, Clock, CheckCircle, XCircle } from "lucide-react"

interface EnrollmentRequestProps {
  courseId: string
  onEnrollmentChange?: () => void
}

interface Course {
  id: string
  title: string
  code: string
  department: string
  credits: number
  instructor: {
    id: string
    first_name: string
    last_name: string
  } | null
}

interface EnrollmentRequest {
  id: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

export function EnrollmentRequest({ courseId, onEnrollmentChange }: EnrollmentRequestProps) {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollmentRequest, setEnrollmentRequest] = useState<EnrollmentRequest | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)

  useEffect(() => {
    fetchCourseAndEnrollmentStatus()
  }, [courseId, user])

  const fetchCourseAndEnrollmentStatus = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(`
          id,
          title,
          code,
          department,
          credits,
          instructor:instructor_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq("id", courseId)
        .single()

      if (courseError) throw courseError

      setCourse(courseData)

      // Check if already enrolled
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("student_id", user.id)
        .maybeSingle()

      if (enrollmentError) throw enrollmentError

      setIsEnrolled(!!enrollmentData)

      if (!enrollmentData) {
        // Check for enrollment request
        const { data: requestData, error: requestError } = await supabase
          .from("enrollment_requests")
          .select("id, status, created_at")
          .eq("course_id", courseId)
          .eq("student_id", user.id)
          .maybeSingle()

        if (requestError) throw requestError

        setEnrollmentRequest(requestData)
      }
    } catch (error) {
      console.error("Error fetching course data:", error)
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollmentRequest = async () => {
    if (!user || !course) return

    try {
      setSubmitting(true)

      // Create enrollment request
      const { data, error } = await supabase
        .from("enrollment_requests")
        .insert({
          course_id: courseId,
          student_id: user.id,
          status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      setEnrollmentRequest(data)

      // Create notification for the instructor
      if (course.instructor) {
        await supabase.from("notifications").insert({
          user_id: course.instructor.id,
          title: "New Enrollment Request",
          message: `A student has requested to enroll in ${course.code}: ${course.title}`,
          type: "enrollment_request",
          read: false,
          link: `/dashboard/courses/${courseId}/requests`,
          related_id: data.id,
        })
      }

      toast({
        title: "Request Submitted",
        description: "Your enrollment request has been submitted and is pending approval",
      })
    } catch (error) {
      console.error("Error submitting enrollment request:", error)
      toast({
        title: "Error",
        description: "Failed to submit enrollment request",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!enrollmentRequest) return

    try {
      setSubmitting(true)

      const { error } = await supabase.from("enrollment_requests").delete().eq("id", enrollmentRequest.id)

      if (error) throw error

      setEnrollmentRequest(null)

      toast({
        title: "Request Cancelled",
        description: "Your enrollment request has been cancelled",
      })
    } catch (error) {
      console.error("Error cancelling enrollment request:", error)
      toast({
        title: "Error",
        description: "Failed to cancel enrollment request",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-24">
        <LoadingSpinner text="Checking enrollment status..." />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Course not found</p>
      </div>
    )
  }

  if (isEnrolled) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">You are enrolled in this course</span>
            </div>
            {onEnrollmentChange && (
              <Button variant="outline" size="sm" onClick={onEnrollmentChange}>
                View Course
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Enrollment</CardTitle>
        <CardDescription>Request to join this course</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{course.title}</h3>
            <p className="text-sm text-muted-foreground">
              {course.code} • {course.department}
            </p>
          </div>
        </div>

        {enrollmentRequest && (
          <div className="p-4 rounded-md border">
            <div className="flex items-center gap-2">
              {enrollmentRequest.status === "pending" ? (
                <Clock className="h-5 w-5 text-yellow-500" />
              ) : enrollmentRequest.status === "approved" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {enrollmentRequest.status === "pending"
                  ? "Enrollment request pending"
                  : enrollmentRequest.status === "approved"
                    ? "Enrollment request approved"
                    : "Enrollment request rejected"}
              </span>
            </div>
            {enrollmentRequest.status === "pending" && (
              <p className="text-sm text-muted-foreground mt-2">
                Your request is being reviewed by the instructor. You will be notified once it's processed.
              </p>
            )}
            {enrollmentRequest.status === "rejected" && (
              <p className="text-sm text-muted-foreground mt-2">
                Your enrollment request was not approved. Please contact the instructor for more information.
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!enrollmentRequest ? (
          <Button onClick={handleEnrollmentRequest} disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                <span>Submitting Request...</span>
              </>
            ) : (
              "Request Enrollment"
            )}
          </Button>
        ) : enrollmentRequest.status === "pending" ? (
          <Button variant="outline" onClick={handleCancelRequest} disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                <span>Cancelling...</span>
              </>
            ) : (
              "Cancel Request"
            )}
          </Button>
        ) : enrollmentRequest.status === "approved" ? (
          <Button onClick={onEnrollmentChange} className="w-full">
            View Course
          </Button>
        ) : (
          <Button variant="outline" onClick={handleEnrollmentRequest} disabled={submitting} className="w-full">
            Request Again
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
