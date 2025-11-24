'use client'

import { useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Award } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface StampEarnedPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function StampEarnedPopup({ isOpen, onClose }: StampEarnedPopupProps) {
  useEffect(() => {
    if (isOpen) {
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="text-center py-6">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <Award className="w-12 h-12 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">おめでとう！</h2>
        <p className="text-lg text-gray-700 mb-6">スタンプをゲットしました！</p>
        <Button onClick={onClose} className="mx-auto">
          閉じる
        </Button>
      </div>
    </Modal>
  )
}
