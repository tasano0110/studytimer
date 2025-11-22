import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DailyDetailList } from '@/components/history/DailyDetailList'
import { formatDate } from '@/lib/utils/dateUtils'
import type { StudySession, User } from '@/types'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function UserDailyDetailPage({
  params,
}: {
  params: Promise<{ userId: string; date: string }>
}) {
  const { userId, date } = await params
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

  // セッションを取得
  const startOfDay = new Date(`${date}T00:00:00`)
  const endOfDay = new Date(`${date}T23:59:59`)

  const { data: sessions, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString())
    .not('end_time', 'is', null)
    .order('start_time', { ascending: true })

  if (error) {
    console.error(error)
  }

  // 合計時間を計算
  const totalMinutes = (sessions || []).reduce((sum, session) => {
    return sum + (session.duration_minutes || 0)
  }, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 戻るボタン */}
      <Link
        href={`/admin/users/${userId}`}
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
      >
        <ChevronLeft className="w-5 h-5" />
        {targetUser.name || targetUser.email}の履歴に戻る
      </Link>

      {/* ユーザー情報 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">
            {targetUser.name || targetUser.email}
          </span>
          の学習記録
        </p>
      </div>

      {/* ページタイトル */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {formatDate(date)}
      </h1>

      {/* 詳細リスト（読み取り専用） */}
      <DailyDetailList
        sessions={(sessions as StudySession[]) || []}
        totalMinutes={totalMinutes}
        readOnly={true}
      />
    </div>
  )
}
