'use client'

import { useEffect } from 'react'
import { X, Award } from 'lucide-react'

interface StampCelebrationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StampCelebrationModal({ isOpen, onClose }: StampCelebrationModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8 text-center animate-bounce-in">
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="閉じる"
        >
          <X className="w-6 h-6" />
        </button>

        {/* スタンプアイコン */}
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-100 rounded-full p-4">
            <Award className="w-16 h-16 text-yellow-500" />
          </div>
        </div>

        {/* メッセージ */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          おめでとう！
        </h2>
        <p className="text-lg text-gray-700">
          スタンプをゲットしました！
        </p>
      </div>
    </div>
  )
}
