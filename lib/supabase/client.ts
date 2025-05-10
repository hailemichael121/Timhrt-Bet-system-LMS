import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: {
      key: "sb-auth-token",
      async getItem(key: string) {
        if (typeof document !== "undefined") {
          const cookies = document.cookie.split("; ");
          const cookie = cookies.find((row) => row.startsWith(`${key}=`));
          return cookie ? cookie.split("=")[1] : null;
        }
        return null;
      },
      async setItem(key: string, value: string) {
        if (typeof document !== "undefined") {
          document.cookie = `${key}=${value}; path=/; Secure; SameSite=Lax`;
        }
      },
      async removeItem(key: string) {
        if (typeof document !== "undefined") {
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
      },
    },
    flowType: "pkce",
  },
});

export const logAuthState = async () => {
  console.group("Supabase Auth State");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("Session:", session);
  console.log("User:", user);
  console.log("Cookies:", document.cookie);
  console.groupEnd();
};

supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Supabase auth event: ${event}`, session);
});
