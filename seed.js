require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const users = [
  // Admin
  {
    email: "admin@example.com",
    password: "admin123",
    profile: {
      first_name: "Admin",
      last_name: "User",
      role: "admin",
      student_id: null,
      avatar_url: "",
      onboarding_completed: true,
    },
  },
  // Teachers
  {
    email: "teacher@example.com",
    password: "teacher123",
    profile: {
      first_name: "John",
      last_name: "Smith",
      role: "teacher",
      student_id: null,
      avatar_url: "",
      onboarding_completed: true,
    },
  },
  {
    email: "maria.garcia@example.com",
    password: "teacher123",
    profile: {
      first_name: "Maria",
      last_name: "Garcia",
      role: "teacher",
      student_id: null,
      avatar_url: "",
      onboarding_completed: true,
    },
  },
  // Students
  {
    email: "jane.doe@example.com",
    password: "student123",
    profile: {
      first_name: "Jane",
      last_name: "Doe",
      role: "student",
      student_id: "S10001",
      avatar_url: "",
      onboarding_completed: true,
    },
  },
  {
    email: "john.smith@example.com",
    password: "student123",
    profile: {
      first_name: "John",
      last_name: "Smith",
      role: "student",
      student_id: "S10002",
      avatar_url: "",
      onboarding_completed: true,
    },
  },
  {
    email: "emily.johnson@example.com",
    password: "student123",
    profile: {
      first_name: "Emily",
      last_name: "Johnson",
      role: "student",
      student_id: "S10003",
      avatar_url: "",
      onboarding_completed: true,
    },
  },
  {
    email: "michael.brown@example.com",
    password: "student123",
    profile: {
      first_name: "Michael",
      last_name: "Brown",
      role: "student",
      student_id: "S10004",
      avatar_url: "",
      onboarding_completed: true,
    },
  },
  {
    email: "sarah.wilson@example.com",
    password: "student123",
    profile: {
      first_name: "Sarah",
      last_name: "Wilson",
      role: "student",
      student_id: "S10005",
      avatar_url: "",
      onboarding_completed: true,
    },
  },
];

async function seed() {
  for (const user of users) {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: user.profile,
        });

      if (authError) throw authError;

      // 2. Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email: user.email,
        ...user.profile,
        last_login: new Date().toISOString(),
      });

      if (profileError) throw profileError;

      console.log(`Created user: ${user.email}`);
    } catch (error) {
      console.error(`Error creating ${user.email}:`, error.message);
    }
  }
}

seed();
