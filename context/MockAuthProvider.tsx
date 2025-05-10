// context/MockAuthProvider.tsx
"use client";

import { ReactNode, useState } from "react";
import { AuthContext } from "./AuthContext";

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState({
    id: "mock-user-id",
    email: "mock@example.com",
  });

  const [profile] = useState({
    id: "mock-user-id",
    first_name: "Mock",
    last_name: "User",
    role: "student",
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading: false,
        signIn: async () => ({ user, session: null }),
        signOut: async () => {},
        // ... other methods
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
