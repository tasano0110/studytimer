-- ============================================
-- RLS ポリシーの修正：新規ユーザー登録を許可
-- ============================================

-- 既存のINSERTポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Enable insert for authentication" ON users;

-- トリガー関数がusersテーブルにINSERTできるようにするポリシー
-- SECURITY DEFINERの関数がINSERTできるように設定
CREATE POLICY "Enable insert for authentication"
  ON users FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- または、サービスロールのみ許可する場合
-- CREATE POLICY "Service role can insert users"
--   ON users FOR INSERT
--   TO service_role
--   WITH CHECK (true);

-- トリガー関数を再作成（SECURITY DEFINERを確認）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'user'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーをログに記録（Supabase logsで確認可能）
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- トリガーを再作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
