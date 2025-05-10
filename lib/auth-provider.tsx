"use client";

import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  student_id?: string;
  avatar_url?: string;
  department: string;
  code: string;
  credits: number;
  email: string;
  role: string;
  onboarding_completed: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;

  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchProfile = async (userId: String) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Create profile if it doesn't exist
        const { error: createError } = await supabase.from("profiles").insert({
          id: userId,
          email: session?.user?.email || "",
          first_name: "",
          last_name: "",
          role: "student",
          onboarding_completed: false,
        });

        if (createError) throw createError;

        // Fetch the newly created profile
        const { data: newProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        setProfile(newProfile);
        return newProfile;
      }

      setProfile(data);
      return data;
    } catch (error) {
      console.error("Profile fetch error:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await fetchProfile(session.user.id);
      }

      setLoading(false);
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      setSession(session);
      setUser(session?.user ?? null);

      if (event === "SIGNED_IN" && session?.user?.id) {
        await fetchProfile(session.user.id);
        router.refresh();

        if (
          typeof window !== "undefined" &&
          window.location.pathname === "/login"
        ) {
          const searchParams = new URLSearchParams(window.location.search);
          const redirectUrl = searchParams.get("redirect") || "/dashboard";
          window.location.href = redirectUrl;
        }
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
