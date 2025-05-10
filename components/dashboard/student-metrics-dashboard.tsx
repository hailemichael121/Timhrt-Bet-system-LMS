"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { BookOpen, Clock, Award, Calendar, TrendingUp, BarChart4, PieChartIcon } from "lucide-react"

export function StudentMetricsDashboard() {
  const { user, profile } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    enrolledCourses: 0,
    completedAssignments: 0,
    upcomingAssignments: 0,
    averageGrade: 0,
    attendanceRate: 0,
    coursesProgress: 0,
  })
  const [gradeData, setGradeData] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [skillsData, setSkillsData] = useState<any[]>([])
  const [activityData, setActivityData] = useState<any[]>([])
  const [comparisonData, setComparisonData] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch enrolled courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("student_id", user?.id)

      if (enrollmentsError) throw enrollmentsError

      // Fetch assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*, submissions(*)")
        .in("course_id", enrollments?.map((e) => e.course_id) || [])

      if (assignmentsError) throw assignmentsError

      // Fetch submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select("*")
        .eq("student_id", user?.id)

      if (submissionsError) throw submissionsError

      // Calculate metrics
      const now = new Date()
      const upcomingAssignments = assignments?.filter(
        (a) => new Date(a.due_date) > now && !a.submissions?.some((s) => s.student_id === user?.id),
      ).length

      const completedAssignments = submissions?.length || 0

      const grades = submissions
        ?.filter((s) => s.grade !== null)
        .map((s) => ({
          assignment: assignments?.find((a) => a.id === s.assignment_id)?.title || "Unknown",
          grade: s.grade,
          maxPoints: assignments?.find((a) => a.id === s.assignment_id)?.points || 100,
        }))

      const averageGrade =
        grades && grades.length > 0
          ? grades.reduce((acc, curr) => acc + ((curr.grade || 0) / curr.maxPoints) * 100, 0) / grades.length
          : 0

      // Generate mock data for visualization
      const mockGradeData = [
        { name: "Assignments", score: 85, average: 75 },
        { name: "Quizzes", score: 78, average: 72 },
        { name: "Projects", score: 92, average: 80 },
        { name: "Exams", score: 88, average: 76 },
      ]

      const mockAttendanceData = [
        { month: "Jan", attendance: 95 },
        { month: "Feb", attendance: 98 },
        { month: "Mar", attendance: 92 },
        { month: "Apr", attendance: 96 },
        { month: "May", attendance: 90 },
        { month: "Jun", attendance: 94 },
      ]

      const mockSkillsData = [
        { subject: "Problem Solving", A: 90, fullMark: 100 },
        { subject: "Critical Thinking", A: 85, fullMark: 100 },
        { subject: "Communication", A: 75, fullMark: 100 },
        { subject: "Teamwork", A: 88, fullMark: 100 },
        { subject: "Technical Skills", A: 92, fullMark: 100 },
        { subject: "Research", A: 80, fullMark: 100 },
      ]

      const mockActivityData = [
        { name: "Week 1", assignments: 3, discussions: 5, readings: 7 },
        { name: "Week 2", assignments: 2, discussions: 8, readings: 5 },
        { name: "Week 3", assignments: 4, discussions: 6, readings: 3 },
        { name: "Week 4", assignments: 5, discussions: 4, readings: 6 },
        { name: "Week 5", assignments: 3, discussions: 7, readings: 8 },
        { name: "Week 6", assignments: 4, discussions: 9, readings: 4 },
      ]

      const mockComparisonData = [
        { name: "Course 1", you: 85, classAvg: 75, topPerformer: 95 },
        { name: "Course 2", you: 78, classAvg: 72, topPerformer: 92 },
        { name: "Course 3", you: 92, classAvg: 80, topPerformer: 98 },
        { name: "Course 4", you: 88, classAvg: 76, topPerformer: 94 },
      ]

      setMetrics({
        enrolledCourses: enrollments?.length || 0,
        completedAssignments,
        upcomingAssignments,
        averageGrade,
        attendanceRate: 92, // Mock data
        coursesProgress: 68, // Mock data
      })

      setGradeData(mockGradeData)
      setAttendanceData(mockAttendanceData)
      setSkillsData(mockSkillsData)
      setActivityData(mockActivityData)
      setComparisonData(mockComparisonData)
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
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.enrolledCourses}</div>
            <p className="text-xs text-muted-foreground">Active course enrollments</p>
            <Progress className="mt-2" value={metrics.coursesProgress} />
            <p className="text-xs text-muted-foreground mt-1">{metrics.coursesProgress}% overall progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">{metrics.completedAssignments}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-500">{metrics.upcomingAssignments}</div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {Math.round(
                  (metrics.completedAssignments / (metrics.completedAssignments + metrics.upcomingAssignments || 1)) *
                    100,
                )}
                % Completion Rate
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic Performance</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageGrade.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average grade across all courses</p>
            <Progress
              className="mt-2"
              value={metrics.averageGrade}
              indicatorColor={
                metrics.averageGrade >= 90
                  ? "bg-green-500"
                  : metrics.averageGrade >= 80
                    ? "bg-emerald-500"
                    : metrics.averageGrade >= 70
                      ? "bg-amber-500"
                      : metrics.averageGrade >= 60
                        ? "bg-orange-500"
                        : "bg-red-500"
              }
            />
            <div className="mt-1 flex justify-between text-xs">
              <span>Fail</span>
              <span>Pass</span>
              <span>Good</span>
              <span>Excellent</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Activity</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4" />
            <span>Comparison</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart4 className="h-5 w-5 text-primary" />
                  <span>Grade Distribution</span>
                </CardTitle>
                <CardDescription>Your performance across different assessment types</CardDescription>
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
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" name="Your Score" fill="#8884d8" />
                    <Bar dataKey="average" name="Class Average" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  <span>Skills Assessment</span>
                </CardTitle>
                <CardDescription>Evaluation of your academic skills</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Student" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Activity</CardTitle>
              <CardDescription>Your engagement with course materials over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activityData}
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
                  <Line type="monotone" dataKey="assignments" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="discussions" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="readings" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Your attendance patterns over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={attendanceData}
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

            <Card>
              <CardHeader>
                <CardTitle>Participation Metrics</CardTitle>
                <CardDescription>Your engagement in course activities</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Discussions", value: 35 },
                        { name: "Assignments", value: 40 },
                        { name: "Quizzes", value: 15 },
                        { name: "Projects", value: 10 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2, 3].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>How you compare to your peers across courses</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
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
                  <Bar dataKey="you" name="Your Score" fill="#8884d8" />
                  <Bar dataKey="classAvg" name="Class Average" fill="#82ca9d" />
                  <Bar dataKey="topPerformer" name="Top Performer" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
