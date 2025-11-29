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
        has_stamp: false,
      })
    }
  })

  // スタンプ情報を取得
  const { data: stamps } = await supabase
    .from('stamps')
    .select('earned_date')
    .eq('user_id', user.id)

  // スタンプが存在する日付をセットに追加
  const stampDates = new Set(stamps?.map((s) => s.earned_date) || [])

  // サマリーにスタンプ情報を追加
  summaryMap.forEach((summary) => {
    summary.has_stamp = stampDates.has(summary.date)
  })

  const summaries = Array.from(summaryMap.values())

  // 累積スタンプ数を計算
  const totalStamps = stamps?.length || 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-slate-700">
          学習履歴
        </h1>
        <div className="text-base sm:text-lg font-medium text-slate-700">
          累積獲得スタンプ数：
          <span className="font-bold text-slate-700">
            {totalStamps}個
          </span>
        </div>
      </div>
      <DailySummaryList summaries={summaries} />
    </div>
  )
}
