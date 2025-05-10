"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockCourses } from "@/lib/mock-data"
import { BookOpen, GraduationCap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface StudentCoursesProps {
  studentId: string
}

export function StudentCourses({ studentId }: StudentCoursesProps) {
  // Get courses this student is enrolled in
  const enrolledCourses = mockCourses.filter((course) => course.enrolledStudents.includes(studentId))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enrolled Courses</CardTitle>
        <CardDescription>Courses the student is currently enrolled in</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {enrolledCourses.length > 0 ? (
            enrolledCourses.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{course.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {course.code} • {course.department}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{course.credits} credits</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GraduationCap className="h-3 w-3" />
                        <span>Prof. {course.instructor || "John Smith"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Link href={`/dashboard/courses/${course.id}`}>
                  <Button variant="outline" size="sm">
                    View Course
                  </Button>
                </Link>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Not enrolled in any courses</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
