'use client'

import Link from 'next/link'
import { formatDate } from '@/lib/utils/dateUtils'
import { formatDuration } from '@/lib/utils/timeUtils'
import type { DailySummary } from '@/types'
import { ChevronRight } from 'lucide-react'

interface DailySummaryListProps {
  summaries: DailySummary[]
  baseUrl?: string // 管理者画面用のベースURL
}

export function DailySummaryList({ summaries, baseUrl = '/history' }: DailySummaryListProps) {
  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">まだ履歴がありません</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
      {summaries.map((summary) => (
        <Link
          key={summary.date}
          href={`${baseUrl}/${summary.date}`}
          className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <span className="min-w-[100px] font-medium text-gray-900">
              {formatDate(summary.date)}
            </span>
            <span className="min-w-[80px] font-bold text-[#003c68]">
              {formatDuration(summary.total_minutes)}
            </span>
            <span className="text-gray-600">{summary.session_count}セッション</span>
          </div>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </Link>
      ))}
    </div>
  )
}
