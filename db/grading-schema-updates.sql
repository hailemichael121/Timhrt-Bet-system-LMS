-- Create table for rubrics
CREATE TABLE IF NOT EXISTS rubrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for assignment-rubric associations
CREATE TABLE IF NOT EXISTS assignment_rubrics (
  assignment_id UUID NOT NULL REFERENCES assignments(id),
  rubric_id UUID NOT NULL REFERENCES rubrics(id),
  PRIMARY KEY (assignment_id, rubric_id)
);

-- Create table for rubric evaluations
CREATE TABLE IF NOT EXISTS rubric_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  rubric_id UUID NOT NULL REFERENCES rubrics(id),
  criteria_evaluations JSONB NOT NULL,
  feedback TEXT,
  total_points INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for grade reviews
CREATE TABLE IF NOT EXISTS grade_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  requested_by UUID NOT NULL REFERENCES profiles(id),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT NOT NULL,
  response TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id)
);

-- Create table for submission comments
CREATE TABLE IF NOT EXISTS submission_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to submissions table
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS original_grade INTEGER,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS late BOOLEAN DEFAULT FALSE;

-- Add columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS formatted_content BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Add RLS policies
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_comments ENABLE ROW LEVEL SECURITY;

-- Teachers can view and create rubrics
CREATE POLICY view_rubrics ON rubrics
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin'))
    OR created_by = auth.uid()
  );

CREATE POLICY create_rubrics ON rubrics
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin'))
  );

CREATE POLICY update_rubrics ON rubrics
  FOR UPDATE
  USING (
    created_by = auth.uid() OR 
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Allow all users to view submission comments
CREATE POLICY view_comments ON submission_comments
  FOR SELECT
  USING (true);

-- Allow users to create comments on submissions
CREATE POLICY create_comments ON submission_comments
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own comments
CREATE POLICY update_comments ON submission_comments
  FOR UPDATE
  USING (user_id = auth.uid());

-- Grade review policies
CREATE POLICY view_grade_reviews ON grade_reviews
  FOR SELECT
  USING (
    requested_by = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin')) OR
    auth.uid() IN (
      SELECT c.instructor_id
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.id = submission_id
    )
  );

CREATE POLICY create_grade_reviews ON grade_reviews
  FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
  );

CREATE POLICY update_grade_reviews ON grade_reviews
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('teacher', 'admin')) OR
    auth.uid() IN (
      SELECT c.instructor_id
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.id = submission_id
    )
  );
