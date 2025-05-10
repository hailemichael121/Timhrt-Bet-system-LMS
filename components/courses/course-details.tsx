import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, GraduationCap } from "lucide-react"

interface CourseDetailsProps {
  course: any
}

export function CourseDetails({ course }: CourseDetailsProps) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>Detailed information about the course</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Course Code</p>
              <p className="text-sm text-muted-foreground">{course.code}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Department</p>
              <p className="text-sm text-muted-foreground">{course.department}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Credits</p>
              <p className="text-sm text-muted-foreground">{course.credits}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Semester</p>
              <p className="text-sm text-muted-foreground">{course.semester || "Fall 2023"}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Description</p>
            <p className="text-sm text-muted-foreground">{course.description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {course.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Mon, Wed, Fri</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Time</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">10:00 AM - 11:30 AM</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Instructor</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Prof. {course.instructor || "John Smith"}</span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
