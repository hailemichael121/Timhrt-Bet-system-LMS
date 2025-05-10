import { StudentDetails } from "@/components/students/student-details"
import { StudentCourses } from "@/components/students/student-courses"
import { StudentAssignments } from "@/components/students/student-assignments"
import { PageTitle } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockStudents } from "@/lib/mock-data"

export default function StudentPage({ params }: { params: { id: string } }) {
  const student = mockStudents.find((student) => student.id === params.id) || mockStudents[0]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageTitle
          title={`${student.firstName} ${student.lastName}`}
          description={`Student ID: ${student.studentId}`}
        />
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="pt-6">
          <StudentDetails student={student} />
        </TabsContent>
        <TabsContent value="courses" className="pt-6">
          <StudentCourses studentId={params.id} />
        </TabsContent>
        <TabsContent value="assignments" className="pt-6">
          <StudentAssignments studentId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
