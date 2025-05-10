"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/hooks/use-current-user"
import Link from "next/link"
import { BookOpen, Users } from "lucide-react"

// Add loading state
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function CoursesList() {
  const { user } = useCurrentUser()

  // Add these at the beginning of the component
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<any[]>([])

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)

        let query = supabase.from("courses").select("*")

        if (user?.role === "student") {
          // For students, get only enrolled courses
          const { data: enrollments } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id)

          if (enrollments && enrollments.length > 0) {
            const courseIds = enrollments.map((e) => e.course_id)
            query = query.in("id", courseIds)
          } else {
            setCourses([])
            setLoading(false)
            return
          }
        } else if (user?.role === "teacher") {
          // For teachers, get only their courses
          query = query.eq("instructor_id", user.id)
        }

        const { data, error } = await query.order("created_at", { ascending: false })

        if (error) throw error

        setCourses(data || [])
      } catch (error) {
        console.error("Error fetching courses:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchCourses()
    }
  }, [user])

  // Filter courses based on user role
  // const filteredCourses =
  //   user?.role === "student" ? mockCourses.filter((course) => course.enrolledStudents.includes(user.id)) : mockCourses

  // Replace the return statement with this
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {loading ? (
        <div className="col-span-full flex justify-center py-8">
          <LoadingSpinner text="Loading courses..." />
        </div>
      ) : courses.length === 0 ? (
        <div className="col-span-full text-center py-8">
          <p className="text-muted-foreground">No courses found</p>
          {user?.role !== "student" && (
            <p className="text-sm text-muted-foreground mt-1">Create your first course to get started</p>
          )}
        </div>
      ) : (
        courses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{course.department}</Badge>
                <Badge>{course.code}</Badge>
              </div>
              <CardTitle className="mt-2">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">{course.description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{course.enrolled_count || 0} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{course.credits} credits</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/dashboard/courses/${course.id}`} className="w-full">
                <Button variant="default" className="w-full">
                  View Course
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  )
}
