"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, GraduationCap, FileText, Users } from "lucide-react"
import { useCurrentUser } from "@/hooks/use-current-user"
import { mockCourses, mockStudents, mockAssignments } from "@/lib/mock-data"

export function DashboardCards() {
  const { user } = useCurrentUser()

  // Filter data based on user role
  const courseCount =
    user?.role === "student"
      ? mockCourses.filter((course) => course.enrolledStudents.includes(user.id)).length
      : mockCourses.length

  const assignmentCount =
    user?.role === "student"
      ? mockAssignments.filter((assignment) =>
          mockCourses.some((course) => course.enrolledStudents.includes(user.id) && course.id === assignment.courseId),
        ).length
      : mockAssignments.length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Courses</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{courseCount}</div>
          <p className="text-xs text-muted-foreground">
            {user?.role === "student" ? "Enrolled Courses" : "Total Courses"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assignments</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{assignmentCount}</div>
          <p className="text-xs text-muted-foreground">
            {user?.role === "student" ? "Pending Assignments" : "Total Assignments"}
          </p>
        </CardContent>
      </Card>

      {user?.role !== "student" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStudents.length}</div>
            <p className="text-xs text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">87%</div>
          <p className="text-xs text-muted-foreground">
            {user?.role === "student" ? "Your Completion Rate" : "Average Completion Rate"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
