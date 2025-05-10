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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { BookOpen, Calendar, Award, TrendingUp, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export function StudentAnalyticsDashboard() {
  const { user, profile } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [gradeData, setGradeData] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])
  const [courseProgressData, setCourseProgressData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([])
  const [skillsData, setSkillsData] = useState<any[]>([])
  const [timeSpentData, setTimeSpentData] = useState<any[]>([])
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([])
  const [overallStats, setOverallStats] = useState({
    gpa: 0,
    coursesEnrolled: 0,
    assignmentsDue: 0,
    completionRate: 0,
    onTimeSubmissions: 0,
    lateSubmissions: 0,
  })

  useEffect(() => {
    if (user) {
      fetchAnalyticsData()
    }
  }, [user])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Fetch enrolled courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("*, courses(*)")
        .eq("student_id", user?.id)

      if (enrollmentsError) throw enrollmentsError

      // Fetch assignments and submissions
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*, submissions(*), courses:course_id(*)")
        .in("course_id", enrollments?.map((e) => e.course_id) || [])

      if (assignmentsError) throw assignmentsError

      // Process grade data
      const grades =
        enrollments?.map((enrollment) => ({
          name: enrollment.courses.code,
          grade: enrollment.grade ? Number.parseFloat(enrollment.grade) : 0,
        })) || []

      // Generate attendance data (in a real app, this would come from the database)
      const attendance =
        enrollments?.map((enrollment) => ({
          name: enrollment.courses.code,
          present: Math.floor(Math.random() * 30) + 10,
          absent: Math.floor(Math.random() * 5),
          late: Math.floor(Math.random() * 3),
        })) || []

      // Generate course progress data
      const progress =
        enrollments?.map((enrollment) => {
          const courseAssignments = assignments?.filter((a) => a.course_id === enrollment.course_id) || []
          const completed = courseAssignments.filter((a) => {
            return a.submissions && a.submissions.some((s: any) => s.student_id === user?.id)
          }).length
          const total = courseAssignments.length || 1

          return {
            name: enrollment.courses.code,
            progress: Math.round((completed / total) * 100),
            remaining: 100 - Math.round((completed / total) * 100),
          }
        }) || []

      // Generate performance comparison data
      const performance = [
        { name: "Assignments", score: 85, average: 75 },
        { name: "Quizzes", score: 78, average: 72 },
        { name: "Projects", score: 92, average: 80 },
        { name: "Exams", score: 88, average: 76 },
      ]

      // Generate upcoming assignments
      const upcoming =
        assignments
          ?.filter((a) => {
            const dueDate = parseISO(a.due_date)
            return isAfter(dueDate, new Date()) && isBefore(dueDate, addDays(new Date(), 14))
          })
          .map((a) => ({
            id: a.id,
            title: a.title,
            course: a.courses.code,
            dueDate: a.due_date,
            points: a.points,
            submitted: a.submissions && a.submissions.some((s: any) => s.student_id === user?.id),
          }))
          .sort((a, b) => (parseISO(a.dueDate) > parseISO(b.dueDate) ? 1 : -1))
          .slice(0, 5) || []

      // Generate skills radar data
      const skills = [
        { subject: "Problem Solving", A: 85, fullMark: 100 },
        { subject: "Critical Thinking", A: 90, fullMark: 100 },
        { subject: "Communication", A: 75, fullMark: 100 },
        { subject: "Teamwork", A: 88, fullMark: 100 },
        { subject: "Technical Skills", A: 92, fullMark: 100 },
        { subject: "Research", A: 80, fullMark: 100 },
      ]

      // Generate time spent data
      const timeSpent = [
        { name: "Lectures", hours: 45 },
        { name: "Assignments", hours: 30 },
        { name: "Reading", hours: 20 },
        { name: "Projects", hours: 25 },
        { name: "Study Groups", hours: 15 },
        { name: "Office Hours", hours: 5 },
      ]

      // Generate grade distribution
      const gradeDistribution = [
        { name: "A", count: 3 },
        { name: "B", count: 2 },
        { name: "C", count: 1 },
        { name: "D", count: 0 },
        { name: "F", count: 0 },
      ]

      // Calculate overall stats
      const allSubmissions = assignments?.flatMap((a) => a.submissions || []) || []
      const userSubmissions = allSubmissions.filter((s: any) => s.student_id === user?.id)
      const onTimeSubmissions = userSubmissions.filter((s: any) => !s.late).length
      const lateSubmissions = userSubmissions.filter((s: any) => s.late).length
      const totalAssignments = assignments?.length || 0
      const completionRate = totalAssignments > 0 ? (userSubmissions.length / totalAssignments) * 100 : 0

      // Calculate GPA (mock data)
      const gpa = 3.7

      setGradeData(grades)
      setAttendanceData(attendance)
      setCourseProgressData(progress)
      setPerformanceData(performance)
      setUpcomingAssignments(upcoming)
      setSkillsData(skills)
      setTimeSpentData(timeSpent)
      setGradeDistribution(gradeDistribution)
      setOverallStats({
        gpa,
        coursesEnrolled: enrollments?.length || 0,
        assignmentsDue: upcoming.length,
        completionRate,
        onTimeSubmissions,
        lateSubmissions,
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.gpa.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">+0.2 from last semester</p>
            <div className="mt-2">
              <Progress value={overallStats.gpa * 25} className="h-1" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.coursesEnrolled}</div>
            <p className="text-xs text-muted-foreground">Current semester</p>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: overallStats.coursesEnrolled }).map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary" />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments Due</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.assignmentsDue}</div>
            <p className="text-xs text-muted-foreground">Next 14 days</p>
            <div className="mt-2 flex items-center gap-2">
              <Clock className="h-3 w-3 text-amber-500" />
              <span className="text-xs text-amber-500">Upcoming deadlines</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submission Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallStats.completionRate)}%</div>
            <p className="text-xs text-muted-foreground">Assignment completion</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-1">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" /> {overallStats.onTimeSubmissions} On time
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" /> {overallStats.lateSubmissions} Late
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="time">Time Management</TabsTrigger>
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
                <CardTitle>Upcoming Assignments</CardTitle>
                <CardDescription>Due in the next 14 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAssignments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No upcoming assignments</p>
                  ) : (
                    upcomingAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{assignment.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{assignment.course}</span>
                            <span>•</span>
                            <span>{format(parseISO(assignment.dueDate), "MMM d")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{assignment.points} pts</span>
                          {assignment.submitted ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Submitted
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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

            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Your grade distribution across courses</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={gradeDistribution}
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
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Number of Courses" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grade Trends</CardTitle>
              <CardDescription>Your grade progression over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { semester: "Fall 2022", gpa: 3.5 },
                    { semester: "Spring 2023", gpa: 3.6 },
                    { semester: "Fall 2023", gpa: 3.7 },
                    { semester: "Spring 2024", gpa: 3.8 },
                  ]}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semester" />
                  <YAxis domain={[3, 4]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="gpa" stroke="#8884d8" activeDot={{ r: 8 }} />
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

          <div className="grid gap-4 md:grid-cols-2">
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

            <Card>
              <CardHeader>
                <CardTitle>Assignment Completion</CardTitle>
                <CardDescription>Percentage of assignments completed on time</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "On Time", value: 85 },
                        { name: "Late", value: 10 },
                        { name: "Missed", value: 5 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#82ca9d" />
                      <Cell fill="#ffc658" />
                      <Cell fill="#ff8042" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills Assessment</CardTitle>
              <CardDescription>Your performance across different skill areas</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Skills" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Strengths</CardTitle>
                <CardDescription>Areas where you excel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Technical Skills</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: "92%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Critical Thinking</span>
                    <span className="font-medium">90%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: "90%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Teamwork</span>
                    <span className="font-medium">88%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: "88%" }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
                <CardDescription>Skills to focus on developing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Communication</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: "75%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Research</span>
                    <span className="font-medium">80%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: "80%" }}></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Time Management</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Allocation</CardTitle>
              <CardDescription>How you spend your academic time</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeSpentData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="hours"
                  >
                    {timeSpentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} hours`, "Time Spent"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Study Hours</CardTitle>
                <CardDescription>Hours spent studying per day</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { day: "Monday", hours: 3 },
                      { day: "Tuesday", hours: 4 },
                      { day: "Wednesday", hours: 2 },
                      { day: "Thursday", hours: 5 },
                      { day: "Friday", hours: 3 },
                      { day: "Saturday", hours: 6 },
                      { day: "Sunday", hours: 4 },
                    ]}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} hours`, "Study Time"]} />
                    <Legend />
                    <Bar dataKey="hours" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productivity Analysis</CardTitle>
                <CardDescription>Your most productive study times</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { time: "6-8 AM", productivity: 65 },
                      { time: "8-10 AM", productivity: 80 },
                      { time: "10-12 PM", productivity: 90 },
                      { time: "12-2 PM", productivity: 70 },
                      { time: "2-4 PM", productivity: 75 },
                      { time: "4-6 PM", productivity: 85 },
                      { time: "6-8 PM", productivity: 95 },
                      { time: "8-10 PM", productivity: 88 },
                      { time: "10-12 AM", productivity: 60 },
                    ]}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, "Productivity"]} />
                    <Legend />
                    <Line type="monotone" dataKey="productivity" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
