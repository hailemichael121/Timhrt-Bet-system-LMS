import { StudentsList } from "@/components/students/students-list"
import { PageTitle } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default function StudentsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageTitle title="Students" description="Manage student records and enrollments" />
        <Link href="/dashboard/students/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </Link>
      </div>

      <StudentsList />
    </div>
  )
}
