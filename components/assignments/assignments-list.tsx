"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { mockAssignments, mockCourses } from "@/lib/mock-data"
import { formatDate } from "@/lib/utils"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"
import Link from "next/link"

export function AssignmentsList() {
  const { user } = useCurrentUser()
  const [searchQuery, setSearchQuery] = useState("")

  // Filter assignments based on user role
  const filteredAssignments =
    user?.role === "student"
      ? mockAssignments.filter((assignment) =>
          mockCourses.some((course) => course.enrolledStudents.includes(user.id) && course.id === assignment.courseId),
        )
      : mockAssignments

  // Filter by search query
  const searchedAssignments = filteredAssignments.filter(
    (assignment) =>
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mockCourses
        .find((c) => c.id === assignment.courseId)
        ?.title.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  )

  // Sort by due date
  const sortedAssignments = [...searchedAssignments].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assignments</CardTitle>
        <CardDescription>View and manage all assignments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAssignments.length > 0 ? (
                sortedAssignments.map((assignment) => {
                  const course = mockCourses.find((c) => c.id === assignment.courseId)
                  const dueDate = new Date(assignment.dueDate)
                  const isOverdue = dueDate < new Date()
                  const isDueSoon = !isOverdue && dueDate < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

                  return (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{assignment.title}</TableCell>
                      <TableCell>
                        <Link href={`/dashboard/courses/${assignment.courseId}`} className="hover:underline">
                          {course?.title}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(assignment.dueDate)}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          {user?.role === "student" ? "Submit" : "View"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No assignments found
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
