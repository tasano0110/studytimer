import { DayType, UserMessageSetting } from '@/types'

/**
 * 曜日からday_typeを取得
 * @param date - 日付
 * @returns 'weekday' | 'weekend'
 */
export function getDayType(date: Date = new Date()): DayType {
  const dayOfWeek = date.getDay() // 0 (Sunday) to 6 (Saturday)
  return dayOfWeek === 0 || dayOfWeek === 6 ? 'weekend' : 'weekday'
}

/**
 * 合計時間に基づいて適切なメッセージを取得
 * @param totalMinutes - 合計時間（分）
 * @param settings - メッセージ設定の配列（display_order順にソート済み）
 * @returns メッセージ文字列
 */
export function getMessageForTime(
  totalMinutes: number,
  settings: UserMessageSetting[]
): string {
  if (!settings || settings.length === 0) {
    return '今日も頑張ろう！'
  }

  // 降順でソートして、合計時間を超える最大の閾値を見つける
  const sortedSettings = [...settings].sort(
    (a, b) => b.threshold_minutes - a.threshold_minutes
  )

  for (const setting of sortedSettings) {
    if (totalMinutes >= setting.threshold_minutes) {
      return setting.message
    }
  }

  // 全ての閾値を下回る場合は最初のメッセージ（最小閾値のメッセージ）
  return settings[0]?.message || '今日も頑張ろう！'
}
