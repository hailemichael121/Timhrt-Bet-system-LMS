"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"

interface CourseEnrollmentsProps {
  courseId: string
}

interface Student {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  student_id: string | null
  email: string | null
}

interface Enrollment {
  id: string
  student_id: string
  course_id: string
  status: string
  grade: string | null
  profiles: Student
}

export function CourseEnrollments({ courseId }: CourseEnrollmentsProps) {
  const { user, profile } = useCurrentUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollingStudent, setEnrollingStudent] = useState<string | null>(null)

  const isTeacherOrAdmin = profile?.role === "admin" || profile?.role === "teacher"

  useEffect(() => {
    fetchEnrollments()
  }, [courseId])

  const fetchEnrollments = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          id,
          student_id,
          course_id,
          status,
          grade,
          profiles (
            id,
            first_name,
            last_name,
            avatar_url,
            student_id,
            email
          )
        `)
        .eq("course_id", courseId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setEnrollments(data || [])
    } catch (error: any) {
      console.error("Error fetching enrollments:", error.message)
      toast({
        title: "Error",
        description: "Failed to load enrollments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableStudents = async () => {
    try {
      // Get all students
      const { data: students, error: studentsError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url, student_id, email")
        .eq("role", "student")

      if (studentsError) throw studentsError

      // Get enrolled student IDs
      const enrolledStudentIds = enrollments.map((e) => e.student_id)

      // Filter out already enrolled students
      const available = students?.filter((student) => !enrolledStudentIds.includes(student.id)) || []

      setAvailableStudents(available)
    } catch (error: any) {
      console.error("Error fetching available students:", error.message)
      toast({
        title: "Error",
        description: "Failed to load available students",
        variant: "destructive",
      })
    }
  }

  const handleEnrollStudent = async (studentId: string) => {
    try {
      setEnrollingStudent(studentId)

      const { data, error } = await supabase
        .from("enrollments")
        .insert({
          student_id: studentId,
          course_id: courseId,
          status: "active",
        })
        .select(`
          id,
          student_id,
          course_id,
          status,
          grade,
          profiles (
            id,
            first_name,
            last_name,
            avatar_url,
            student_id,
            email
          )
        `)
        .single()

      if (error) throw error

      // Create notification for the student
      await supabase.from("notifications").insert({
        user_id: studentId,
        title: "New Course Enrollment",
        message: "You have been enrolled in a new course",
        type: "enrollment",
        read: false,
        link: `/dashboard/courses/${courseId}`,
        related_id: courseId,
      })

      setEnrollments((prev) => [data, ...prev])
      setAvailableStudents((prev) => prev.filter((s) => s.id !== studentId))

      toast({
        title: "Student enrolled",
        description: "The student has been enrolled in this course",
      })
    } catch (error: any) {
      console.error("Error enrolling student:", error.message)
      toast({
        title: "Enrollment failed",
        description: error.message || "Failed to enroll student",
        variant: "destructive",
      })
    } finally {
      setEnrollingStudent(null)
    }
  }

  const handleUpdateGrade = async (enrollmentId: string, grade: string) => {
    try {
      const { error } = await supabase.from("enrollments").update({ grade }).eq("id", enrollmentId)

      if (error) throw error

      // Update local state
      setEnrollments((prev) => prev.map((e) => (e.id === enrollmentId ? { ...e, grade } : e)))

      // Get student ID for notification
      const enrollment = enrollments.find((e) => e.id === enrollmentId)

      if (enrollment) {
        // Create notification for the student
        await supabase.from("notifications").insert({
          user_id: enrollment.student_id,
          title: "Grade Updated",
          message: `Your grade has been updated for a course`,
          type: "grade",
          read: false,
          link: `/dashboard/courses/${courseId}`,
          related_id: courseId,
        })
      }

      toast({
        title: "Grade updated",
        description: "The student's grade has been updated",
      })
    } catch (error: any) {
      console.error("Error updating grade:", error.message)
      toast({
        title: "Update failed",
        description: error.message || "Failed to update grade",
        variant: "destructive",
      })
    }
  }

  // Filter enrolled students based on search query
  const filteredEnrollments = enrollments.filter((enrollment) => {
    const student = enrollment.profiles
    const fullName = `${student.first_name || ""} ${student.last_name || ""}`.toLowerCase()
    const studentId = student.student_id?.toLowerCase() || ""
    const email = student.email?.toLowerCase() || ""

    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      studentId.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase())
    )
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Enrolled Students</CardTitle>
          <CardDescription>Manage students enrolled in this course</CardDescription>
        </div>

        {isTeacherOrAdmin && (
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (open) fetchAvailableStudents()
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                Enroll Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enroll Student</DialogTitle>
                <DialogDescription>Select a student to enroll in this course</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {availableStudents.length > 0 ? (
                  availableStudents.map((student) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={student.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>
                            {student.first_name?.[0] || ""}
                            {student.last_name?.[0] || ""}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{student.student_id || student.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleEnrollStudent(student.id)}
                        disabled={enrollingStudent === student.id}
                      >
                        {enrollingStudent === student.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          "Enroll"
                        )}
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No students available for enrollment</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
                {isTeacherOrAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isTeacherOrAdmin ? 5 : 4} className="h-24 text-center">
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEnrollments.length > 0 ? (
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
                            <AvatarImage src={enrollment.profiles.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {enrollment.profiles.first_name?.[0] || ""}
                              {enrollment.profiles.last_name?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {enrollment.profiles.first_name} {enrollment.profiles.last_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.profiles.student_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isTeacherOrAdmin ? (
                          <Input
                            type="text"
                            value={enrollment.grade || ""}
                            onChange={(e) => handleUpdateGrade(enrollment.id, e.target.value)}
                            className="h-8 w-20"
                          />
                        ) : (
                          enrollment.grade || "N/A"
                        )}
                      </TableCell>
                      {isTeacherOrAdmin && (
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              ) : (
                <TableRow>
                  <TableCell colSpan={isTeacherOrAdmin ? 5 : 4} className="text-center h-24 text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
