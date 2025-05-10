"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockAssignments, mockCourses } from "@/lib/mock-data"
import { formatDate } from "@/lib/utils"
import { FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface StudentAssignmentsProps {
  studentId: string
}

export function StudentAssignments({ studentId }: StudentAssignmentsProps) {
  // Get courses this student is enrolled in
  const enrolledCourses = mockCourses.filter((course) => course.enrolledStudents.includes(studentId))

  // Get assignments for these courses
  const studentAssignments = mockAssignments.filter((assignment) =>
    enrolledCourses.some((course) => course.id === assignment.courseId),
  )

  // Sort by due date
  const sortedAssignments = [...studentAssignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignments</CardTitle>
        <CardDescription>Assignments from enrolled courses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedAssignments.length > 0 ? (
            sortedAssignments.map((assignment) => {
              const course = mockCourses.find((c) => c.id === assignment.courseId)
              const dueDate = new Date(assignment.dueDate)
              const isOverdue = dueDate < new Date()
              const isDueSoon = !isOverdue && dueDate < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

              return (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{assignment.title}</h3>
                      <p className="text-sm text-muted-foreground">{course?.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">Due: {formatDate(assignment.dueDate)}</Badge>
                        <Badge variant="outline">Points: {assignment.points}</Badge>
                        {isOverdue ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : isDueSoon ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Due Soon
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Open
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Submit
                  </Button>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No assignments yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
