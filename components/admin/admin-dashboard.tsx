"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { Users, BookOpen, FileText, GraduationCap, Search, UserPlus, CheckCircle, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AdminDashboard() {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
  })
  const [teacherRequests, setTeacherRequests] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [newUserData, setNewUserData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "student",
    studentId: "",
  })
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch counts
      const [{ count: studentCount }, { count: teacherCount }, { count: courseCount }, { count: enrollmentCount }] =
        await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
          supabase.from("courses").select("*", { count: "exact", head: true }),
          supabase.from("enrollments").select("*", { count: "exact", head: true }),
        ])

      // Fetch teacher requests
      const { data: requestsData } = await supabase
        .from("teacher_requests")
        .select(`
          id,
          status,
          created_at,
          user:user_id (
            id,
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false })

      // Fetch teachers
      const { data: teachersData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher")
        .order("created_at", { ascending: false })

      // Fetch students
      const { data: studentsData } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("created_at", { ascending: false })

      setStats({
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        totalCourses: courseCount || 0,
        totalEnrollments: enrollmentCount || 0,
      })

      setTeacherRequests(requestsData || [])
      setTeachers(teachersData || [])
      setStudents(studentsData || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTeacherRequest = async (requestId: string, userId: string) => {
    try {
      setProcessing(requestId)

      // Update request status
      const { error: updateError } = await supabase
        .from("teacher_requests")
        .update({ status: "approved" })
        .eq("id", requestId)

      if (updateError) throw updateError

      // Update user role
      const { error: roleError } = await supabase.from("profiles").update({ role: "teacher" }).eq("id", userId)

      if (roleError) throw roleError

      // Create notification for the user
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Teacher Request Approved",
        message: "Your request to become a teacher has been approved",
        type: "teacher_approved",
        read: false,
      })

      // Update local state
      setTeacherRequests((prevRequests) =>
        prevRequests.map((request) => (request.id === requestId ? { ...request, status: "approved" } : request)),
      )

      // Fetch the updated teacher
      const { data: teacherData } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (teacherData) {
        setTeachers((prev) => [teacherData, ...prev])
        setStats((prev) => ({
          ...prev,
          totalTeachers: prev.totalTeachers + 1,
        }))
      }

      toast({
        title: "Request Approved",
        description: "The teacher request has been approved",
      })
    } catch (error) {
      console.error("Error approving request:", error)
      toast({
        title: "Error",
        description: "Failed to approve teacher request",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectTeacherRequest = async (requestId: string, userId: string) => {
    try {
      setProcessing(requestId)

      // Update request status
      const { error } = await supabase.from("teacher_requests").update({ status: "rejected" }).eq("id", requestId)

      if (error) throw error

      // Create notification for the user
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Teacher Request Rejected",
        message: "Your request to become a teacher has been rejected",
        type: "teacher_rejected",
        read: false,
      })

      // Update local state
      setTeacherRequests((prevRequests) =>
        prevRequests.map((request) => (request.id === requestId ? { ...request, status: "rejected" } : request)),
      )

      toast({
        title: "Request Rejected",
        description: "The teacher request has been rejected",
      })
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast({
        title: "Error",
        description: "Failed to reject teacher request",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleCreateUser = async () => {
    try {
      setProcessing("new-user")

      // In a real app, you would create a user in auth and then create a profile
      // For now, we'll just simulate it
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: `mock-${Date.now()}`,
          first_name: newUserData.firstName,
          last_name: newUserData.lastName,
          email: newUserData.email,
          role: newUserData.role,
          student_id: newUserData.role === "student" ? newUserData.studentId : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Update local state
      if (newUserData.role === "student") {
        setStudents((prev) => [data, ...prev])
        setStats((prev) => ({
          ...prev,
          totalStudents: prev.totalStudents + 1,
        }))
      } else {
        setTeachers((prev) => [data, ...prev])
        setStats((prev) => ({
          ...prev,
          totalTeachers: prev.totalTeachers + 1,
        }))
      }

      toast({
        title: "User Created",
        description: `New ${newUserData.role} has been created successfully`,
      })

      // Reset form and close dialog
      setNewUserData({
        email: "",
        firstName: "",
        lastName: "",
        role: "student",
        studentId: "",
      })
      setDialogOpen(false)
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const filteredTeachers = teachers.filter((teacher) => {
    const fullName = `${teacher.first_name || ""} ${teacher.last_name || ""}`.toLowerCase()
    const email = teacher.email?.toLowerCase() || ""

    return fullName.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase())
  })

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name || ""} ${student.last_name || ""}`.toLowerCase()
    const email = student.email?.toLowerCase() || ""
    const studentId = student.student_id?.toLowerCase() || ""

    return (
      fullName.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase()) ||
      studentId.includes(searchQuery.toLowerCase())
    )
  })

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner text="Loading dashboard data..." />
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active students in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Active teachers in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Available courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">Active course enrollments</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>Add a new student or teacher to the system</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </label>
                  <Input
                    id="firstName"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </label>
                  <Input
                    id="lastName"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <Select
                  value={newUserData.role}
                  onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUserData.role === "student" && (
                <div className="space-y-2">
                  <label htmlFor="studentId" className="text-sm font-medium">
                    Student ID
                  </label>
                  <Input
                    id="studentId"
                    value={newUserData.studentId}
                    onChange={(e) => setNewUserData({ ...newUserData, studentId: e.target.value })}
                    placeholder="Enter student ID"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateUser}
                disabled={
                  processing === "new-user" ||
                  !newUserData.firstName ||
                  !newUserData.lastName ||
                  !newUserData.email ||
                  (newUserData.role === "student" && !newUserData.studentId)
                }
              >
                {processing === "new-user" ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="teachers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="teachers">
            Teachers
            {teacherRequests.filter((r) => r.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {teacherRequests.filter((r) => r.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="requests">Teacher Requests</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="teachers">
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No teachers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTeachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={teacher.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{getInitials(teacher.first_name, teacher.last_name)}</AvatarFallback>
                              </Avatar>
                              <span>
                                {teacher.first_name} {teacher.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{teacher.email}</TableCell>
                          <TableCell>
                            <Badge>{teacher.course_count || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            {teacher.created_at ? format(new Date(teacher.created_at), "MMM d, yyyy") : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Enrolled Courses</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{getInitials(student.first_name, student.last_name)}</AvatarFallback>
                              </Avatar>
                              <span>
                                {student.first_name} {student.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{student.student_id}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <Badge>{student.enrollment_count || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No teacher requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      teacherRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={request.user.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {getInitials(request.user.first_name, request.user.last_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {request.user.first_name} {request.user.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{request.user.email}</TableCell>
                          <TableCell>
                            {request.status === "pending" ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Pending
                              </Badge>
                            ) : request.status === "approved" ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Approved
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{format(new Date(request.created_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            {request.status === "pending" ? (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                                  onClick={() => handleApproveTeacherRequest(request.id, request.user.id)}
                                  disabled={processing === request.id}
                                >
                                  {processing === request.id ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                                  onClick={() => handleRejectTeacherRequest(request.id, request.user.id)}
                                  disabled={processing === request.id}
                                >
                                  {processing === request.id ? (
                                    <LoadingSpinner size="sm" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {request.status === "approved" ? "Approved" : "Rejected"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
