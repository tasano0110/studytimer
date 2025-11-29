-- ============================================================================
-- Fix user_preferences table for new color themes
-- ============================================================================

-- 1. Drop the old check constraint
ALTER TABLE user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_color_theme_check;

-- 2. Add new check constraint with all themes
ALTER TABLE user_preferences
  ADD CONSTRAINT user_preferences_color_theme_check
  CHECK (color_theme IN ('slate', 'teal', 'blue', 'pink'));

-- 3. Update default value to 'slate'
ALTER TABLE user_preferences
  ALTER COLUMN color_theme SET DEFAULT 'slate';

-- 4. Add INSERT policy for user_preferences (missing in original migration)
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Update the initialize_user_defaults function to use 'slate' as default
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

  -- Create default user preferences with 'slate' theme
  INSERT INTO user_preferences (user_id, color_theme)
  VALUES
    (NEW.user_id, 'slate');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Migration complete!
-- このSQLファイルをSupabase SQL Editorで実行してください
-- ============================================================================
