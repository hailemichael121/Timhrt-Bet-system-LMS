"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Users, BookOpen, FileText, GraduationCap, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { motion } from "framer-motion"
import { format, subDays } from "date-fns"

export function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalAssignments: 0,
    totalEnrollments: 0,
    completionRate: 0,
    averageGrade: 0,
  })
  const [enrollmentData, setEnrollmentData] = useState<any[]>([])
  const [departmentData, setDepartmentData] = useState<any[]>([])
  const [activityData, setActivityData] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch counts
      const [{ count: studentCount }, { count: courseCount }, { count: assignmentCount }, { count: enrollmentCount }] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
          supabase.from("courses").select("*", { count: "exact", head: true }),
          supabase.from("assignments").select("*", { count: "exact", head: true }),
          supabase.from("enrollments").select("*", { count: "exact", head: true }),
        ])

      // Fetch enrollments by course
      const { data: enrollmentsByDepartment } = await supabase
        .from("courses")
        .select(`
          department,
          enrollments:enrollments(count)
        `)
        .eq("enrollments.status", "active")
        .group("department")

      // Process department data
      const departmentStats =
        enrollmentsByDepartment?.map((item) => ({
          name: item.department,
          value: item.enrollments.length,
        })) || []

      // Generate activity data (last 7 days)
      const activityStats = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i)
        return {
          date: format(date, "MMM dd"),
          enrollments: Math.floor(Math.random() * 10),
          assignments: Math.floor(Math.random() * 5),
          submissions: Math.floor(Math.random() * 8),
        }
      }).reverse()

      // Generate enrollment data (by course)
      const { data: courses } = await supabase.from("courses").select("id, title, code").limit(5)

      const enrollmentStats = await Promise.all(
        (courses || []).map(async (course) => {
          const { count } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id)

          return {
            name: course.code,
            students: count || 0,
          }
        }),
      )

      setStats({
        totalStudents: studentCount || 0,
        totalCourses: courseCount || 0,
        totalAssignments: assignmentCount || 0,
        totalEnrollments: enrollmentCount || 0,
        completionRate: 78, // Mock data
        averageGrade: 85, // Mock data
      })

      setDepartmentData(departmentStats)
      setActivityData(activityStats)
      setEnrollmentData(enrollmentStats)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 10)}% from last month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 5)}% from last month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssignments}</div>
              <p className="text-xs text-muted-foreground">+{Math.floor(Math.random() * 15)}% from last month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <Progress value={stats.completionRate} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>System activity over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
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
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="enrollments" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="assignments" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="submissions" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>Enrollments by department</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Course Enrollments</CardTitle>
                <CardDescription>Top courses by enrollment</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={enrollmentData}
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
                    <Bar dataKey="students" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>System performance and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Average Grade</span>
                      </div>
                      <span className="font-medium">{stats.averageGrade}%</span>
                    </div>
                    <Progress value={stats.averageGrade} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Student-Course Ratio</span>
                      </div>
                      <span className="font-medium">
                        {(stats.totalEnrollments / (stats.totalCourses || 1)).toFixed(1)}:1
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, (stats.totalEnrollments / (stats.totalCourses || 1)) * 10)}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Assignments per Course</span>
                      </div>
                      <span className="font-medium">
                        {(stats.totalAssignments / (stats.totalCourses || 1)).toFixed(1)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, (stats.totalAssignments / (stats.totalCourses || 1)) * 20)}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>Detailed analytics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced analytics features are coming soon. This will include predictive analytics, student performance
                tracking, and more detailed reporting capabilities.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Generate and download reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Report generation features are coming soon. You'll be able to generate custom reports for enrollment,
                grades, course performance, and more.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
