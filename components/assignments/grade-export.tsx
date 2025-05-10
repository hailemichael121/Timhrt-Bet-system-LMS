"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { supabase } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "@/components/ui/use-toast"
import { BookLoader } from "@/components/animations/book-loader"
import { motion } from "framer-motion"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"

export function GradeExport() {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState("csv")
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [includeStudentDetails, setIncludeStudentDetails] = useState(true)
  const [includeAssignmentDetails, setIncludeAssignmentDetails] = useState(true)
  const [includeFeedback, setIncludeFeedback] = useState(false)
  const [exportScope, setExportScope] = useState("all") // all, course, assignment
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchCourses()
    }
  }, [user])

  useEffect(() => {
    if (selectedCourse) {
      fetchAssignments()
    } else {
      setAssignments([])
      setSelectedAssignment(null)
    }
  }, [selectedCourse])

  const fetchCourses = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("courses")
        .select("id, title, code")
        .eq("instructor_id", user?.id)
        .order("title")

      if (error) throw error
      setCourses(data || [])
    } catch (err) {
      console.error("Error fetching courses:", err)
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    if (!selectedCourse) return

    try {
      const { data, error } = await supabase
        .from("assignments")
        .select("id, title, due_date")
        .eq("course_id", selectedCourse)
        .order("due_date", { ascending: false })

      if (error) throw error
      setAssignments(data || [])
    } catch (err) {
      console.error("Error fetching assignments:", err)
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)

      // Build the query based on the selected scope
      let query: any

      if (exportScope === "all") {
        // Get all graded submissions for courses taught by this teacher
        const { data: teacherCourses, error: coursesError } = await supabase
          .from("courses")
          .select("id")
          .eq("instructor_id", user?.id)

        if (coursesError) throw coursesError
        if (!teacherCourses || teacherCourses.length === 0) {
          throw new Error("No courses found")
        }

        const courseIds = teacherCourses.map((course) => course.id)

        // Get assignments for these courses
        const { data: courseAssignments, error: assignmentsError } = await supabase
          .from("assignments")
          .select(`
            id, 
            title, 
            due_date, 
            points,
            course_id, 
            courses(id, title, code)
          `)
          .in("course_id", courseIds)

        if (assignmentsError) throw assignmentsError

        // Get all graded submissions
        const { data: submissions, error: submissionsError } = await supabase
          .from("submissions")
          .select(`
            id, 
            grade, 
            feedback,
            graded_at,
            assignment_id,
            student_id,
            profiles(id, first_name, last_name, email, student_id)
          `)
          .in(
            "assignment_id",
            courseAssignments.map((a) => a.id),
          )
          .not("grade", "is", null)

        if (submissionsError) throw submissionsError

        // Format data
        query = submissions.map((submission) => {
          const assignment = courseAssignments.find((a) => a.id === submission.assignment_id)
          const course = assignment.courses

          const row: Record<string, any> = {
            "Student Name": `${submission.profiles.first_name} ${submission.profiles.last_name}`,
            Grade: submission.grade,
            Percentage: ((submission.grade / assignment.points) * 100).toFixed(1) + "%",
          }

          if (includeStudentDetails) {
            row["Student ID"] = submission.profiles.student_id
            row["Student Email"] = submission.profiles.email
          }

          if (includeAssignmentDetails) {
            row["Assignment"] = assignment.title
            row["Course"] = course.code
            row["Course Title"] = course.title
            row["Max Points"] = assignment.points
          }

          if (includeFeedback) {
            row["Feedback"] = submission.feedback || ""
          }

          return row
        })
      } else if (exportScope === "course" && selectedCourse) {
        // Get assignments for this course
        const { data: courseAssignments, error: assignmentsError } = await supabase
          .from("assignments")
          .select(`
            id, 
            title, 
            due_date, 
            points
          `)
          .eq("course_id", selectedCourse)

        if (assignmentsError) throw assignmentsError

        // Get course details
        const { data: course, error: courseError } = await supabase
          .from("courses")
          .select("id, title, code")
          .eq("id", selectedCourse)
          .single()

        if (courseError) throw courseError

        // Get all students enrolled in this course
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select(`
            student_id,
            profiles(id, first_name, last_name, email, student_id)
          `)
          .eq("course_id", selectedCourse)
          .eq("status", "active")

        if (enrollmentsError) throw enrollmentsError

        // Get all graded submissions for this course
        const { data: submissions, error: submissionsError } = await supabase
          .from("submissions")
          .select(`
            id, 
            grade, 
            feedback,
            assignment_id,
            student_id
          `)
          .in(
            "assignment_id",
            courseAssignments.map((a) => a.id),
          )
          .not("grade", "is", null)

        if (submissionsError) throw submissionsError

        // Format data - create a grade report for all students and assignments
        query = enrollments.map((enrollment) => {
          const student = enrollment.profiles

          const row: Record<string, any> = {
            "Student Name": `${student.first_name} ${student.last_name}`,
          }

          if (includeStudentDetails) {
            row["Student ID"] = student.student_id
            row["Student Email"] = student.email
          }

          // Add a column for each assignment
          courseAssignments.forEach((assignment) => {
            const submission = submissions.find((s) => s.assignment_id === assignment.id && s.student_id === student.id)

            if (includeAssignmentDetails) {
              row[`${assignment.title} (${assignment.points}pts)`] = submission?.grade || "Not Submitted"
            } else {
              row[assignment.title] = submission?.grade || "Not Submitted"
            }

            if (includeFeedback && submission) {
              row[`${assignment.title} Feedback`] = submission.feedback || ""
            }
          })

          // Calculate total and average if we have assignments
          if (courseAssignments.length > 0) {
            const studentSubmissions = submissions.filter((s) => s.student_id === student.id)

            if (studentSubmissions.length > 0) {
              const totalPoints = studentSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0)
              const maxPoints = studentSubmissions.reduce((sum, s) => {
                const assignment = courseAssignments.find((a) => a.id === s.assignment_id)
                return sum + (assignment?.points || 0)
              }, 0)

              row["Total Points"] = totalPoints
              row["Max Points"] = maxPoints
              row["Average"] = maxPoints > 0 ? ((totalPoints / maxPoints) * 100).toFixed(1) + "%" : "N/A"
            } else {
              row["Total Points"] = "0"
              row["Max Points"] = "0"
              row["Average"] = "N/A"
            }
          }

          return row
        })
      } else if (exportScope === "assignment" && selectedAssignment) {
        // Get assignment details
        const { data: assignment, error: assignmentError } = await supabase
          .from("assignments")
          .select(`
            id, 
            title, 
            due_date, 
            points,
            course_id,
            courses(id, title, code)
          `)
          .eq("id", selectedAssignment)
          .single()

        if (assignmentError) throw assignmentError

        // Get all students enrolled in this course
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from("enrollments")
          .select(`
            student_id,
            profiles(id, first_name, last_name, email, student_id)
          `)
          .eq("course_id", assignment.course_id)
          .eq("status", "active")

        if (enrollmentsError) throw enrollmentsError

        // Get all submissions for this assignment
        const { data: submissions, error: submissionsError } = await supabase
          .from("submissions")
          .select(`
            id, 
            grade, 
            feedback,
            submitted_at,
            student_id
          `)
          .eq("assignment_id", selectedAssignment)

        if (submissionsError) throw submissionsError

        // Format data - detailed report for a single assignment
        query = enrollments.map((enrollment) => {
          const student = enrollment.profiles
          const submission = submissions.find((s) => s.student_id === student.id)

          const row: Record<string, any> = {
            "Student Name": `${student.first_name} ${student.last_name}`,
            Status: submission ? (submission.grade !== null ? "Graded" : "Submitted") : "Not Submitted",
            Grade: submission?.grade !== null ? submission.grade : "N/A",
          }

          if (includeStudentDetails) {
            row["Student ID"] = student.student_id
            row["Student Email"] = student.email
          }

          if (includeAssignmentDetails) {
            row["Assignment"] = assignment.title
            row["Course"] = assignment.courses.code
            row["Max Points"] = assignment.points

            if (submission?.grade !== null) {
              row["Percentage"] = ((submission.grade / assignment.points) * 100).toFixed(1) + "%"
            } else {
              row["Percentage"] = "N/A"
            }
          }

          if (includeFeedback) {
            row["Feedback"] = submission?.feedback || ""
          }

          if (submission) {
            row["Submission Date"] = submission.submitted_at
              ? new Date(submission.submitted_at).toLocaleDateString()
              : "N/A"
          } else {
            row["Submission Date"] = "Not Submitted"
          }

          return row
        })
      }

      // Convert to the selected format
      let content: string
      let fileName: string
      let mimeType: string

      if (exportFormat === "csv") {
        content = convertToCSV(query, includeHeaders)
        fileName = `grades-export-${new Date().toISOString().split("T")[0]}.csv`
        mimeType = "text/csv"
      } else {
        // JSON format
        content = JSON.stringify(query, null, 2)
        fileName = `grades-export-${new Date().toISOString().split("T")[0]}.json`
        mimeType = "application/json"
      }

      // Trigger download
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `Grades exported as ${fileName}`,
      })
    } catch (err) {
      console.error("Error exporting grades:", err)
      toast({
        title: "Export Failed",
        description: "There was an error exporting the grades",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const convertToCSV = (data: Record<string, any>[], includeHeaders: boolean): string => {
    if (!data || data.length === 0) return ""

    // Get all possible headers from all rows
    const headers = new Set<string>()
    data.forEach((row) => {
      Object.keys(row).forEach((key) => headers.add(key))
    })

    // Convert headers set to array and ensure consistent ordering
    const headerArray = Array.from(headers)

    // Build CSV content
    let csv = includeHeaders ? headerArray.map((header) => `"${header}"`).join(",") + "\n" : ""

    // Add data rows
    data.forEach((row) => {
      const csvRow = headerArray
        .map((header) => {
          const value = row[header] !== undefined ? row[header] : ""
          // Escape quotes and wrap in quotes
          return `"${String(value).replace(/"/g, '""')}"`
        })
        .join(",")
      csv += csvRow + "\n"
    })

    return csv
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <BookLoader />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Export Grades</CardTitle>
          <CardDescription>Export student grades and performance data for your records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium mb-2">Export Scope</h3>
              <RadioGroup value={exportScope} onValueChange={setExportScope} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All My Courses</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="course" id="course" disabled={courses.length === 0} />
                  <Label htmlFor="course">Single Course</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="assignment" id="assignment" disabled={courses.length === 0} />
                  <Label htmlFor="assignment">Single Assignment</Label>
                </div>
              </RadioGroup>
            </div>

            {(exportScope === "course" || exportScope === "assignment") && (
              <div>
                <Label htmlFor="course-select">Select Course</Label>
                <Select value={selectedCourse || ""} onValueChange={setSelectedCourse}>
                  <SelectTrigger id="course-select" className="mt-1">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code}: {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {exportScope === "assignment" && selectedCourse && (
              <div>
                <Label htmlFor="assignment-select">Select Assignment</Label>
                <Select
                  value={selectedAssignment || ""}
                  onValueChange={setSelectedAssignment}
                  disabled={assignments.length === 0}
                >
                  <SelectTrigger id="assignment-select" className="mt-1">
                    <SelectValue
                      placeholder={assignments.length === 0 ? "No assignments available" : "Select an assignment"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {assignments.map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <h3 className="text-base font-medium mb-2">Export Format</h3>
              <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex items-center gap-1">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    JSON
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <h3 className="text-base font-medium mb-2">Export Options</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-headers" checked={includeHeaders} onCheckedChange={setIncludeHeaders} />
                  <label
                    htmlFor="include-headers"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include column headers {exportFormat === "csv" ? "(CSV only)" : ""}
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="student-details"
                    checked={includeStudentDetails}
                    onCheckedChange={setIncludeStudentDetails}
                  />
                  <label
                    htmlFor="student-details"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include student details (ID, email)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assignment-details"
                    checked={includeAssignmentDetails}
                    onCheckedChange={setIncludeAssignmentDetails}
                  />
                  <label
                    htmlFor="assignment-details"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include assignment details
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="include-feedback" checked={includeFeedback} onCheckedChange={setIncludeFeedback} />
                  <label
                    htmlFor="include-feedback"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include feedback
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleExport}
            disabled={
              exporting ||
              (exportScope === "course" && !selectedCourse) ||
              (exportScope === "assignment" && !selectedAssignment)
            }
            className="ml-auto"
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Grades
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
