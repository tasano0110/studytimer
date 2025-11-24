-- Migration for new features: Message settings, Stamp system, Subject management, User preferences
-- Run this migration after the initial setup

-- ============================================================================
-- 1. SUBJECTS TABLE (教科管理)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subjects (
  subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  subject_name VARCHAR(20) NOT NULL,
  display_order INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false, -- '指定なし' flag
  is_builtin BOOLEAN DEFAULT false, -- Initial subjects flag
  color_class VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subject_name)
);

CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_subjects_user_order ON subjects(user_id, display_order);

-- ============================================================================
-- 2. USER MESSAGE SETTINGS TABLE (メッセージ設定)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_message_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  day_type VARCHAR(10) NOT NULL CHECK (day_type IN ('weekday', 'weekend')),
  threshold_minutes INTEGER NOT NULL CHECK (threshold_minutes >= 0),
  message VARCHAR(50) NOT NULL CHECK (length(message) > 0),
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_type, display_order)
);

CREATE INDEX idx_user_message_settings_user_id ON user_message_settings(user_id, day_type, display_order);

-- ============================================================================
-- 3. STAMPS TABLE (スタンプ記録)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stamps (
  stamp_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  earned_date DATE NOT NULL,
  total_minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, earned_date)
);

CREATE INDEX idx_stamps_user_id ON stamps(user_id, earned_date DESC);

-- ============================================================================
-- 4. USER STAMP SETTINGS TABLE (スタンプ設定)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_stamp_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  day_type VARCHAR(10) NOT NULL CHECK (day_type IN ('weekday', 'weekend')),
  required_minutes INTEGER NOT NULL CHECK (required_minutes > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, day_type)
);

CREATE INDEX idx_user_stamp_settings_user_id ON user_stamp_settings(user_id);

