import { AssignmentsList } from "@/components/assignments/assignments-list"
import { PageTitle } from "@/components/page-title"

export default function AssignmentsPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Assignments" description="View and manage all assignments" />

      <AssignmentsList />
    </div>
  )
}
