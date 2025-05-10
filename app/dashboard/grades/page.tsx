"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentUser } from "@/hooks/use-current-user"
import { PageTitle } from "@/components/page-title"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Filter, Eye, FileText } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function GradesPage() {
  const { user, profile, isLoading } = useCurrentUser()
  const [activeTab, setActiveTab] = useState("current")

  if (isLoading) {
    return <LoadingSpinner />
  }

  // Mock data for grades
  const currentGrades = [
    {
      id: "1",
      course: "Data Structures and Algorithms",
      code: "CS301",
      assignment: "Implement a Binary Search Tree",
      grade: 92,
      maxGrade: 100,
      feedback: "Excellent implementation with good time complexity analysis.",
      submittedAt: "2023-04-15",
      gradedAt: "2023-04-18",
    },
    {
      id: "2",
      course: "C++ Programming I",
      code: "CS201",
      assignment: "Create a Class Hierarchy",
      grade: 85,
      maxGrade: 100,
      feedback: "Good work, but could improve encapsulation.",
      submittedAt: "2023-04-10",
      gradedAt: "2023-04-14",
    },
    {
      id: "3",
      course: "Database Systems",
      code: "CS401",
      assignment: "Design a Database Schema",
      grade: 88,
      maxGrade: 100,
      feedback: "Well-designed schema, but missing some normalization.",
      submittedAt: "2023-04-05",
      gradedAt: "2023-04-09",
    },
    {
      id: "4",
      course: "Software Engineering Principles",
      code: "SE301",
      assignment: "Software Requirements Document",
      grade: null,
      maxGrade: 100,
      feedback: null,
      submittedAt: "2023-04-20",
      gradedAt: null,
    },
  ]

  const pastGrades = [
    {
      id: "5",
      course: "Introduction to Programming",
      code: "CS101",
      assignment: "Basic Algorithms",
      grade: 95,
      maxGrade: 100,
      feedback: "Outstanding work!",
      submittedAt: "2023-01-15",
      gradedAt: "2023-01-18",
    },
    {
      id: "6",
      course: "Web Development Basics",
      code: "CS150",
      assignment: "HTML/CSS Project",
      grade: 90,
      maxGrade: 100,
      feedback: "Great design and implementation.",
      submittedAt: "2023-01-10",
      gradedAt: "2023-01-14",
    },
  ]

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return "bg-gray-200 text-gray-700"
    if (grade >= 90) return "bg-green-100 text-green-800 border-green-300"
    if (grade >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-300"
    if (grade >= 70) return "bg-amber-100 text-amber-800 border-amber-300"
    if (grade >= 60) return "bg-orange-100 text-orange-800 border-orange-300"
    return "bg-red-100 text-red-800 border-red-300"
  }

  const getGradeLabel = (grade: number | null) => {
    if (grade === null) return "Pending"
    if (grade >= 90) return "A"
    if (grade >= 80) return "B"
    if (grade >= 70) return "C"
    if (grade >= 60) return "D"
    return "F"
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageTitle title="Grades" description="View and track your academic performance" />

      <div className="flex justify-between items-center">
        <Tabs defaultValue="current" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="current">Current Semester</TabsTrigger>
              <TabsTrigger value="past">Past Semesters</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>All Courses</DropdownMenuItem>
                  <DropdownMenuItem>CS301 - Data Structures</DropdownMenuItem>
                  <DropdownMenuItem>CS201 - C++ Programming</DropdownMenuItem>
                  <DropdownMenuItem>CS401 - Database Systems</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <TabsContent value="current" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Semester Grades</CardTitle>
                <CardDescription>View your grades for the current semester</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentGrades.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div>{item.course}</div>
                          <div className="text-xs text-muted-foreground">{item.code}</div>
                        </TableCell>
                        <TableCell>{item.assignment}</TableCell>
                        <TableCell>
                          {item.grade !== null ? (
                            <Badge variant="outline" className={getGradeColor(item.grade)}>
                              {item.grade}/{item.maxGrade} ({getGradeLabel(item.grade)})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{item.submittedAt}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/assignments/${item.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade Summary</CardTitle>
                <CardDescription>Your overall performance this semester</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Current GPA</p>
                    <div className="text-2xl font-bold">3.7</div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Completed Assignments</p>
                    <div className="text-2xl font-bold">3/4</div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Average Grade</p>
                    <div className="text-2xl font-bold">88.3%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Past Semester Grades</CardTitle>
                <CardDescription>View your grades from previous semesters</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastGrades.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div>{item.course}</div>
                          <div className="text-xs text-muted-foreground">{item.code}</div>
                        </TableCell>
                        <TableCell>{item.assignment}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getGradeColor(item.grade)}>
                            {item.grade}/{item.maxGrade} ({getGradeLabel(item.grade)})
                          </Badge>
                        </TableCell>
                        <TableCell>{item.submittedAt}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/assignments/${item.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Grade Analytics</CardTitle>
                <CardDescription>Visualize your academic performance over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium">Grade Analytics</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Detailed grade analytics will be available here, showing your performance trends, comparison with
                    class averages, and areas for improvement.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
