"use client";

import { useContext } from "react";
import { AuthContext } from "@/lib/auth-provider";

export function useCurrentUser() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useCurrentUser must be used within an AuthProvider");
  }

  return {
    user: context.user,
    profile: context.profile,
    avatar_url: context.user?.user_metadata?.avatar_url,
    firstName: context.profile?.first_name,
    lastName: context.profile?.last_name,
    email: context.user?.email,
    role: context.profile?.role,
    onboardingCompleted: context.profile?.onboarding_completed,
    studentId: context.profile?.student_id,
    loading: context.loading,
    signIn: context.signIn,
    signOut: context.signOut,
    avatarURl: context.user?.user_metadata?.avatar_url,
    refreshProfile: context.refreshProfile,
    session: context.session,
    isAuthenticated: !!context.user,
  };
}
