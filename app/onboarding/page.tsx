import { UserOnboarding } from "@/components/onboarding/user-onboarding"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"

export default async function OnboardingPage() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  // Check if user has already completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", session.user.id)
    .single()

  // If user has already set up their profile, redirect to dashboard
  if (profile?.first_name && profile?.last_name) {
    redirect("/dashboard")
  }

  return <UserOnboarding />
}
