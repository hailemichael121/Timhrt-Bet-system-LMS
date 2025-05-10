-- Enable Row Level Security for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_comments ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  student_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Create course materials table
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  points_possible INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  grade INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  original_grade INTEGER,
  file_name TEXT,
  late BOOLEAN DEFAULT FALSE
);

-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create discussion_replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollment_requests table
CREATE TABLE IF NOT EXISTS enrollment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Create course_suggestions table
CREATE TABLE IF NOT EXISTS course_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  viewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Create course_reminders table
CREATE TABLE IF NOT EXISTS course_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rubrics table
CREATE TABLE IF NOT EXISTS rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignment_rubrics table
CREATE TABLE IF NOT EXISTS assignment_rubrics (
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  rubric_id UUID NOT NULL REFERENCES rubrics(id),
  PRIMARY KEY (assignment_id, rubric_id)
);

-- Create rubric_evaluations table
CREATE TABLE IF NOT EXISTS rubric_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  rubric_id UUID NOT NULL REFERENCES rubrics(id),
  criteria_evaluations JSONB NOT NULL,
  feedback TEXT,
  total_points INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create grade_reviews table
CREATE TABLE IF NOT EXISTS grade_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  requested_by UUID NOT NULL REFERENCES profiles(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT NOT NULL,
  response TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id)
);

-- Create submission_comments table
CREATE TABLE IF NOT EXISTS submission_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussions_course ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_student ON enrollment_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_course ON enrollment_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_status ON enrollment_requests(status);
CREATE INDEX IF NOT EXISTS idx_course_suggestions_student ON course_suggestions(student_id);
CREATE INDEX IF NOT EXISTS idx_course_reminders_course ON course_reminders(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reminders_date ON course_reminders(reminder_date);

-- Add RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Add RLS policies for courses
CREATE POLICY "Teachers can manage their own courses"
ON courses FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view enrolled courses"
ON courses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.course_id = courses.id 
    AND enrollments.student_id = auth.uid()
  )
);

-- Add RLS policies for enrollments
CREATE POLICY "Students can view their enrollments"
ON enrollments FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view enrollments for their courses"
ON enrollments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can request enrollment"
ON enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Add RLS policies for course materials
CREATE POLICY "Teachers can manage course materials"
ON course_materials FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_materials.course_id
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view course materials"
ON course_materials FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments
    JOIN courses ON courses.id = enrollments.course_id
    WHERE enrollments.course_id = course_materials.course_id
    AND enrollments.student_id = auth.uid()
  )
);

-- Add RLS policies for discussions
CREATE POLICY "Students and teachers can view course discussions"
ON discussions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = discussions.course_id
    AND enrollments.student_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = discussions.course_id
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers and enrolled students can create discussions"
ON discussions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = discussions.course_id
    AND enrollments.student_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = discussions.course_id
    AND courses.teacher_id = auth.uid()
  )
);

-- Add RLS policies for discussion replies
CREATE POLICY "Students and teachers can view discussion replies"
ON discussion_replies FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM discussions
    JOIN enrollments ON enrollments.course_id = discussions.course_id
    WHERE discussion_replies.discussion_id = discussions.id
    AND enrollments.student_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM discussions
    JOIN courses ON courses.id = discussions.course_id
    WHERE discussion_replies.discussion_id = discussions.id
    AND courses.teacher_id = auth.uid()
  )
);

CREATE POLICY "Enrolled users can reply to discussions"
ON discussion_replies FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM discussions
    JOIN enrollments ON enrollments.course_id = discussions.course_id
    WHERE discussion_replies.discussion_id = discussions.id
    AND enrollments.student_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM discussions
    JOIN courses ON courses.id = discussions.course_id
    WHERE discussion_replies.discussion_id = discussions.id
    AND courses.teacher_id = auth.uid()
  )
);

-- Add RLS policies for enrollment requests
CREATE POLICY "Students can manage their own enrollment requests"
ON enrollment_requests FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Teachers can manage enrollment requests for their courses"
ON enrollment_requests FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = enrollment_requests.course_id
    AND courses.teacher_id = auth.uid()
  )
);

-- Add RLS policies for rubrics
CREATE POLICY "Teachers can view and create rubrics"
ON rubrics FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin'))
  OR created_by = auth.uid()
);

CREATE POLICY "Teachers can create rubrics"
ON rubrics FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin'))
);

CREATE POLICY "Teachers can update their rubrics"
ON rubrics FOR UPDATE USING (
  created_by = auth.uid() OR 
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Add RLS policies for submission comments
CREATE POLICY "View submission comments"
ON submission_comments FOR SELECT USING (true);

CREATE POLICY "Create submission comments"
ON submission_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Update own comments"
ON submission_comments FOR UPDATE USING (user_id = auth.uid());

-- Add RLS policies for grade reviews
CREATE POLICY "View grade reviews"
ON grade_reviews FOR SELECT USING (
  requested_by = auth.uid() OR
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin')) OR
  auth.uid() IN (
    SELECT c.teacher_id
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    JOIN courses c ON a.course_id = c.id
    WHERE s.id = submission_id
  )
);

CREATE POLICY "Create grade reviews"
ON grade_reviews FOR INSERT WITH CHECK (
  requested_by = auth.uid()
);

CREATE POLICY "Update grade reviews"
ON grade_reviews FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin')) OR
  auth.uid() IN (
    SELECT c.teacher_id
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    JOIN courses c ON a.course_id = c.id
    WHERE s.id = submission_id
  )
);

-- Add admin override capabilities
CREATE POLICY "Admins have full access to profiles"
ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins have full access to courses"
ON courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins have full access to enrollments"
ON enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins have full access to course materials"
ON course_materials FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins have full access to all tables"
ON ALL TABLES IN SCHEMA public FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_courses_modtime
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_assignments_modtime
BEFORE UPDATE ON assignments
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_discussions_modtime
BEFORE UPDATE ON discussions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_discussion_replies_modtime
BEFORE UPDATE ON discussion_replies
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_course_materials_modtime
BEFORE UPDATE ON course_materials
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_rubrics_modtime
BEFORE UPDATE ON rubrics
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Add soft delete function
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create soft delete triggers
CREATE TRIGGER soft_delete_courses
BEFORE DELETE ON courses
FOR EACH ROW EXECUTE FUNCTION soft_delete();

CREATE TRIGGER soft_delete_assignments
BEFORE DELETE ON assignments
FOR EACH ROW EXECUTE FUNCTION soft_delete();

CREATE TRIGGER soft_delete_discussions
BEFORE DELETE ON discussions
FOR EACH ROW EXECUTE FUNCTION soft_delete();

CREATE TRIGGER soft_delete_course_materials
BEFORE DELETE ON course_materials
FOR EACH ROW EXECUTE FUNCTION soft_delete();