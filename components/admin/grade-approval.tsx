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
import { Search, CheckCircle, XCircle, Filter, FileText, Eye } from "lucide-react"
import Link from "next/link"

export function GradeApproval() {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("pending")

  useEffect(() => {
    if (user) {
      fetchSubmissions()
    }
  }, [user])

  useEffect(() => {
    filterSubmissions()
  }, [submissions, searchQuery, filter])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("submissions")
        .select(`
          id,
          grade,
          feedback,
          submitted_at,
          graded_at,
          needs_review,
          student:student_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          ),
          assignment:assignment_id (
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
        `)
        .order("submitted_at", { ascending: false })

      if (error) throw error

      // Filter submissions that need review or have been reviewed
      const filteredData = data?.filter((submission) => submission.grade !== null) || []

      setSubmissions(filteredData)
      setFilteredSubmissions(filteredData.filter((s) => s.needs_review === true))
    } catch (error) {
      console.error("Error fetching submissions:", error)
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterSubmissions = () => {
    let filtered = [...submissions]

    // Apply status filter
    if (filter === "pending") {
      filtered = filtered.filter((submission) => submission.needs_review === true)
    } else if (filter === "approved") {
      filtered = filtered.filter((submission) => submission.needs_review === false)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (submission) =>
          submission.student?.first_name?.toLowerCase().includes(query) ||
          submission.student?.last_name?.toLowerCase().includes(query) ||
          submission.student?.email?.toLowerCase().includes(query) ||
          submission.assignment?.title?.toLowerCase().includes(query) ||
          submission.assignment?.courses?.code?.toLowerCase().includes(query) ||
          submission.assignment?.courses?.title?.toLowerCase().includes(query),
      )
    }

    setFilteredSubmissions(filtered)
  }

  const handleApproveGrade = async (submissionId: string, studentId: string) => {
    try {
      setProcessing(submissionId)

      // Update submission status
      const { error } = await supabase.from("submissions").update({ needs_review: false }).eq("id", submissionId)

      if (error) throw error

      // Create notification for the student
      await supabase.from("notifications").insert({
        user_id: studentId,
        title: "Grade Approved",
        message: "Your grade has been approved by an administrator",
        type: "grade_approved",
        read: false,
        link: `/dashboard/assignments/${submissionId}`,
        related_id: submissionId,
      })

      // Update local state
      setSubmissions((prevSubmissions) =>
        prevSubmissions.map((submission) =>
          submission.id === submissionId ? { ...submission, needs_review: false } : submission,
        ),
      )

      toast({
        title: "Grade Approved",
        description: "The grade has been approved and the student has been notified",
      })
    } catch (error) {
      console.error("Error approving grade:", error)
      toast({
        title: "Error",
        description: "Failed to approve grade",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectGrade = async (submissionId: string, studentId: string, teacherId: string) => {
    try {
      setProcessing(submissionId)

      // Update submission status
      const { error } = await supabase
        .from("submissions")
        .update({
          needs_review: false,
          grade: null,
          feedback: null,
          graded_at: null,
        })
        .eq("id", submissionId)

      if (error) throw error

      // Create notification for the student
      await supabase.from("notifications").insert({
        user_id: studentId,
        title: "Grade Rejected",
        message: "Your grade has been rejected and will be reassessed",
        type: "grade_rejected",
        read: false,
        link: `/dashboard/assignments/${submissionId}`,
        related_id: submissionId,
      })

      // Create notification for the teacher
      await supabase.from("notifications").insert({
        user_id: teacherId,
        title: "Grade Rejected",
        message: "An administrator has rejected a grade you assigned. Please reassess.",
        type: "grade_rejected",
        read: false,
        link: `/dashboard/grading/${submissionId}`,
        related_id: submissionId,
      })

      // Update local state
      setSubmissions((prevSubmissions) => prevSubmissions.filter((submission) => submission.id !== submissionId))

      toast({
        title: "Grade Rejected",
        description: "The grade has been rejected and will be reassessed",
      })
    } catch (error) {
      console.error("Error rejecting grade:", error)
      toast({
        title: "Error",
        description: "Failed to reject grade",
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
        <CardTitle>Grade Approval</CardTitle>
        <CardDescription>Review and approve grades assigned by teachers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, email, or assignment..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select className="border rounded p-2 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="all">All Graded</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner text="Loading submissions..." />
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-2" />
            <p className="text-muted-foreground">No submissions found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredSubmissions.map((submission) => (
                    <motion.tr
                      key={submission.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={submission.student?.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {getInitials(submission.student?.first_name, submission.student?.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {submission.student?.first_name} {submission.student?.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{submission.student?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{submission.assignment?.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {submission.assignment?.courses?.code}: {submission.assignment?.courses?.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {submission.grade}/{submission.assignment?.points}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {((submission.grade / submission.assignment?.points) * 100).toFixed(1)}%
                        </div>
                      </TableCell>
                      <TableCell>
                        {submission.needs_review ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Needs Review
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Approved
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(submission.submitted_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/submissions/${submission.id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {submission.needs_review && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 h-8 w-8 p-0"
                                onClick={() => handleApproveGrade(submission.id, submission.student?.id)}
                                disabled={processing === submission.id}
                              >
                                {processing === submission.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 h-8 w-8 p-0"
                                onClick={() =>
                                  handleRejectGrade(
                                    submission.id,
                                    submission.student?.id,
                                    submission.assignment?.teacher_id,
                                  )
                                }
                                disabled={processing === submission.id}
                              >
                                {processing === submission.id ? (
                                  <LoadingSpinner size="sm" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
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
