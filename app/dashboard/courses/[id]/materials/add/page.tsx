import type { Metadata } from "next";
import { PageTitle } from "@/components/page-title";
import { AddCourseMaterialForm } from "@/components/courses/add-course-material-form";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Add Course Material",
  description: "Add a new material to your course",
};

interface AddCourseMaterialPageProps {
  params: {
    id: string;
  };
}

export default async function AddCourseMaterialPage({
  params,
}: AddCourseMaterialPageProps) {
  const supabase = createServerComponentClient({ cookies });

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  // Check if user is a teacher or admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  // Check if course exists
  const { data: course } = await supabase
    .from("courses")
    .select("title")
    .eq("id", params.id)
    .single();

  if (!course) {
    redirect("/dashboard/courses");
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Add Course Material"
        description={`Upload a new resource for ${course.title}`}
        backButton={{
          href: `/dashboard/courses/${params.id}`,
          label: "Back to Course",
        }}
      />

      <AddCourseMaterialForm courseId={params.id} />
    </div>
  );
}
