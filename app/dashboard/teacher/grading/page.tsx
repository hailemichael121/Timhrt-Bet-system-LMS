"use client"

import { useState, useEffect } from "react"
import { PageTitle } from "@/components/page-title"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookPageTransition } from "@/components/animations/page-transitions"
import { BookLoader } from "@/components/animations/book-loader"
import { BookError } from "@/components/animations/book-error"
import { PendingGradingList } from "@/components/assignments/pending-grading-list"
import { RecentlyGradedList } from "@/components/assignments/recently-graded-list"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { GradingStatistics } from "@/components/assignments/grading-statistics"

export default function TeacherGradingDashboard() {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [gradedCount, setGradedCount] = useState(0)
  const [coursesList, setCoursesList] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchTeacherCourses()
      fetchGradingCounts()
    }
  }, [user])

  const fetchTeacherCourses = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("courses")
        .select("id, title, code")
        .eq("instructor_id", user?.id)
        .order("title")

      if (error) throw error

      setCoursesList(data || [])
      if (data && data.length > 0) {
        setSelectedCourse(null) // Start with "All Courses"
      }
    } catch (err) {
      console.error("Error fetching courses:", err)
      setError("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  const fetchGradingCounts = async () => {
    try {
      // Get courses taught by this teacher
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", user?.id)

      if (coursesError) throw coursesError

      if (!courses || courses.length === 0) {
        setPendingCount(0)
        setGradedCount(0)
        return
      }

      const courseIds = courses.map((course) => course.id)

      // Get assignments for these courses
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("id")
        .in("course_id", courseIds)

      if (assignmentsError) throw assignmentsError

      if (!assignments || assignments.length === 0) {
        setPendingCount(0)
        setGradedCount(0)
        return
      }

      const assignmentIds = assignments.map((assignment) => assignment.id)

      // Count pending submissions (no grade)
      const { count: pendingSubmissions, error: pendingError } = await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in("assignment_id", assignmentIds)
        .is("grade", null)

      if (pendingError) throw pendingError

      // Count graded submissions
      const { count: gradedSubmissions, error: gradedError } = await supabase
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .in("assignment_id", assignmentIds)
        .not("grade", "is", null)

      if (gradedError) throw gradedError

      setPendingCount(pendingSubmissions || 0)
      setGradedCount(gradedSubmissions || 0)
    } catch (err) {
      console.error("Error fetching grading counts:", err)
    }
  }

  if (loading) {
    return <BookLoader />
  }

  if (error) {
    return (
      <BookError
        title="Could not load grading dashboard"
        message={error}
        reset={() => {
          fetchTeacherCourses()
          fetchGradingCounts()
        }}
      />
    )
  }

  return (
    <BookPageTransition>
      <div className="space-y-6">
        <PageTitle title="Assignment Grading" description="Review and grade student submissions" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-3 md:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pending" className="relative">
                    Pending Grading
                    {pendingCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="graded">Recently Graded</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-6">
                  <PendingGradingList courseId={selectedCourse} onGraded={fetchGradingCounts} />
                </TabsContent>
                <TabsContent value="graded" className="mt-6">
                  <RecentlyGradedList courseId={selectedCourse} />
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="col-span-3 md:col-span-1">
            <GradingStatistics
              pendingCount={pendingCount}
              gradedCount={gradedCount}
              coursesList={coursesList}
              selectedCourse={selectedCourse}
              onCourseChange={setSelectedCourse}
            />
          </div>
        </div>
      </div>
    </BookPageTransition>
  )
}
