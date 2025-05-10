"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockAssignments } from "@/lib/mock-data"
import { formatDate } from "@/lib/utils"
import { FileText, PlusCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/hooks/use-current-user"

interface CourseAssignmentsProps {
  courseId: string
}

export function CourseAssignments({ courseId }: CourseAssignmentsProps) {
  const { user } = useCurrentUser()

  // Get assignments for this course
  const courseAssignments = mockAssignments.filter((assignment) => assignment.courseId === courseId)

  // Sort by due date
  const sortedAssignments = [...courseAssignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>View and manage assignments for this course</CardDescription>
        </div>

        {(user?.role === "admin" || user?.role === "teacher") && (
          <Link href={`/dashboard/courses/${courseId}/assignments/create`}>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedAssignments.length > 0 ? (
            sortedAssignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{assignment.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">Due: {formatDate(assignment.dueDate)}</Badge>
                      <Badge variant="outline">Points: {assignment.points}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {user?.role === "student" ? "Submit" : "View Submissions"}
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No assignments yet</p>
              {(user?.role === "admin" || user?.role === "teacher") && (
                <p className="text-sm mt-1">Create your first assignment to get started</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
