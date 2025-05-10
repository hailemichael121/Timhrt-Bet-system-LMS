"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { motion } from "framer-motion"
import {
  LineChart,
  Line,
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
} from "recharts"

export function StudentAnalytics() {
  const { user, profile } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [gradeData, setGradeData] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [courseProgressData, setCourseProgressData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Fetch enrolled courses
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("*, courses(*)")
          .eq("student_id", user.id)

        if (!enrollments || enrollments.length === 0) {
          setLoading(false)
          return
        }

        // Fetch assignments and submissions
        const { data: assignments } = await supabase
          .from("assignments")
          .select("*, submissions(*)")
          .in(
            "course_id",
            enrollments.map((e) => e.course_id),
          )
          .eq("submissions.student_id", user.id)

        // Process grade data
        const grades = enrollments.map((enrollment) => ({
          name: enrollment.courses.code,
          grade: enrollment.grade ? Number.parseFloat(enrollment.grade) : 0,
        }))

        // Generate mock attendance data (in a real app, this would come from the database)
        const attendance = enrollments.map((enrollment) => ({
          name: enrollment.courses.code,
          present: Math.floor(Math.random() * 30) + 10,
          absent: Math.floor(Math.random() * 5),
          late: Math.floor(Math.random() * 3),
        }))

        // Generate course progress data
        const progress = enrollments.map((enrollment) => {
          const courseAssignments = assignments?.filter((a) => a.course_id === enrollment.course_id) || []
          const completed = courseAssignments.filter((a) => a.submissions && a.submissions.length > 0).length
          const total = courseAssignments.length || 1

          return {
            name: enrollment.courses.code,
            progress: Math.round((completed / total) * 100),
            remaining: 100 - Math.round((completed / total) * 100),
          }
        })

        // Generate performance comparison data
        const performance = [
          { name: "Assignments", score: 85, average: 75 },
          { name: "Quizzes", score: 78, average: 72 },
          { name: "Projects", score: 92, average: 80 },
          { name: "Exams", score: 88, average: 76 },
        ]

        setGradeData(grades)
        setAttendanceData(attendance)
        setCourseProgressData(progress)
        setPerformanceData(performance)
      } catch (error) {
        console.error("Error fetching analytics data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [user])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading analytics..." />
      </div>
    )
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Grades</CardTitle>
                <CardDescription>Your grades across all courses</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={gradeData}
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
                    <Tooltip formatter={(value) => [`${value}%`, "Grade"]} />
                    <Legend />
                    <Bar dataKey="grade" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Your performance vs. class average</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={performanceData}
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
                    <Bar dataKey="score" name="Your Score" fill="#8884d8" />
                    <Bar dataKey="average" name="Class Average" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
                <CardDescription>Completion percentage by course</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={courseProgressData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="progress"
                    >
                      {courseProgressData.map((entry, index) => (
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
                <CardTitle>Attendance Summary</CardTitle>
                <CardDescription>Your attendance across all courses</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attendanceData}
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
                    <Bar dataKey="present" name="Present" fill="#82ca9d" />
                    <Bar dataKey="absent" name="Absent" fill="#ff8042" />
                    <Bar dataKey="late" name="Late" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Grade Analysis</CardTitle>
              <CardDescription>Breakdown of your grades by assessment type</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { name: "Week 1", assignments: 85, quizzes: 78, exams: 0 },
                    { name: "Week 2", assignments: 82, quizzes: 80, exams: 0 },
                    { name: "Week 3", assignments: 88, quizzes: 75, exams: 0 },
                    { name: "Week 4", assignments: 90, quizzes: 82, exams: 0 },
                    { name: "Week 5", assignments: 85, quizzes: 85, exams: 0 },
                    { name: "Week 6", assignments: 92, quizzes: 88, exams: 0 },
                    { name: "Week 7", assignments: 88, quizzes: 84, exams: 0 },
                    { name: "Week 8", assignments: 90, quizzes: 90, exams: 85 },
                  ]}
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
                  <Line type="monotone" dataKey="assignments" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="quizzes" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="exams" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Your attendance patterns over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { month: "Jan", attendance: 95 },
                    { month: "Feb", attendance: 98 },
                    { month: "Mar", attendance: 92 },
                    { month: "Apr", attendance: 96 },
                    { month: "May", attendance: 90 },
                    { month: "Jun", attendance: 94 },
                  ]}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, "Attendance Rate"]} />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress</CardTitle>
              <CardDescription>Your progress through course materials</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={courseProgressData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => [`${value}%`, "Completion"]} />
                  <Legend />
                  <Bar dataKey="progress" name="Completed" stackId="a" fill="#82ca9d" />
                  <Bar dataKey="remaining" name="Remaining" stackId="a" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
