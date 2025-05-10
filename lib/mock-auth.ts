// lib/mock-auth.ts
export const mockSignIn = async () => {
  if (process.env.NODE_ENV === "development") {
    return {
      user: {
        id: "mock-user-id",
        email: "mock@example.com",
        role: "student",
      },
      session: {
        access_token: "mock-token",
        refresh_token: "mock-refresh-token",
      },
    };
  }
  return null;
};
