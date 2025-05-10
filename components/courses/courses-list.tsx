"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Define proper types based on your database schema
type Course = {
  id: string;
  title: string;
  description: string | null;
  teacher_id: string;
  created_at: string;
  updated_at: string;
  department: string | null;
  code: string | null;
  credits: number | null;
  deleted_at: string | null;
};

type Enrollment = {
  course_id: string;
  student_id: string;
};

type CourseWithEnrollments = Course & {
  enrollments: { count: number }[];
};

export function CoursesList() {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseWithEnrollments[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        let query = supabase
          .from("courses")
          .select<string, CourseWithEnrollments>(
            `
            *,
            enrollments:enrollments(count)
          `
          )
          .is("deleted_at", null); // Only fetch non-deleted courses

        if (user.role === "student") {
          // For students, get only enrolled courses
          const { data: enrollments, error: enrollmentError } = await supabase
            .from("enrollments")
            .select<string, Pick<Enrollment, "course_id">>("course_id")
            .eq("student_id", user.id);

          if (enrollmentError) throw enrollmentError;

          if (!enrollments || enrollments.length === 0) {
            setCourses([]);
            return;
          }

          const courseIds = enrollments.map((e) => e.course_id);
          query = query.in("id", courseIds);
        } else if (user.role === "teacher") {
          // For teachers, get only their courses
          query = query.eq("teacher_id", user.id);
        }

        const { data, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) throw error;

        setCourses(data || []);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {loading ? (
        <div className="col-span-full flex justify-center py-8">
          <LoadingSpinner text="Loading courses..." />
        </div>
      ) : courses.length === 0 ? (
        <div className="col-span-full text-center py-8">
          <p className="text-muted-foreground">
            {user?.role === "student"
              ? "You're not enrolled in any courses yet"
              : "No courses found"}
          </p>
          {user?.role === "teacher" && (
            <Link href="/dashboard/courses/new" className="mt-4 inline-block">
              <Button variant="outline">Create your first course</Button>
            </Link>
          )}
          {user?.role === "student" && (
            <Link
              href="/dashboard/courses/browse"
              className="mt-4 inline-block"
            >
              <Button variant="outline">Browse available courses</Button>
            </Link>
          )}
        </div>
      ) : (
        courses.map((course) => (
          <Card
            key={course.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                {course.department && (
                  <Badge variant="outline">{course.department}</Badge>
                )}
                {course.code && <Badge>{course.code}</Badge>}
              </div>
              <CardTitle className="mt-2">{course.title}</CardTitle>
              <CardDescription className="line-clamp-2">
                {course.description || "No description provided"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{course.enrollments?.[0]?.count || 0} students</span>
                </div>
                {course.credits && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{course.credits} credits</span>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/dashboard/courses/${course.id}`} className="w-full">
                <Button variant="default" className="w-full">
                  View Course
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
}
