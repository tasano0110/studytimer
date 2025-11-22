'use client'

import { SessionItem } from './SessionItem'
import type { StudySession } from '@/types'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TodaySessionsListProps {
  sessions: StudySession[]
  onEdit: (session: StudySession) => void
  onDelete: (sessionId: string) => void
  onAddManual: () => void
}

export function TodaySessionsList({
  sessions,
  onEdit,
  onDelete,
  onAddManual,
}: TodaySessionsListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#003c68]">本日の記録</h2>
        <Button
          variant="secondary"
          onClick={onAddManual}
          className="flex items-center gap-1 text-sm"
        >
          <Plus className="w-4 h-4" />
          手動追加
        </Button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          まだ記録がありません
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionItem
              key={session.session_id}
              session={session}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
