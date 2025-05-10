"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, BookOpen, Filter, CheckCircle, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function CourseEnrollment() {
  const { user } = useCurrentUser()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<any[]>([])
  const [filteredCourses, setFilteredCourses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchAvailableCourses()
    }
  }, [user])

  useEffect(() => {
    filterCourses()
  }, [courses, searchQuery, filter])

  const fetchAvailableCourses = async () => {
    try {
      setLoading(true)

      // Fetch all courses
      const { data: allCourses, error: coursesError } = await supabase
        .from("courses")
        .select(`
          id, 
          title, 
          code, 
          description, 
          department, 
          credits,
          instructor:instructor_id (
            id, 
            first_name, 
            last_name
          )
        `)
        .order("created_at", { ascending: false })

      if (coursesError) throw coursesError

      // Fetch user's enrollments
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user?.id)

      if (enrollmentsError) throw enrollmentsError

      // Fetch user's enrollment requests
      const { data: requests, error: requestsError } = await supabase
        .from("enrollment_requests")
        .select("course_id, status")
        .eq("student_id", user?.id)

      if (requestsError) throw requestsError

      // Mark courses as enrolled or requested
      const enrolledCourseIds = new Set(enrollments?.map((e) => e.course_id) || [])
      const requestedCourses =
        requests?.reduce(
          (acc, req) => {
            acc[req.course_id] = req.status
            return acc
          },
          {} as Record<string, string>,
        ) || {}

      const processedCourses = allCourses?.map((course) => ({
        ...course,
        enrolled: enrolledCourseIds.has(course.id),
        requestStatus: requestedCourses[course.id] || null,
      }))

      setCourses(processedCourses || [])
      setFilteredCourses(processedCourses || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: "Error",
        description: "Failed to load available courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = [...courses]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(query) ||
          course.code.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query) ||
          course.department?.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (filter !== "all") {
      if (filter === "enrolled") {
        filtered = filtered.filter((course) => course.enrolled)
      } else if (filter === "available") {
        filtered = filtered.filter((course) => !course.enrolled && !course.requestStatus)
      } else if (filter === "pending") {
        filtered = filtered.filter((course) => course.requestStatus === "pending")
      }
    }

    setFilteredCourses(filtered)
  }

  const handleEnrollRequest = async (courseId: string) => {
    if (!user) return

    try {
      setEnrollingCourseId(courseId)

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

      // Find the course to get instructor info
      const course = courses.find((c) => c.id === courseId)

      // Create notification for the instructor
      if (course?.instructor?.id) {
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

      // Update local state
      setCourses((prevCourses) =>
        prevCourses.map((course) => (course.id === courseId ? { ...course, requestStatus: "pending" } : course)),
      )

      toast({
        title: "Request Submitted",
        description: "Your enrollment request has been submitted and is pending approval",
      })
    } catch (error: any) {
      console.error("Error submitting enrollment request:", error.message)
      toast({
        title: "Error",
        description: "Failed to submit enrollment request",
        variant: "destructive",
      })
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const handleCancelRequest = async (courseId: string) => {
    if (!user) return

    try {
      setEnrollingCourseId(courseId)

      // Delete the enrollment request
      const { error } = await supabase
        .from("enrollment_requests")
        .delete()
        .eq("course_id", courseId)
        .eq("student_id", user.id)

      if (error) throw error

      // Update local state
      setCourses((prevCourses) =>
        prevCourses.map((course) => (course.id === courseId ? { ...course, requestStatus: null } : course)),
      )

      toast({
        title: "Request Cancelled",
        description: "Your enrollment request has been cancelled",
      })
    } catch (error: any) {
      console.error("Error cancelling enrollment request:", error.message)
      toast({
        title: "Error",
        description: "Failed to cancel enrollment request",
        variant: "destructive",
      })
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const getStatusBadge = (course: any) => {
    if (course.enrolled) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Enrolled
        </Badge>
      )
    }

    if (course.requestStatus === "pending") {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Pending Approval
        </Badge>
      )
    }

    if (course.requestStatus === "rejected") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Enrollment Rejected
        </Badge>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses by title, code, or department..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select className="border rounded p-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Courses</option>
            <option value="enrolled">Enrolled</option>
            <option value="available">Available</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Loading courses..." />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
          <h3 className="text-lg font-medium">No courses found</h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search or filters"
              : filter !== "all"
                ? "Try changing your filter selection"
                : "There are no courses available at the moment"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {course.code}
                          {getStatusBadge(course)}
                        </CardTitle>
                        <CardDescription className="mt-1">{course.title}</CardDescription>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm line-clamp-3">{course.description || "No description available."}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Department</p>
                          <p className="font-medium">{course.department || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Credits</p>
                          <p className="font-medium">{course.credits || "N/A"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-sm">Instructor</p>
                        <p className="font-medium text-sm">
                          {course.instructor?.first_name && course.instructor?.last_name
                            ? `${course.instructor.first_name} ${course.instructor.last_name}`
                            : "Not assigned"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    {course.enrolled ? (
                      <Link href={`/dashboard/courses/${course.id}`} className="w-full">
                        <Button variant="default" className="w-full">
                          View Course
                        </Button>
                      </Link>
                    ) : course.requestStatus === "pending" ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleCancelRequest(course.id)}
                        disabled={enrollingCourseId === course.id}
                      >
                        {enrollingCourseId === course.id ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                        )}
                        Cancel Request
                      </Button>
                    ) : course.requestStatus === "rejected" ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleEnrollRequest(course.id)}
                        disabled={enrollingCourseId === course.id}
                      >
                        {enrollingCourseId === course.id ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                        )}
                        Request Again
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => handleEnrollRequest(course.id)}
                        disabled={enrollingCourseId === course.id}
                      >
                        {enrollingCourseId === course.id ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Enroll in Course
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
