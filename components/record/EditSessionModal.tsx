'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Subject, StudySession } from '@/types'
import { format } from 'date-fns'

interface EditSessionModalProps {
  isOpen: boolean
  onClose: () => void
  session: StudySession | null
  onSubmit: (data: {
    sessionId: string
    date: string
    subject: Subject
    startTime: string
    endTime: string
  }) => Promise<void>
}

const subjects: Subject[] = ['指定なし', '算数', '国語', '理科', '社会']

export function EditSessionModal({
  isOpen,
  onClose,
  session,
  onSubmit,
}: EditSessionModalProps) {
  const [date, setDate] = useState('')
  const [subject, setSubject] = useState<Subject>('指定なし')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // セッションデータをフォームに反映
  useEffect(() => {
    if (session) {
      const startDate = new Date(session.start_time)
      setDate(format(startDate, 'yyyy-MM-dd'))
      setSubject(session.subject)
      setStartTime(format(startDate, 'HH:mm'))
      if (session.end_time) {
        setEndTime(format(new Date(session.end_time), 'HH:mm'))
      }
    }
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!session) return

    // バリデーション
    if (!date || !startTime || !endTime) {
      setError('すべての項目を入力してください')
      return
    }

    const start = new Date(`${date}T${startTime}`)
    const end = new Date(`${date}T${endTime}`)

    if (end <= start) {
      setError('終了時刻は開始時刻より後にしてください')
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        sessionId: session.session_id,
        date,
        subject,
        startTime,
        endTime,
      })
      onClose()
    } catch (err) {
      setError('保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  if (!session) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="セッションを編集">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-1">
            日付
          </label>
          <input
            id="edit-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="edit-subject" className="block text-sm font-medium text-gray-700 mb-1">
            教科
          </label>
          <select
            id="edit-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="edit-startTime" className="block text-sm font-medium text-gray-700 mb-1">
            開始時刻
          </label>
          <input
            id="edit-startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="edit-endTime" className="block text-sm font-medium text-gray-700 mb-1">
            終了時刻
          </label>
          <input
            id="edit-endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} fullWidth>
            キャンセル
          </Button>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
