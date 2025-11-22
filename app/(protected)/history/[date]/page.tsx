'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DailyDetailList } from '@/components/history/DailyDetailList'
import { EditSessionModal } from '@/components/record/EditSessionModal'
import { Loading } from '@/components/ui/Loading'
import { formatDate } from '@/lib/utils/dateUtils'
import { calculateDuration } from '@/lib/utils/timeUtils'
import type { StudySession, Subject } from '@/types'
import toast from 'react-hot-toast'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function DailyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const date = params.date as string

  const [sessions, setSessions] = useState<StudySession[]>([])
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<StudySession | null>(null)

  // セッションを取得
  const fetchSessions = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const startOfDay = new Date(`${date}T00:00:00`)
    const endOfDay = new Date(`${date}T23:59:59`)

    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .not('end_time', 'is', null)
      .order('start_time', { ascending: true })

    if (error) {
      toast.error('データの取得に失敗しました')
      console.error(error)
      return
    }

    setSessions(data || [])

    // 合計時間を計算
    const total = (data || []).reduce((sum, session) => {
      return sum + (session.duration_minutes || 0)
    }, 0)
    setTotalMinutes(total)
    setLoading(false)
  }

  useEffect(() => {
    fetchSessions()
  }, [date])

  // 編集
  const handleEditSession = async (data: {
    sessionId: string
    date: string
    subject: Subject
    startTime: string
    endTime: string
  }) => {
    const startDateTime = new Date(`${data.date}T${data.startTime}`)
    const endDateTime = new Date(`${data.date}T${data.endTime}`)
    const duration = calculateDuration(startDateTime, endDateTime)

    const { error } = await supabase
      .from('study_sessions')
      .update({
        subject: data.subject,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        duration_minutes: duration,
      })
      .eq('session_id', data.sessionId)

    if (error) {
      toast.error('更新に失敗しました')
      throw error
    }

    toast.success('セッションを更新しました')

    // 日付が変更された場合はリダイレクト
    if (data.date !== date) {
      router.push(`/history/${data.date}`)
    } else {
      fetchSessions()
    }
  }

  // 削除
  const handleDeleteSession = async (sessionId: string) => {
    const { error } = await supabase
      .from('study_sessions')
      .delete()
      .eq('session_id', sessionId)

    if (error) {
      toast.error('削除に失敗しました')
      console.error(error)
      return
    }

    toast.success('セッションを削除しました')
    fetchSessions()
  }

  // 編集モーダルを開く
  const handleOpenEdit = (session: StudySession) => {
    setEditingSession(session)
    setIsEditModalOpen(true)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 戻るボタン */}
      <Link
        href="/history"
        className="inline-flex items-center gap-2 text-[#003c68] hover:text-[#00508d] mb-4"
      >
        <ChevronLeft className="w-5 h-5" />
        履歴一覧に戻る
      </Link>

      {/* ページタイトル */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {formatDate(date)}
      </h1>

      {/* 詳細リスト */}
      <DailyDetailList
        sessions={sessions}
        totalMinutes={totalMinutes}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteSession}
      />

      {/* 編集モーダル */}
      <EditSessionModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingSession(null)
        }}
        session={editingSession}
        onSubmit={handleEditSession}
      />
    </div>
  )
}
