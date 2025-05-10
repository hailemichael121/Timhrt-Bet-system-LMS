export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      assignments: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          due_date: string;
          points: number;
          created_at: string;
          updated_at: string;
          file_url: string | null;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          due_date: string;
          points: number;
          created_at?: string;
          updated_at?: string;
          file_url?: string | null;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string;
          points?: number;
          created_at?: string;
          updated_at?: string;
          file_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          }
        ];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          code: string;
          department: string;
          description: string | null;
          credits: number;
          instructor_id: string | null;
          created_at: string;
          updated_at: string;
          semester: string | null;
          tags: string[] | null;
        };
        Insert: {
          id?: string;
          title: string;
          code: string;
          department: string;
          description?: string | null;
          credits: number;
          instructor_id?: string | null;
          created_at?: string;
          updated_at?: string;
          semester?: string | null;
          tags?: string[] | null;
        };
        Update: {
          id?: string;
          title?: string;
          code?: string;
          department?: string;
          description?: string | null;
          credits?: number;
          instructor_id?: string | null;
          created_at?: string;
          updated_at?: string;
          semester?: string | null;
          tags?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey";
            columns: ["instructor_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          status: string;
          grade: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          status?: string;
          grade?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          course_id?: string;
          status?: string;
          grade?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          content: string;
          course_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          content: string;
          course_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          content?: string;
          course_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_course_id_fkey";
            columns: ["course_id"];
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read: boolean;
          created_at: string;
          link: string | null;
          related_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          read?: boolean;
          created_at?: string;
          link?: string | null;
          related_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          read?: boolean;
          created_at?: string;
          link?: string | null;
          related_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          role: string;
          student_id: string | null;
          created_at: string;
          updated_at: string;
          email: string | null;
          bio: string | null;
          phone: string | null;
          address: string | null;
          date_of_birth: string | null;
          program: string | null;
          year: string | null;
          gpa: string | null;
          advisor: string | null;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          student_id?: string | null;
          created_at?: string;
          updated_at?: string;
          email?: string | null;
          bio?: string | null;
          phone?: string | null;
          address?: string | null;
          date_of_birth?: string | null;
          program?: string | null;
          year?: string | null;
          gpa?: string | null;
          advisor?: string | null;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          role?: string;
          student_id?: string | null;
          created_at?: string;
          updated_at?: string;
          email?: string | null;
          bio?: string | null;
          phone?: string | null;
          address?: string | null;
          date_of_birth?: string | null;
          program?: string | null;
          year?: string | null;
          gpa?: string | null;
          advisor?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          content: string | null;
          file_url: string | null;
          grade: number | null;
          feedback: string | null;
          submitted_at: string;
          graded_at: string | null;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          content?: string | null;
          file_url?: string | null;
          grade?: number | null;
          feedback?: string | null;
          submitted_at?: string;
          graded_at?: string | null;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          content?: string | null;
          file_url?: string | null;
          grade?: number | null;
          feedback?: string | null;
          submitted_at?: string;
          graded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey";
            columns: ["assignment_id"];
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_user_profile: {
        Args: {
          user_id: string;
          user_email: string;
          first_name: string;
          last_name: string;
          role?: string;
          student_id?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          phone?: string | null;
          address?: string | null;
          date_of_birth?: string | null;
          program?: string | null;
          year?: string | null;
          gpa?: string | null;
          advisor?: string | null;
          onboarding_completed?: boolean;
        };
        Returns: void;
      };
    };

    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
