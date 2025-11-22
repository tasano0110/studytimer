import { format, startOfDay, endOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * 日付を「YYYY年MM月DD日」形式でフォーマット
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy年MM月dd日', { locale: ja })
}

/**
 * 時刻を「HH:MM」形式でフォーマット
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'HH:mm')
}

/**
 * 日時を「YYYY年MM月DD日 HH:MM」形式でフォーマット
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy年MM月dd日 HH:mm', { locale: ja })
}

/**
 * 今日の日付を「YYYY-MM-DD」形式で取得
 */
export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/**
 * その日の00:00:00を取得
 */
export function getStartOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  return startOfDay(d)
}

/**
 * その日の23:59:59を取得
 */
export function getEndOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  return endOfDay(d)
}
