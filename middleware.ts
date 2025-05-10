import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if available
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  console.log("Middleware session check:", session?.user?.email);

  // Public routes
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/about",
    "/contact",
    "/verify-email",
    "/onboarding", // Add onboarding to public routes if profile doesn't exist
  ];

  const isPublicRoute = publicRoutes.some(
    (route) =>
      req.nextUrl.pathname === route ||
      req.nextUrl.pathname.startsWith(`${route}/`)
  );

  const shouldSkip = [
    isPublicRoute,
    req.nextUrl.pathname.startsWith("/api"),
    /\.(jpg|jpeg|png|gif|svg|ico|css|js|woff2)$/i.test(req.nextUrl.pathname),
  ].some((condition) => condition);

  if (shouldSkip) {
    return res;
  }

  // Handle unauthenticated users
  if (!session) {
    if (req.nextUrl.pathname === "/login") {
      return res;
    }

    const loginUrl = new URL("/login", req.url);
    if (!req.nextUrl.pathname.startsWith("/login")) {
      loginUrl.searchParams.set("redirect", req.nextUrl.pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Handle authenticated users - try to get profile but don't fail if it doesn't exist
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .maybeSingle(); // Use maybeSingle instead of single

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      // Instead of redirecting to login, allow access but log the error
      // Redirect to onboarding if profile doesn't exist
      if (req.nextUrl.pathname !== "/onboarding") {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
      return res;
    }

    // If profile exists, handle onboarding flow
    if (profile) {
      const needsOnboarding = !profile.onboarding_completed;
      const isOnboardingPage = req.nextUrl.pathname === "/onboarding";

      if (needsOnboarding && !isOnboardingPage) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }

      if (!needsOnboarding && isOnboardingPage) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Redirect away from auth pages if authenticated
    if (["/login", "/register"].includes(req.nextUrl.pathname)) {
      return NextResponse.redirect(
        new URL(
          profile?.onboarding_completed ? "/dashboard" : "/onboarding",
          req.url
        )
      );
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // Don't redirect to login on error - just continue
    return res;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
