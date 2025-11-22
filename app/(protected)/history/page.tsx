import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DailySummaryList } from '@/components/history/DailySummaryList'
import type { DailySummary } from '@/types'

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 日別サマリーを取得
  const { data: sessions, error } = await supabase
    .from('study_sessions')
    .select('start_time, duration_minutes')
    .eq('user_id', user.id)
    .not('end_time', 'is', null) // 計測中のセッションは除外
    .order('start_time', { ascending: false })

  if (error) {
    console.error(error)
  }

  // 日付ごとにグループ化
  const summaryMap = new Map<string, DailySummary>()

  sessions?.forEach((session) => {
    const date = session.start_time.split('T')[0] // YYYY-MM-DD
    const existing = summaryMap.get(date)

    if (existing) {
      existing.total_minutes += session.duration_minutes || 0
      existing.session_count += 1
    } else {
      summaryMap.set(date, {
        date,
        total_minutes: session.duration_minutes || 0,
        session_count: 1,
      })
    }
  })

  const summaries = Array.from(summaryMap.values())

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#003c68] mb-6">学習履歴</h1>
      <DailySummaryList summaries={summaries} />
    </div>
  )
}
