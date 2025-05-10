"use client";

import { useCurrentUser } from "@/hooks/use-current-user";
import { DashboardCards } from "@/components/dashboard/dashboard-cards";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UpcomingAssignments } from "@/components/dashboard/upcoming-assignments";
import { StudentMetricsDashboard } from "@/components/dashboard/student-metrics-dashboard";
import { TeacherMetricsDashboard } from "@/components/dashboard/teacher-metrics-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { PageTitle } from "@/components/page-title";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, BarChart2, Clock } from "lucide-react";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { user, profile, loading } = useCurrentUser();

  // if (loading) {
  //   return <LoadingSpinner />;
  // }
  if (!loading && !user) {
    redirect("/login?redirect=/dashboard");
  }
  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageTitle
        title={`Welcome, ${
          profile?.first_name || user?.email?.split("@")[0] || "User"
        }`}
        description="Here's an overview of your academic progress and activities"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Upcoming</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardCards />
          <div className="grid gap-6 md:grid-cols-2">
            <RecentActivity />
            <UpcomingAssignments />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {user?.role === "student" && <StudentMetricsDashboard />}
          {user?.role === "teacher" && <TeacherMetricsDashboard />}
          {user?.role === "admin" && <AdminDashboard />}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6">
          <UpcomingAssignments />
        </TabsContent>
      </Tabs>
    </div>
  );
}
