import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // Get the current user session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if the user has completed onboarding
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed, first_name, last_name")
      .eq("id", session.user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Determine if onboarding is needed
    const needsOnboarding = !profile.onboarding_completed || !profile.first_name || !profile.last_name

    return NextResponse.json({ needsOnboarding })
  } catch (error) {
    console.error("Error checking onboarding status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
