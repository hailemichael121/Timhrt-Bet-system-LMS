// components/SafeAuthWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { AuthProvider } from "@/lib/auth-provider";
import { MockAuthProvider } from "@/context/MockAuthProvider";

export function SafeAuthWrapper({ children }: { children: React.ReactNode }) {
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    setIsDev(process.env.NODE_ENV === "development");
  }, []);

  if (isDev) {
    return <MockAuthProvider>{children}</MockAuthProvider>;
  }

  return <AuthProvider>{children}</AuthProvider>;
}
