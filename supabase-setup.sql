-- ============================================
-- 勉強時間管理アプリ データベースセットアップ
-- ============================================

-- Usersテーブル作成
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- StudySessionsテーブル作成
CREATE TABLE IF NOT EXISTS study_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  subject VARCHAR(20) DEFAULT '指定なし' CHECK (subject IN ('算数', '国語', '理科', '社会', '指定なし')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_end_time CHECK (end_time IS NULL OR end_time > start_time)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_start ON study_sessions(user_id, start_time DESC);

-- 自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Usersテーブルの更新トリガー
DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- StudySessionsテーブルの更新トリガー
DROP TRIGGER IF EXISTS study_sessions_updated_at ON study_sessions;
CREATE TRIGGER study_sessions_updated_at
  BEFORE UPDATE ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Row Level Security (RLS) 設定
-- ============================================

-- RLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（再実行時のエラー防止）
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON study_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON study_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON study_sessions;

-- Usersテーブルのポリシー
-- 自分自身のプロフィールのみ閲覧・更新可能
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = user_id);

-- ▼注意
-- 以前は「Admins can view all users」ポリシーで管理者が全ユーザーを閲覧できるようにしていましたが、
-- そのポリシー内で users テーブルを再度 SELECT していたため、
-- RLS 評価時に無限再帰が発生し「infinite recursion detected in policy for relation \"users\"」エラーになっていました。
-- ひとまずこのポリシーは削除し、Usersテーブルは「自分自身のみ閲覧・更新できる」挙動に限定しています。
-- 将来、管理者が全ユーザーを閲覧できるようにする場合は、auth.jwt() のカスタムクレームなど
-- users テーブルを再帰的に参照しない方法で実装してください。

-- StudySessionsテーブルのポリシー
CREATE POLICY "Users can view own sessions"
  ON study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON study_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON study_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 新規ユーザー登録時の自動プロフィール作成
-- ============================================

-- 新規ユーザー作成時にusersテーブルにレコードを自動作成する関数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを作成（auth.usersテーブルに新規ユーザーが追加されたときに実行）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 既に存在しているauth.usersをusersテーブルに同期（足りない分だけを追加）
INSERT INTO public.users (user_id, email, name, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', ''),
  'user'
FROM auth.users au
LEFT JOIN public.users u ON u.user_id = au.id
WHERE u.user_id IS NULL;

-- ============================================
-- 完了メッセージ
-- ============================================
-- このSQLを実行後、Supabaseダッシュボードで確認してください
-- - usersテーブルが作成されていること
-- - study_sessionsテーブルが作成されていること
-- - RLSが有効になっていること
