"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export function DebugAuth() {
  const { user, session, loading } = useAuth();

  useEffect(() => {
    console.log("Auth state changed:", { user, session, loading });
  }, [user, session, loading]);

  return null;
}
