"use client"

import { useContext } from "react"
import { AuthContext } from "@/lib/auth-provider"

export function useCurrentUser() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useCurrentUser must be used within an AuthProvider")
  }

  return {
    user: context.user,
    profile: context.profile,
    loading: context.loading,
  }
}
