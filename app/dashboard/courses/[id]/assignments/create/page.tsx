import { CreateAssignmentForm } from "@/components/assignments/create-assignment-form"
import { PageTitle } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { mockCourses } from "@/lib/mock-data"

export default function CreateAssignmentPage({ params }: { params: { id: string } }) {
  const course = mockCourses.find((course) => course.id === params.id) || mockCourses[0]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/courses/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageTitle title="Create Assignment" description={`For ${course.title} (${course.code})`} />
      </div>

      <CreateAssignmentForm courseId={params.id} />
    </div>
  )
}
