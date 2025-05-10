"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { Search, CheckCircle, XCircle, Filter, BookOpen } from "lucide-react"

export function EnrollmentApproval() {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [filteredRequests, setFilteredRequests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("pending")

  useEffect(() => {
    if (user) {
      fetchEnrollmentRequests()
    }
  }, [user])

  useEffect(() => {
    filterRequests()
  }, [requests, searchQuery, filter])

  const fetchEnrollmentRequests = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("enrollment_requests")
        .select(`
          id,
          status,
          created_at,
          message,
          student:student_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url,
            student_id
          ),
          course:course_id (
            id,
            title,
            code,
            department
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setRequests(data || [])
      setFilteredRequests(data?.filter((r) => r.status === "pending") || [])
    } catch (error) {
      console.error("Error fetching enrollment requests:", error)
      toast({
        title: "Error",
        description: "Failed to load enrollment requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterRequests = () => {
    let filtered = [...requests]

    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter((request) => request.status === filter)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (request) =>
          request.student?.first_name?.toLowerCase().includes(query) ||
          request.student?.last_name?.toLowerCase().includes(query) ||
          request.student?.email?.toLowerCase().includes(query) ||
          request.student?.student_id?.toLowerCase().includes(query) ||
          request.course?.title?.toLowerCase().includes(query) ||
          request.course?.code?.toLowerCase().includes(query) ||
          request.course?.department?.toLowerCase().includes(query),
      )
    }

    setFilteredRequests(filtered)
  }

  const handleApproveRequest = async (requestId: string, studentId: string, courseId: string) => {
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
      setRequests((prevRequests) =>
        prevRequests.map((request) => (request.id === requestId ? { ...request, status: "approved" } : request)),
      )

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

  const handleRejectRequest = async (requestId: string, studentId: string, courseId: string) => {
    try {
      setProcessing(requestId)

      // Update request status
      const { error: updateError } = await supabase
        .from("enrollment_requests")
        .update({ status: "rejected" })
        .eq("id", requestId)

      if (updateError) throw updateError

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
      setRequests((prevRequests) =>
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrollment Requests</CardTitle>
        <CardDescription>Manage student enrollment requests for courses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, email, or course..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select className="border rounded p-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner text="Loading enrollment requests..." />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
            <p className="text-muted-foreground">No enrollment requests found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
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
                            <AvatarImage src={request.student?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {getInitials(request.student?.first_name, request.student?.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {request.student?.first_name} {request.student?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{request.student?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.course?.code}</div>
                          <div className="text-xs text-muted-foreground">{request.course?.title}</div>
                        </div>
                      </TableCell>
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
                              onClick={() => handleApproveRequest(request.id, request.student?.id, request.course?.id)}
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
                              onClick={() => handleRejectRequest(request.id, request.student?.id, request.course?.id)}
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
      </CardContent>
    </Card>
  )
}
