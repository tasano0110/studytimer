-- 11月23日のスタンプを追加するスクリプト
-- このスクリプトは、11月23日に5時間以上の学習記録があるユーザーにスタンプを付与します

-- まず、11月23日の学習記録を確認（オプション）
-- SELECT
--   user_id,
--   SUM(duration_minutes) as total_minutes
-- FROM study_sessions
-- WHERE DATE(start_time) = '2024-11-23'
--   AND end_time IS NOT NULL
-- GROUP BY user_id
-- HAVING SUM(duration_minutes) >= 300;

-- スタンプを追加（既に存在する場合はスキップ）
INSERT INTO stamps (user_id, earned_date, total_minutes)
SELECT
  user_id,
  '2024-11-23' as earned_date,
  SUM(duration_minutes) as total_minutes
FROM study_sessions
WHERE DATE(start_time) = '2024-11-23'
  AND end_time IS NOT NULL
GROUP BY user_id
HAVING SUM(duration_minutes) >= 300
ON CONFLICT (user_id, earned_date) DO NOTHING;

-- 結果を確認
SELECT
  s.earned_date,
  s.total_minutes,
  u.name,
  u.email
FROM stamps s
JOIN users u ON s.user_id = u.user_id
WHERE s.earned_date = '2024-11-23';
