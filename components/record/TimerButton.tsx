'use client'

import { Play, Square } from 'lucide-react'

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
  return (
    <button
      onClick={isRunning ? onStop : onStart}
      disabled={disabled}
      className={`w-48 h-48 rounded-full flex flex-col items-center justify-center gap-2 font-bold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
        isRunning
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-[#003c68] hover:bg-[#00508d] text-white'
      }`}
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
