import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, Calendar } from "lucide-react"

interface StudentDetailsProps {
  student: any
}

export function StudentDetails({ student }: StudentDetailsProps) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Personal and contact details</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={student.avatar || "/placeholder.svg"} />
              <AvatarFallback>
                {student.firstName[0]}
                {student.lastName[0]}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h3 className="text-xl font-semibold">
                {student.firstName} {student.lastName}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Student ID: {student.studentId}</Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Phone</p>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{student.phone || "(555) 123-4567"}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Address</p>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {student.address || "123 University Ave, College Town, ST 12345"}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Date of Birth</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{student.dateOfBirth || "January 15, 2000"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Information</CardTitle>
          <CardDescription>Program and academic details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Program</p>
            <p className="text-sm text-muted-foreground">
              {student.program || "Bachelor of Science in Computer Science"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Year</p>
            <p className="text-sm text-muted-foreground">{student.year || "Junior (3rd Year)"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">GPA</p>
            <p className="text-sm text-muted-foreground">{student.gpa || "3.8"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Advisor</p>
            <p className="text-sm text-muted-foreground">{student.advisor || "Dr. Jane Smith"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
