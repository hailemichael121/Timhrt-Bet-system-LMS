"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  AreaChart,
  Area,
} from "recharts"
import { Users, GraduationCap, BookOpen, TrendingUp, BarChart4, PieChartIcon, Calendar, UserPlus } from "lucide-react"
import Link from "next/link"

export function AdminMetricsDashboard() {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    pendingRequests: 0,
    activeUsers: 0,
  })
  const [enrollmentTrend, setEnrollmentTrend] = useState<any[]>([])
  const [userDistribution, setUserDistribution] = useState<any[]>([])
  const [courseActivity, setCourseActivity] = useState<any[]>([])
  const [departmentStats, setDepartmentStats] = useState<any[]>([])
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch counts
      const [
        { count: studentCount },
        { count: teacherCount },
        { count: courseCount },
        { count: enrollmentCount },
        { count: requestCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("enrollments").select("*", { count: "exact", head: true }),
        supabase.from("enrollment_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ])

      // Generate mock data for visualization
      const mockEnrollmentTrend = [
        { name: "Jan", enrollments: 65, completions: 40 },
        { name: "Feb", enrollments: 78, completions: 52 },
        { name: "Mar", enrollments: 90, completions: 60 },
        { name: "Apr", enrollments: 81, completions: 55 },
        { name: "May", enrollments: 95, completions: 65 },
        { name: "Jun", enrollments: 110, completions: 75 },
      ]

      const mockUserDistribution = [
        { name: "Students", value: studentCount || 150 },
        { name: "Teachers", value: teacherCount || 30 },
        { name: "Admins", value: 5 },
      ]

      const mockCourseActivity = [
        { name: "Week 1", assignments: 20, submissions: 15, discussions: 30 },
        { name: "Week 2", assignments: 25, submissions: 20, discussions: 35 },
        { name: "Week 3", assignments: 30, submissions: 25, discussions: 40 },
        { name: "Week 4", assignments: 35, submissions: 30, discussions: 45 },
        { name: "Week 5", assignments: 40, submissions: 35, discussions: 50 },
        { name: "Week 6", assignments: 45, submissions: 40, discussions: 55 },
      ]

      const mockDepartmentStats = [
        { name: "Computer Science", courses: 15, students: 120, teachers: 8 },
        { name: "Engineering", courses: 12, students: 100, teachers: 6 },
        { name: "Business", courses: 10, students: 90, teachers: 5 },
        { name: "Arts", courses: 8, students: 70, teachers: 4 },
        { name: "Science", courses: 14, students: 110, teachers: 7 },
      ]

      const mockGradeDistribution = [
        { name: "A (90-100%)", value: 30 },
        { name: "B (80-89%)", value: 25 },
        { name: "C (70-79%)", value: 20 },
        { name: "D (60-69%)", value: 15 },
        { name: "F (0-59%)", value: 10 },
      ]

      setMetrics({
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        totalCourses: courseCount || 0,
        totalEnrollments: enrollmentCount || 0,
        pendingRequests: requestCount || 0,
        activeUsers: Math.floor((studentCount || 0) * 0.8 + (teacherCount || 0) * 0.9), // Mock active users
      })

      setEnrollmentTrend(mockEnrollmentTrend)
      setUserDistribution(mockUserDistribution)
      setCourseActivity(mockCourseActivity)
      setDepartmentStats(mockDepartmentStats)
      setGradeDistribution(mockGradeDistribution)
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
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalStudents}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Active students in the system</p>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                +{Math.floor(metrics.totalStudents * 0.05)} this month
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTeachers}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Active teachers in the system</p>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                +{Math.floor(metrics.totalTeachers * 0.03)} this month
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCourses}</div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Available courses</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  {Math.floor(metrics.totalCourses * 0.8)} Active
                </Badge>
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  {Math.floor(metrics.totalCourses * 0.2)} Archived
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Overview</h2>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/users">
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </Link>
          <Link href="/dashboard/admin/requests">
            <Button variant="outline" size="sm">
              Pending Requests
              {metrics.pendingRequests > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {metrics.pendingRequests}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Courses</span>
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <BarChart4 className="h-4 w-4" />
            <span>Departments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trends</CardTitle>
              <CardDescription>Course enrollments and completions over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={enrollmentTrend}
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
                  <Area type="monotone" dataKey="enrollments" name="Enrollments" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="completions" name="Completions" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-primary" />
                  <span>User Distribution</span>
                </CardTitle>
                <CardDescription>Breakdown of users by role</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userDistribution.map((entry, index) => (
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
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>System Activity</span>
                </CardTitle>
                <CardDescription>Weekly platform activity</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={courseActivity}
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
                    <Line
                      type="monotone"
                      dataKey="assignments"
                      name="Assignments"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line type="monotone" dataKey="submissions" name="Submissions" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="discussions" name="Discussions" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>Active users over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={[
                    { name: "Mon", students: 120, teachers: 25, admins: 5 },
                    { name: "Tue", students: 130, teachers: 28, admins: 5 },
                    { name: "Wed", students: 135, teachers: 27, admins: 4 },
                    { name: "Thu", students: 140, teachers: 26, admins: 5 },
                    { name: "Fri", students: 145, teachers: 28, admins: 5 },
                    { name: "Sat", students: 90, teachers: 15, admins: 3 },
                    { name: "Sun", students: 80, teachers: 12, admins: 2 },
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
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="students"
                    name="Students"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                  />
                  <Area
                    type="monotone"
                    dataKey="teachers"
                    name="Teachers"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                  />
                  <Area type="monotone" dataKey="admins" name="Admins" stackId="1" stroke="#ffc658" fill="#ffc658" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
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
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Activity</CardTitle>
              <CardDescription>Activity metrics across all courses</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={courseActivity}
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
                  <Bar dataKey="assignments" name="Assignments" fill="#8884d8" />
                  <Bar dataKey="submissions" name="Submissions" fill="#82ca9d" />
                  <Bar dataKey="discussions" name="Discussions" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Statistics</CardTitle>
              <CardDescription>Comparison of departments by courses, students, and teachers</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentStats}
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
                  <Bar dataKey="courses" name="Courses" fill="#8884d8" />
                  <Bar dataKey="students" name="Students" fill="#82ca9d" />
                  <Bar dataKey="teachers" name="Teachers" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