-- ============================================================================
-- 5. USER PREFERENCES TABLE (ユーザー設定)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  color_theme VARCHAR(20) DEFAULT 'blue' CHECK (color_theme IN ('blue', 'pink')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================================================
-- 6. MIGRATION: Add subject_id to study_sessions
-- ============================================================================
-- Add new column (nullable for now)
ALTER TABLE study_sessions
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(subject_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_study_sessions_subject_id ON study_sessions(subject_id);

-- ============================================================================
-- 7. FUNCTION: Initialize default settings for new users
-- ============================================================================
CREATE OR REPLACE FUNCTION initialize_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default subjects
  INSERT INTO subjects (user_id, subject_name, display_order, is_default, is_builtin, color_class)
  VALUES
    (NEW.user_id, '指定なし', 0, true, false, 'bg-gray-100 text-gray-800'),
    (NEW.user_id, '算数', 1, false, true, 'bg-[#003c68]/10 text-[#003c68]'),
    (NEW.user_id, '国語', 2, false, true, 'bg-[#0f766e]/10 text-[#0f766e]'),
    (NEW.user_id, '理科', 3, false, true, 'bg-[#4c1d95]/10 text-[#4c1d95]'),
    (NEW.user_id, '社会', 4, false, true, 'bg-[#b45309]/10 text-[#b45309]');

  -- Create default message settings for weekdays
  INSERT INTO user_message_settings (user_id, day_type, threshold_minutes, message, display_order)
  VALUES
    (NEW.user_id, 'weekday', 0, '今日も頑張ろう！', 1),
    (NEW.user_id, 'weekday', 60, 'いい調子だよ！', 2),
    (NEW.user_id, 'weekday', 120, 'あとちょっと頑張ろう！', 3),
    (NEW.user_id, 'weekday', 180, 'おめでとう！よく頑張りました！', 4);

  -- Create default message settings for weekends
  INSERT INTO user_message_settings (user_id, day_type, threshold_minutes, message, display_order)
  VALUES
    (NEW.user_id, 'weekend', 0, '今日も頑張ろう！', 1),
    (NEW.user_id, 'weekend', 120, 'いい調子だよ！', 2),
    (NEW.user_id, 'weekend', 240, 'あとちょっと頑張ろう！', 3),
    (NEW.user_id, 'weekend', 300, 'おめでとう！よく頑張りました！', 4);

  -- Create default stamp settings
  INSERT INTO user_stamp_settings (user_id, day_type, required_minutes)
  VALUES
    (NEW.user_id, 'weekday', 180),
    (NEW.user_id, 'weekend', 300);

  -- Create default user preferences
  INSERT INTO user_preferences (user_id, color_theme)
  VALUES
    (NEW.user_id, 'blue');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. TRIGGER: Auto-initialize defaults for new users
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_initialize_user_defaults ON users;

CREATE TRIGGER trigger_initialize_user_defaults
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_defaults();

-- ============================================================================
-- 9. DATA MIGRATION: Migrate existing users
-- ============================================================================
-- Create default settings for all existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT user_id FROM users LOOP
    -- Check if user already has subjects (in case of re-running)
    IF NOT EXISTS (SELECT 1 FROM subjects WHERE user_id = user_record.user_id) THEN
      -- Create default subjects
      INSERT INTO subjects (user_id, subject_name, display_order, is_default, is_builtin, color_class)
      VALUES
        (user_record.user_id, '指定なし', 0, true, false, 'bg-gray-100 text-gray-800'),
        (user_record.user_id, '算数', 1, false, true, 'bg-[#003c68]/10 text-[#003c68]'),
        (user_record.user_id, '国語', 2, false, true, 'bg-[#0f766e]/10 text-[#0f766e]'),
        (user_record.user_id, '理科', 3, false, true, 'bg-[#4c1d95]/10 text-[#4c1d95]'),
        (user_record.user_id, '社会', 4, false, true, 'bg-[#b45309]/10 text-[#b45309]');

      -- Create message settings
      INSERT INTO user_message_settings (user_id, day_type, threshold_minutes, message, display_order)
      VALUES
        (user_record.user_id, 'weekday', 0, '今日も頑張ろう！', 1),
        (user_record.user_id, 'weekday', 60, 'いい調子だよ！', 2),
        (user_record.user_id, 'weekday', 120, 'あとちょっと頑張ろう！', 3),
        (user_record.user_id, 'weekday', 180, 'おめでとう！よく頑張りました！', 4),
        (user_record.user_id, 'weekend', 0, '今日も頑張ろう！', 1),
        (user_record.user_id, 'weekend', 120, 'いい調子だよ！', 2),
        (user_record.user_id, 'weekend', 240, 'あとちょっと頑張ろう！', 3),
        (user_record.user_id, 'weekend', 300, 'おめでとう！よく頑張りました！', 4);

      -- Create stamp settings
      INSERT INTO user_stamp_settings (user_id, day_type, required_minutes)
      VALUES
        (user_record.user_id, 'weekday', 180),
        (user_record.user_id, 'weekend', 300);

      -- Create preferences
      INSERT INTO user_preferences (user_id, color_theme)
      VALUES
        (user_record.user_id, 'blue');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 10. DATA MIGRATION: Link existing study_sessions to subjects
-- ============================================================================
DO $$
DECLARE
  user_record RECORD;
  session_record RECORD;
  subject_id_map UUID;
BEGIN
  -- For each study session, find the matching subject_id
  FOR session_record IN
    SELECT session_id, user_id, subject
    FROM study_sessions
    WHERE subject_id IS NULL
  LOOP
    -- Find the subject_id for this user and subject name
    SELECT s.subject_id INTO subject_id_map
    FROM subjects s
    WHERE s.user_id = session_record.user_id
      AND s.subject_name = session_record.subject
    LIMIT 1;

    -- Update the session with the subject_id
    IF subject_id_map IS NOT NULL THEN
      UPDATE study_sessions
      SET subject_id = subject_id_map
      WHERE session_id = session_record.session_id;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_message_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stamp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Subjects policies
CREATE POLICY "Users can view their own subjects"
  ON subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subjects"
  ON subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects"
  ON subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects"
  ON subjects FOR DELETE
  USING (auth.uid() = user_id);

-- User message settings policies
CREATE POLICY "Users can view their own message settings"
  ON user_message_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own message settings"
  ON user_message_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message settings"
  ON user_message_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own message settings"
  ON user_message_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Stamps policies
CREATE POLICY "Users can view their own stamps"
  ON stamps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stamps"
  ON stamps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stamps"
  ON stamps FOR DELETE
  USING (auth.uid() = user_id);

-- User stamp settings policies
CREATE POLICY "Users can view their own stamp settings"
  ON user_stamp_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stamp settings"
  ON user_stamp_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Admin policies (can view all data)
CREATE POLICY "Admins can view all subjects"
  ON subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all stamps"
  ON stamps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ============================================================================
-- 12. UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_message_settings_updated_at
  BEFORE UPDATE ON user_message_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stamp_settings_updated_at
  BEFORE UPDATE ON user_stamp_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migration complete!
-- ============================================================================
