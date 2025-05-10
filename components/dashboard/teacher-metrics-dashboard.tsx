"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { motion } from "framer-motion"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts"
import { BookOpen, Users, FileText, Clock, TrendingUp, BarChart4, PieChartIcon, Eye } from "lucide-react"
import Link from "next/link"

export function TeacherMetricsDashboard() {
  const { user, profile } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    pendingGrading: 0,
    averageGrade: 0,
    completionRate: 0,
  })
  const [courseData, setCourseData] = useState<any[]>([])
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([])
  const [submissionTimeline, setSubmissionTimeline] = useState<any[]>([])
  const [studentPerformance, setStudentPerformance] = useState<any[]>([])
  const [assignmentCompletion, setAssignmentCompletion] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch courses taught by the teacher
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .eq("instructor_id", user?.id)

      if (coursesError) throw coursesError

      // Fetch enrollments for these courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("*")
        .in("course_id", courses?.map((c) => c.id) || [])

      if (enrollmentsError) throw enrollmentsError

      // Fetch assignments for these courses
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*, submissions(*)")
        .in("course_id", courses?.map((c) => c.id) || [])

      if (assignmentsError) throw assignmentsError

      // Calculate metrics
      const totalStudents = new Set(enrollments?.map((e) => e.student_id)).size
      const totalAssignments = assignments?.length || 0

      const pendingGrading = assignments?.reduce((acc, assignment) => {
        const pendingSubmissions = assignment.submissions?.filter((s) => s.grade === null).length || 0
        return acc + pendingSubmissions
      }, 0)

      const allGrades = assignments?.flatMap((assignment) =>
        assignment.submissions
          ?.filter((s) => s.grade !== null)
          .map((s) => ({
            grade: s.grade,
            maxPoints: assignment.points,
          })),
      )

      const averageGrade =
        allGrades && allGrades.length > 0
          ? allGrades.reduce((acc, curr) => acc + ((curr.grade || 0) / curr.maxPoints) * 100, 0) / allGrades.length
          : 0

      const completedSubmissions = assignments?.reduce(
        (acc, assignment) => acc + (assignment.submissions?.length || 0),
        0,
      )
      const totalPossibleSubmissions = totalAssignments * totalStudents
      const completionRate = totalPossibleSubmissions > 0 ? (completedSubmissions / totalPossibleSubmissions) * 100 : 0

      // Generate mock data for visualization
      const mockCourseData = courses?.map((course) => {
        const courseEnrollments = enrollments?.filter((e) => e.course_id === course.id).length || 0
        const courseAssignments = assignments?.filter((a) => a.course_id === course.id).length || 0
        const courseSubmissions = assignments
          ?.filter((a) => a.course_id === course.id)
          .reduce((acc, a) => acc + (a.submissions?.length || 0), 0)
        const courseCompletionRate =
          courseAssignments * courseEnrollments > 0
            ? (courseSubmissions / (courseAssignments * courseEnrollments)) * 100
            : 0

        return {
          name: course.code,
          students: courseEnrollments,
          assignments: courseAssignments,
          submissions: courseSubmissions,
          completionRate: courseCompletionRate,
        }
      })

      const mockGradeDistribution = [
        { name: "A (90-100%)", value: 35 },
        { name: "B (80-89%)", value: 25 },
        { name: "C (70-79%)", value: 20 },
        { name: "D (60-69%)", value: 15 },
        { name: "F (0-59%)", value: 5 },
      ]

      const mockSubmissionTimeline = [
        { name: "Week 1", onTime: 45, late: 5 },
        { name: "Week 2", onTime: 40, late: 10 },
        { name: "Week 3", onTime: 38, late: 12 },
        { name: "Week 4", onTime: 42, late: 8 },
        { name: "Week 5", onTime: 44, late: 6 },
        { name: "Week 6", onTime: 46, late: 4 },
      ]

      const mockStudentPerformance = Array.from({ length: 20 }, (_, i) => ({
        name: `Student ${i + 1}`,
        assignments: Math.floor(Math.random() * 100),
        participation: Math.floor(Math.random() * 100),
        z: Math.floor(Math.random() * 100),
      }))

      const mockAssignmentCompletion = assignments?.map((assignment, index) => {
        const completed = assignment.submissions?.length || 0
        const total = totalStudents
        const completionRate = total > 0 ? (completed / total) * 100 : 0

        return {
          name: `Assignment ${index + 1}`,
          completed,
          pending: total - completed,
          completionRate,
        }
      })

      setMetrics({
        totalCourses: courses?.length || 0,
        totalStudents,
        totalAssignments,
        pendingGrading,
        averageGrade,
        completionRate,
      })

      setCourseData(mockCourseData || [])
      setGradeDistribution(mockGradeDistribution)
      setSubmissionTimeline(mockSubmissionTimeline)
      setStudentPerformance(mockStudentPerformance)
      setAssignmentCompletion(mockAssignmentCompletion || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading dashboard metrics..." />
      </div>
    )
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Active courses you're teaching</p>
            <div className="mt-4">
              <Link href="/dashboard/courses/create">
                <Button variant="outline" size="sm" className="w-full">
                  Create New Course
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Total enrolled students</p>
            <Progress className="mt-2" value={metrics.completionRate} />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.completionRate.toFixed(1)}% assignment completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">{metrics.totalAssignments}</div>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-500">{metrics.pendingGrading}</div>
                <p className="text-xs text-muted-foreground">Pending Grading</p>
              </div>
            </div>
            <div className="mt-4">
              {metrics.pendingGrading > 0 && (
                <Link href="/dashboard/grading">
                  <Button variant="outline" size="sm" className="w-full">
                    Grade Submissions
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="grades" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4" />
            <span>Grades</span>
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Submissions</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>Student Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
              <CardDescription>Performance metrics across your courses</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={courseData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" name="Students" fill="#8884d8" />
                  <Bar dataKey="assignments" name="Assignments" fill="#82ca9d" />
                  <Bar dataKey="submissions" name="Submissions" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  <span>Grade Distribution</span>
                </CardTitle>
                <CardDescription>Overall grade distribution across all courses</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment Completion</CardTitle>
                <CardDescription>Completion rates for each assignment</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={assignmentCompletion}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#82ca9d" />
                    <Bar dataKey="pending" name="Pending" stackId="a" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Analysis</CardTitle>
              <CardDescription>Detailed breakdown of student grades</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={courseData.map((course) => ({
                    name: course.name,
                    averageGrade: Math.floor(Math.random() * 20) + 70, // Mock data
                    highestGrade: Math.floor(Math.random() * 10) + 90, // Mock data
                    lowestGrade: Math.floor(Math.random() * 20) + 50, // Mock data
                  }))}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="averageGrade" name="Average Grade" fill="#8884d8" />
                  <Bar dataKey="highestGrade" name="Highest Grade" fill="#82ca9d" />
                  <Bar dataKey="lowestGrade" name="Lowest Grade" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submission Timeline</CardTitle>
              <CardDescription>On-time vs. late submissions over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={submissionTimeline}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="onTime" name="On Time" stackId="a" fill="#82ca9d" />
                  <Bar dataKey="late" name="Late" stackId="a" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
              <CardDescription>Assignments vs. participation across students</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                  }}
                >
                  <CartesianGrid />
                  <XAxis type="number" dataKey="assignments" name="Assignments" unit="%" />
                  <YAxis type="number" dataKey="participation" name="Participation" unit="%" />
                  <ZAxis type="number" dataKey="z" range={[60, 400]} name="Score" unit="%" />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                  <Legend />
                  <Scatter name="Students" data={studentPerformance} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
