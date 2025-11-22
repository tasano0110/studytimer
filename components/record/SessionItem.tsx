'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { formatTime } from '@/lib/utils/dateUtils'
import { formatDuration } from '@/lib/utils/timeUtils'
import type { StudySession } from '@/types'
import { Button } from '@/components/ui/Button'

interface SessionItemProps {
  session: StudySession
  onEdit: (session: StudySession) => void
  onDelete: (sessionId: string) => void
}

const subjectColors: Record<string, string> = {
  算数: 'bg-[#003c68]/10 text-[#003c68]',
  国語: 'bg-[#0f766e]/10 text-[#0f766e]',
  理科: 'bg-[#4c1d95]/10 text-[#4c1d95]',
  社会: 'bg-[#b45309]/10 text-[#b45309]',
  指定なし: 'bg-gray-100 text-gray-800',
}

export function SessionItem({ session, onEdit, onDelete }: SessionItemProps) {
  const isRunning = !session.end_time

  const handleDelete = () => {
    if (confirm('このセッションを削除しますか？')) {
      onDelete(session.session_id)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
      <div className="flex items-center gap-3 text-sm">
        {/* 教科バッジ */}
        <span
          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap min-w-[72px] ${
            subjectColors[session.subject]
          }`}
        >
          {session.subject}
        </span>

        {/* 時間情報（横並び） */}
        <div className="flex-1 grid grid-cols-3 gap-2 text-xs sm:text-sm text-gray-600">
          <div>
            <div className="text-[11px] text-gray-500">開始</div>
            <div className="font-medium text-gray-900">{formatTime(session.start_time)}</div>
          </div>

          <div>
            <div className="text-[11px] text-gray-500">終了</div>
            <div className="font-medium text-gray-900">
              {isRunning ? '—' : formatTime(session.end_time!)}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-gray-500">時間</div>
            <div className="font-bold text-gray-900">
              {isRunning ? (
                <span className="text-[#003c68]">計測中...</span>
              ) : (
                formatDuration(session.duration_minutes!)
              )}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        {!isRunning && (
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => onEdit(session)}
              className="p-2 text-[#003c68] hover:bg-[#003c68]/10 rounded-lg transition-colors"
              aria-label="編集"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
