'use client'

import { Play, Square } from 'lucide-react'
import { useTheme } from '@/lib/contexts/ThemeContext'

interface TimerButtonProps {
  isRunning: boolean
  onStart: () => void
  onStop: () => void
  disabled?: boolean
}

export function TimerButton({
  isRunning,
  onStart,
  onStop,
  disabled = false,
}: TimerButtonProps) {
  const { colors } = useTheme()

  return (
    <button
      onClick={isRunning ? onStop : onStart}
      disabled={disabled}
      className={`w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 font-bold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-white ${
        isRunning ? 'bg-red-600 hover:bg-red-700' : ''
      }`}
      style={!isRunning ? { backgroundColor: colors.primary } : {}}
    >
      {isRunning ? (
        <>
          <Square className="w-12 h-12" />
          <span>ストップ</span>
        </>
      ) : (
        <>
          <Play className="w-12 h-12" />
          <span>スタート</span>
        </>
      )}
    </button>
  )
}
