"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { Search, CheckCircle, XCircle, UserPlus, Clock, Filter } from "lucide-react"

interface EnrollmentManagementProps {
  courseId?: string
}

interface EnrollmentRequest {
  id: string
  student: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string
    student_id: string
    email: string
  }
  status: "pending" | "approved" | "rejected"
  created_at: string
}

interface Enrollment {
  id: string
  student: {
    id: string
    first_name: string
    last_name: string
    avatar_url: string
    student_id: string
    email: string
  }
  status: string
  grade: string | null
  created_at: string
}

export function EnrollmentManagement({ courseId }: EnrollmentManagementProps) {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    if (user) {
      fetchEnrollmentData()
    }
  }, [user, courseId])

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true)

      // Fetch enrollment requests
      let requestsQuery = supabase
        .from("enrollment_requests")
        .select(`
          id,
          status,
          created_at,
          student:student_id (
            id,
            first_name,
            last_name,
            avatar_url,
            student_id,
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (courseId) {
        requestsQuery = requestsQuery.eq("course_id", courseId)
      }

      const { data: requestsData, error: requestsError } = await requestsQuery

      if (requestsError) throw requestsError

      // Fetch enrollments
      let enrollmentsQuery = supabase
        .from("enrollments")
        .select(`
          id,
          status,
          grade,
          created_at,
          student:student_id (
            id,
            first_name,
            last_name,
            avatar_url,
            student_id,
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (courseId) {
        enrollmentsQuery = enrollmentsQuery.eq("course_id", courseId)
      }

      const { data: enrollmentsData, error: enrollmentsError } = await enrollmentsQuery

      if (enrollmentsError) throw enrollmentsError

      setEnrollmentRequests(requestsData || [])
      setEnrollments(enrollmentsData || [])
    } catch (error) {
      console.error("Error fetching enrollment data:", error)
      toast({
        title: "Error",
        description: "Failed to load enrollment data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveRequest = async (requestId: string, studentId: string) => {
    try {
      setProcessing(requestId)

      // Update request status
      const { error: updateError } = await supabase
        .from("enrollment_requests")
        .update({ status: "approved" })
        .eq("id", requestId)

      if (updateError) throw updateError

      // Create enrollment
      const { error: enrollmentError } = await supabase.from("enrollments").insert({
        course_id: courseId,
        student_id: studentId,
        status: "active",
      })

      if (enrollmentError) throw enrollmentError

      // Create notification for the student
      await supabase.from("notifications").insert({
        user_id: studentId,
        title: "Enrollment Request Approved",
        message: "Your enrollment request has been approved",
        type: "enrollment_approved",
        read: false,
        link: `/dashboard/courses/${courseId}`,
        related_id: courseId,
      })

      // Update local state
      setEnrollmentRequests((prevRequests) =>
        prevRequests.map((request) => (request.id === requestId ? { ...request, status: "approved" } : request)),
      )

      // Fetch the updated enrollment
      const { data: newEnrollment } = await supabase
        .from("enrollments")
        .select(`
          id,
          status,
          grade,
          created_at,
          student:student_id (
            id,
            first_name,
            last_name,
            avatar_url,
            student_id,
            email
          )
        `)
        .eq("course_id", courseId)
        .eq("student_id", studentId)
        .single()

      if (newEnrollment) {
        setEnrollments((prev) => [newEnrollment, ...prev])
      }

      toast({
        title: "Request Approved",
        description: "The enrollment request has been approved",
      })
    } catch (error) {
      console.error("Error approving request:", error)
      toast({
        title: "Error",
        description: "Failed to approve enrollment request",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectRequest = async (requestId: string, studentId: string) => {
    try {
      setProcessing(requestId)

      // Update request status
      const { error } = await supabase.from("enrollment_requests").update({ status: "rejected" }).eq("id", requestId)

      if (error) throw error

      // Create notification for the student
      await supabase.from("notifications").insert({
        user_id: studentId,
        title: "Enrollment Request Rejected",
        message: "Your enrollment request has been rejected",
        type: "enrollment_rejected",
        read: false,
        related_id: courseId,
      })

      // Update local state
      setEnrollmentRequests((prevRequests) =>
        prevRequests.map((request) => (request.id === requestId ? { ...request, status: "rejected" } : request)),
      )

      toast({
        title: "Request Rejected",
        description: "The enrollment request has been rejected",
      })
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast({
        title: "Error",
        description: "Failed to reject enrollment request",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleRemoveEnrollment = async (enrollmentId: string, studentId: string) => {
    try {
      setProcessing(enrollmentId)

      // Delete enrollment
      const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId)

      if (error) throw error

      // Create notification for the student
      await supabase.from("notifications").insert({
        user_id: studentId,
        title: "Removed from Course",
        message: "You have been removed from a course",
        type: "enrollment_removed",
        read: false,
        related_id: courseId,
      })

      // Update local state
      setEnrollments((prevEnrollments) => prevEnrollments.filter((enrollment) => enrollment.id !== enrollmentId))

      toast({
        title: "Student Removed",
        description: "The student has been removed from the course",
      })
    } catch (error) {
      console.error("Error removing enrollment:", error)
      toast({
        title: "Error",
        description: "Failed to remove student from course",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleUpdateGrade = async (enrollmentId: string, grade: string, studentId: string) => {
    try {
      // Update grade
      const { error } = await supabase.from("enrollments").update({ grade }).eq("id", enrollmentId)

      if (error) throw error

      // Create notification for the student
      await supabase.from("notifications").insert({
        user_id: studentId,
        title: "Grade Updated",
        message: "Your grade has been updated",
        type: "grade_updated",
        read: false,
        link: `/dashboard/courses/${courseId}`,
        related_id: courseId,
      })

      // Update local state
      setEnrollments((prevEnrollments) =>
        prevEnrollments.map((enrollment) => (enrollment.id === enrollmentId ? { ...enrollment, grade } : enrollment)),
      )

      toast({
        title: "Grade Updated",
        description: "The student's grade has been updated",
      })
    } catch (error) {
      console.error("Error updating grade:", error)
      toast({
        title: "Error",
        description: "Failed to update grade",
        variant: "destructive",
      })
    }
  }

  const filteredRequests = enrollmentRequests
    .filter((request) => {
      const studentName = `${request.student.first_name} ${request.student.last_name}`.toLowerCase()
      const studentId = request.student.student_id?.toLowerCase() || ""
      const studentEmail = request.student.email?.toLowerCase() || ""

      return (
        studentName.includes(searchQuery.toLowerCase()) ||
        studentId.includes(searchQuery.toLowerCase()) ||
        studentEmail.includes(searchQuery.toLowerCase())
      )
    })
    .filter((request) => {
      if (filter === "all") return true
      return request.status === filter
    })

  const filteredEnrollments = enrollments.filter((enrollment) => {
    const studentName = `${enrollment.student.first_name} ${enrollment.student.last_name}`.toLowerCase()
    const studentId = enrollment.student.student_id?.toLowerCase() || ""
    const studentEmail = enrollment.student.email?.toLowerCase() || ""

    return (
      studentName.includes(searchQuery.toLowerCase()) ||
      studentId.includes(searchQuery.toLowerCase()) ||
      studentEmail.includes(searchQuery.toLowerCase())
    )
  })

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment Management</CardTitle>
        <CardDescription>Manage student enrollments and requests</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requests">
              Enrollment Requests
              {enrollmentRequests.filter((r) => r.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {enrollmentRequests.filter((r) => r.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="enrolled">Enrolled Students</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select className="border rounded p-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <TabsContent value="requests">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Loading enrollment requests..." />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
                <p className="text-muted-foreground">No enrollment requests found</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredRequests.map((request) => (
                        <motion.tr
                          key={request.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={request.student.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {getInitials(request.student.first_name, request.student.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {request.student.first_name} {request.student.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{request.student.student_id}</TableCell>
                          <TableCell>
                            {request.status === "pending" ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pending
                              </Badge>
                            ) : request.status === "approved" ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            {request.status === "pending" ? (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                                  onClick={() => handleApproveRequest(request.id, request.student.id)}
                                  disabled={processing === request.id}
                                >
                                  {processing === request.id ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                                  onClick={() => handleRejectRequest(request.id, request.student.id)}
                                  disabled={processing === request.id}
                                >
                                  {processing === request.id ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {request.status === "approved" ? "Approved" : "Rejected"}
                              </span>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="enrolled">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner text="Loading enrolled students..." />
              </div>
            ) : filteredEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
                <p className="text-muted-foreground">No students enrolled</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredEnrollments.map((enrollment) => (
                        <motion.tr
                          key={enrollment.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={enrollment.student.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {getInitials(enrollment.student.first_name, enrollment.student.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {enrollment.student.first_name} {enrollment.student.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{enrollment.student.student_id}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {enrollment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="text"
                              value={enrollment.grade || ""}
                              onChange={(e) => handleUpdateGrade(enrollment.id, e.target.value, enrollment.student.id)}
                              className="h-8 w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                              onClick={() => handleRemoveEnrollment(enrollment.id, enrollment.student.id)}
                              disabled={processing === enrollment.id}
                            >
                              {processing === enrollment.id ? <LoadingSpinner size="sm" /> : "Remove"}
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
