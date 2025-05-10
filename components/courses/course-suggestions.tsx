"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { motion, AnimatePresence } from "framer-motion"
import { Users } from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  title: string
  code: string
  department: string
  description: string
  credits: number
  enrolled_count: number
  tags: string[]
}

export function CourseSuggestions() {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    if (user) {
      fetchSuggestedCourses()
    }
  }, [user])

  const fetchSuggestedCourses = async () => {
    try {
      setLoading(true)

      // In a real app, you would have a recommendation algorithm
      // For now, we'll just fetch random courses the user is not enrolled in
      const { data: enrollments } = await supabase.from("enrollments").select("course_id").eq("student_id", user?.id)

      const enrolledCourseIds = enrollments?.map((e) => e.course_id) || []

      const query = supabase
        .from("courses")
        .select(`
          id,
          title,
          code,
          department,
          description,
          credits,
          enrolled_count:enrollments(
            count
          )
        `)
        .not("id", "in", enrolledCourseIds)
        .limit(3)

      const { data, error } = await query

      if (error) {
        console.error("Error fetching suggested courses:", error)
      } else {
        setCourses(data as Course[])
      }
    } catch (error) {
      console.error("Error fetching suggested courses:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Suggested Courses</CardTitle>
          <CardDescription>Based on your profile and enrollment history.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!courses || courses.length === 0) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Suggested Courses</CardTitle>
        <CardDescription>Based on your profile and enrollment history.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <AnimatePresence>
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={`/courses/${course.id}`}>
                      <h3 className="text-lg font-semibold hover:underline">{course.title}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {course.department} {course.code}
                    </p>
                    <p className="text-sm mt-1">{course.description.substring(0, 100)}...</p>
                  </div>
                  <div className="space-x-2 flex items-center">
                    <Badge variant="secondary">{course.credits} Credits</Badge>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{course.enrolled_count}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 space-x-1">
                  {course.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
