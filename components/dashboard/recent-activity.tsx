"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser } from "@/hooks/use-current-user"

const activities = [
  {
    id: "1",
    action: "Assignment Submitted",
    subject: "Introduction to Programming",
    timestamp: "2 hours ago",
    user: "student",
  },
  {
    id: "2",
    action: "Course Created",
    subject: "Advanced Mathematics",
    timestamp: "1 day ago",
    user: "admin",
  },
  {
    id: "3",
    action: "Grade Updated",
    subject: "Physics 101",
    timestamp: "2 days ago",
    user: "teacher",
  },
  {
    id: "4",
    action: "Student Enrolled",
    subject: "Chemistry Basics",
    timestamp: "3 days ago",
    user: "admin",
  },
  {
    id: "5",
    action: "Assignment Created",
    subject: "Literature Review",
    timestamp: "4 days ago",
    user: "teacher",
  },
]

export function RecentActivity() {
  const { user } = useCurrentUser()

  // Filter activities based on user role
  const filteredActivities =
    user?.role === "student"
      ? activities.filter((activity) => activity.user === "student")
      : user?.role === "teacher"
        ? activities.filter((activity) => activity.user === "teacher" || activity.user === "student")
        : activities

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-4">
              <div className="relative mt-1 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </div>
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">{activity.action}</p>
                <p className="text-sm text-muted-foreground">{activity.subject}</p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
