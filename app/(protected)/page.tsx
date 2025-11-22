'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTimerStore } from '@/lib/store/timerStore'
import { SubjectSelector } from '@/components/record/SubjectSelector'
import { TimerButton } from '@/components/record/TimerButton'
import { TodaySessionsList } from '@/components/record/TodaySessionsList'
import { AddSessionModal } from '@/components/record/AddSessionModal'
import { EditSessionModal } from '@/components/record/EditSessionModal'
import { Loading } from '@/components/ui/Loading'
import { formatDuration } from '@/lib/utils/timeUtils'
import { calculateDuration } from '@/lib/utils/timeUtils'
import { getStartOfDay, getEndOfDay } from '@/lib/utils/dateUtils'
import type { StudySession, Subject } from '@/types'
import toast from 'react-hot-toast'

export default function RecordPage() {
  const supabase = createClient()
  const router = useRouter()
  const {
    isRunning,
    currentSessionId,
    selectedSubject,
    setIsRunning,
    setCurrentSessionId,
    setSelectedSubject,
    reset,
  } = useTimerStore()

  const [sessions, setSessions] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(true)
  const [totalMinutes, setTotalMinutes] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<StudySession | null>(null)

  // Supabase の認証エラー共通ハンドラ
  const handleSupabaseError = async (error: unknown, defaultMessage: string) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error)
    }

    const err = error as { message?: string; code?: string }
    const message = err?.message ?? ''
    const code = err?.code

    // リフレッシュトークンが無効な場合はログアウトしてログイン画面へ
    if (
      code === 'refresh_token_not_found' ||
      message.includes('Invalid Refresh Token')
    ) {
      toast.error('ログイン情報の有効期限が切れました。もう一度ログインしてください。')
      await supabase.auth.signOut()
      router.push('/login')
      return
    }

    toast.error(defaultMessage)
  }

  // ユーザーIDを取得
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          await handleSupabaseError(error, 'ユーザー情報の取得に失敗しました')
          return
        }

        if (user) {
          setUserId(user.id)
        }
      } catch (error) {
        await handleSupabaseError(error, 'ユーザー情報の取得に失敗しました')
      }
    }
    getUser()
  }, [supabase, router])

  // 当日のセッションを取得
  const fetchTodaySessions = async () => {
    if (!userId) return

    const today = new Date()
    const startOfToday = getStartOfDay(today)
    const endOfToday = getEndOfDay(today)

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startOfToday.toISOString())
        .lte('start_time', endOfToday.toISOString())
        .order('start_time', { ascending: true })

      if (error) {
        await handleSupabaseError(error, 'データの取得に失敗しました')
        return
      }

      setSessions(data || [])

      // 合計時間を計算
      const total = (data || []).reduce((sum, session) => {
        return sum + (session.duration_minutes || 0)
      }, 0)
      setTotalMinutes(total)

      // 計測中のセッションがあれば復元
      const runningSession = data?.find((s) => !s.end_time)
      if (runningSession) {
        setIsRunning(true)
        setCurrentSessionId(runningSession.session_id)
        setSelectedSubject(runningSession.subject)
      }
    } catch (error) {
      await handleSupabaseError(error, 'データの取得に失敗しました')
    }
  }

  useEffect(() => {
    if (userId) {
      fetchTodaySessions()
    }
  }, [userId])

  // タイマー開始
  const handleStart = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          subject: selectedSubject,
          start_time: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        await handleSupabaseError(error, '開始に失敗しました')
        return
      }

      setIsRunning(true)
      setCurrentSessionId(data.session_id)
      toast.success('計測を開始しました')
      fetchTodaySessions()
    } catch (error) {
      await handleSupabaseError(error, '開始に失敗しました')
    }
  }

  // タイマー停止
  const handleStop = async () => {
    if (!currentSessionId) return

    try {
      const endTime = new Date()
      const session = sessions.find((s) => s.session_id === currentSessionId)
      if (!session) return

      const duration = calculateDuration(session.start_time, endTime)

      const { error } = await supabase
        .from('study_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: duration,
        })
        .eq('session_id', currentSessionId)

      if (error) {
        await handleSupabaseError(error, '停止に失敗しました')
        return
      }

      toast.success(`${formatDuration(duration)}を記録しました`)
      reset()
      fetchTodaySessions()
    } catch (error) {
      await handleSupabaseError(error, '停止に失敗しました')
    }
  }

  // 手動追加
  const handleAddSession = async (data: {
    date: string
    subject: Subject
    startTime: string
    endTime: string
  }) => {
    if (!userId) return

    const startDateTime = new Date(`${data.date}T${data.startTime}`)
    const endDateTime = new Date(`${data.date}T${data.endTime}`)
    const duration = calculateDuration(startDateTime, endDateTime)

    const { error } = await supabase.from('study_sessions').insert({
      user_id: userId,
      subject: data.subject,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      duration_minutes: duration,
    })

    if (error) {
      toast.error('追加に失敗しました')
      throw error
    }

    toast.success('セッションを追加しました')
    fetchTodaySessions()
  }

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
    fetchTodaySessions()
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
    fetchTodaySessions()
  }

  // 編集モーダルを開く
  const handleOpenEdit = (session: StudySession) => {
    setEditingSession(session)
    setIsEditModalOpen(true)
  }

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return <Loading />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* 当日の合計時間 */}
      <div className="bg-[#003c68] text-white rounded-lg p-6 shadow-lg text-center">
        <h2 className="text-sm font-medium mb-2">合計時間</h2>
        <p className="text-4xl font-bold">{formatDuration(totalMinutes)}</p>
      </div>

      {/* タイマーセクション */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="space-y-6">
          {/* 教科選択 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
              教科を選択
            </h3>
            <SubjectSelector
              selectedSubject={selectedSubject}
              onSelectSubject={setSelectedSubject}
              disabled={isRunning}
            />
          </div>

          {/* タイマーボタン */}
          <div className="flex justify-center pt-4">
            <TimerButton
              isRunning={isRunning}
              onStart={handleStart}
              onStop={handleStop}
            />
          </div>
        </div>
      </div>

      {/* 当日の記録リスト */}
      <TodaySessionsList
        sessions={sessions}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteSession}
        onAddManual={() => setIsAddModalOpen(true)}
      />

      {/* モーダル */}
      <AddSessionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSession}
      />

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
