import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DailySummaryList } from '@/components/history/DailySummaryList'
import type { DailySummary, User } from '@/types'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function UserHistoryPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // 管理者権限チェック
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', authUser.id)
    .single()

  if (!currentUser || currentUser.role !== 'admin') {
    redirect('/')
  }

  // 対象ユーザーの情報を取得
  const { data: targetUser } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single<User>()

  if (!targetUser) {
    redirect('/admin')
  }

  // 日別サマリーを取得
  const { data: sessions, error } = await supabase
    .from('study_sessions')
    .select('start_time, duration_minutes')
    .eq('user_id', userId)
    .not('end_time', 'is', null)
    .order('start_time', { ascending: false })

  if (error) {
    console.error(error)
  }

  // 日付ごとにグループ化
  const summaryMap = new Map<string, DailySummary>()

  sessions?.forEach((session) => {
    const date = session.start_time.split('T')[0]
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
      {/* 戻るボタン */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
      >
        <ChevronLeft className="w-5 h-5" />
        ユーザー一覧に戻る
      </Link>

      {/* ユーザー情報 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {targetUser.name || targetUser.email}
        </h1>
        <p className="text-sm text-gray-600 mt-1">{targetUser.email}</p>
      </div>

      {/* 履歴リスト */}
      <h2 className="text-lg font-bold text-[#003c68] mb-4">学習履歴</h2>
      <DailySummaryList
        summaries={summaries}
        baseUrl={`/admin/users/${userId}/history`}
      />
    </div>
  )
}
