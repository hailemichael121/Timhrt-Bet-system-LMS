"use client";

import {
  createContext,
  useEffect,
  useState,
  useCallback,
  useContext,
} from "react";
import { supabase, logAuthState } from "@/lib/supabase/client";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

// Type definitions
interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  student_id?: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface UserData {
  firstName: string;
  lastName: string;
  role: string;
  studentId?: string;
  email: string;
}

interface Notification {
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ session: Session | null; user: User | null }>;
  signUp: (
    email: string,
    password: string,
    userData: UserData
  ) => Promise<{ user: User | null; session: Session | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<Profile>;
  refreshProfile: () => Promise<void>;
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const [globalLoading, setGlobalLoading] = useState(false);

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile> => {
      try {
        console.log(`Fetching profile for user: ${userId}`);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error || !data) {
          console.error("Profile fetch error:", error);
          throw error ?? new Error("Profile not found");
        }

        console.log("Profile fetched successfully:", data);
        setProfile(data);
        return data;
      } catch (error) {
        console.error("Error in fetchProfile:", error);
        toast({
          title: "Profile Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to load user profile",
          variant: "destructive",
        });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const refreshProfile = useCallback(async () => {
    if (!user) {
      console.warn("No user available to refresh profile");
      return;
    }
    console.log("Refreshing profile...");
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const initializeAuth = useCallback(async () => {
    try {
      console.log("Initializing auth...");
      setLoading(true);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Session fetch error:", error);
        throw error;
      }

      console.log("Initial session:", session);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log("User found, fetching profile...");
        await fetchProfile(session.user.id);
      } else {
        console.log("No session found");
        setProfile(null);
      }
    } catch (error) {
      console.error("Initialization error:", error);
      toast({
        title: "Initialization Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to initialize authentication",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log("Auth initialization complete");
      await logAuthState();
    }
  }, [fetchProfile, toast]);

  useEffect(() => {
    console.log("Setting up auth state listener");
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.group(`Auth state changed: ${event}`);
      // Immediately update local state
      setSession(session);
      setUser(session?.user ?? null);
      console.log("New session:", session);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log("User authenticated, fetching profile...");
        await fetchProfile(session.user.id);
      } else {
        console.log("User signed out");
        setProfile(null);
      }
      if (event === "SIGNED_IN") {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (session?.user) {
        await fetchProfile(session.user.id);
      }

      // Handle specific auth events
      switch (event) {
        case "SIGNED_IN":
          toast({
            title: "Signed in successfully",
            description: "Welcome back!",
          });
          router.refresh();
          break;
        case "SIGNED_OUT":
          toast({
            title: "Signed out",
            description: "You have been signed out successfully.",
          });
          router.refresh();
          break;
        case "USER_UPDATED":
          toast({
            title: "Profile updated",
            description: "Your profile has been updated successfully.",
          });
          break;
      }

      console.groupEnd();
      await logAuthState();
    });

    return () => {
      console.log("Cleaning up auth listener");
      subscription.unsubscribe();
    };
  }, [initializeAuth, fetchProfile, toast, router]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log(`Attempting sign in with email: ${email}`);
      setGlobalLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        throw error;
      }

      if (!data.session) {
        throw new Error("No session returned after sign in");
      }

      console.log("Sign in successful:", data);
      return data;
    } catch (error) {
      console.error("Sign in failed:", error);
      toast({
        title: "Authentication failed",
        description:
          error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setGlobalLoading(false);
      await logAuthState();
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: UserData
  ) => {
    try {
      console.log(`Attempting sign up for email: ${email}`);
      setGlobalLoading(true);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error("Sign up error:", authError);
        throw authError;
      }

      if (authData.user) {
        console.log("Auth successful, creating profile...");
        const profilePayload = {
          id: authData.user.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          student_id: userData.role === "student" ? userData.studentId : null,
          email: userData.email,
          onboarding_completed: false,
        };

        const { error: profileError } = await supabase
          .from("profiles")
          .insert(profilePayload);

        if (profileError) {
          console.error("Profile creation error:", profileError);
          throw profileError;
        }

        console.log("Creating welcome notification...");
        const notificationPayload: Notification = {
          user_id: authData.user.id,
          title: "Welcome to ትምህርት ቤት!",
          message: "Thank you for joining our platform.",
          type: "welcome",
          read: false,
        };

        await supabase.from("notifications").insert(notificationPayload);

        toast({
          title: "Account created",
          description: "Your account has been created successfully.",
        });
      }

      console.log("Sign up complete:", authData);
      return authData;
    } catch (error) {
      console.error("Sign up failed:", error);
      toast({
        title: "Registration failed",
        description:
          error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setGlobalLoading(false);
      await logAuthState();
    }
  };

  const signOut = async () => {
    try {
      console.log("Attempting sign out...");
      setGlobalLoading(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }

      console.log("Sign out successful");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to sign out",
        variant: "destructive",
      });
    } finally {
      setGlobalLoading(false);
      await logAuthState();
    }
  };

  const updateProfile = async (data: Partial<Profile>): Promise<Profile> => {
    if (!user) {
      throw new Error("No user available to update profile");
    }

    try {
      console.log(`Updating profile for user: ${user.id}`, data);
      setGlobalLoading(true);

      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", user.id)
        .select()
        .single();

      if (error || !updatedProfile) {
        console.error("Profile update error:", error);
        throw error ?? new Error("Failed to update profile");
      }

      console.log("Profile updated successfully");
      setProfile(updatedProfile);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      return updatedProfile;
    } catch (error) {
      console.error("Update profile failed:", error);
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    } finally {
      setGlobalLoading(false);
      await logAuthState();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
        globalLoading,
        setGlobalLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
