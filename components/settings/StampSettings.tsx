'use client'

import { useState, useEffect } from 'react'
import { UserStampSetting, DayType } from '@/types'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function StampSettings() {
  const [settings, setSettings] = useState<{
    weekday: UserStampSetting | null
    weekend: UserStampSetting | null
  }>({
    weekday: null,
    weekend: null,
  })
  const [stampCount, setStampCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    loadSettings()
    loadStampCount()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stamp-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({
          weekday: data.settings.find((s: UserStampSetting) => s.day_type === 'weekday') || null,
          weekend: data.settings.find((s: UserStampSetting) => s.day_type === 'weekend') || null,
        })
      }
    } catch (error) {
      console.error('Failed to load stamp settings:', error)
      toast.error('設定の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStampCount = async () => {
    try {
      const response = await fetch('/api/stamps/count')
      if (response.ok) {
        const data = await response.json()
        setStampCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to load stamp count:', error)
    }
  }

  const handleSettingChange = (dayType: DayType, hours: number) => {
    setSettings((prev) => ({
      ...prev,
      [dayType]: prev[dayType]
        ? { ...prev[dayType]!, required_minutes: hours * 60 }
        : null,
    }))
  }

  const handleSave = async () => {
    if (!settings.weekday || !settings.weekend) {
      toast.error('設定が不正です')
      return
    }

    if (settings.weekday.required_minutes < 60 || settings.weekend.required_minutes < 60) {
      toast.error('時間は1時間以上で設定してください')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/stamp-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekday_minutes: settings.weekday.required_minutes,
          weekend_minutes: settings.weekend.required_minutes,
        }),
      })

      if (response.ok) {
        toast.success('設定を保存しました')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Failed to save stamp settings:', error)
      toast.error('設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      const response = await fetch('/api/stamps', {
        method: 'DELETE',
      })

      if (response.ok) {
        setStampCount(0)
        setShowResetConfirm(false)
        toast.success('スタンプをリセットしました')
      } else {
        throw new Error('Failed to reset')
      }
    } catch (error) {
      console.error('Failed to reset stamps:', error)
      toast.error('リセットに失敗しました')
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600">読み込み中...</div>
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-700 mb-4">スタンプ設定</h2>
      <p className="text-sm text-slate-600 mb-6">
        1日の合計時間が目標時間を超えると、スタンプを獲得できます。
      </p>

      {/* Stamp Settings */}
      <div className="space-y-4 mb-8">
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            平日のスタンプ獲得時間
          </label>
          <select
            value={settings.weekday ? Math.floor(settings.weekday.required_minutes / 60) : 3}
            onChange={(e) => handleSettingChange('weekday', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c68]"
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
              <option key={hour} value={hour}>
                {hour}時間以上
              </option>
            ))}
          </select>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            週末のスタンプ獲得時間
          </label>
          <select
            value={settings.weekend ? Math.floor(settings.weekend.required_minutes / 60) : 5}
            onChange={(e) => handleSettingChange('weekend', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c68]"
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map((hour) => (
              <option key={hour} value={hour}>
                {hour}時間以上
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mb-8">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>

      {/* Reset Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-base font-bold text-slate-700 mb-4">スタンプリセット</h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-slate-600 mb-2">現在の累積スタンプ数</p>
          <p className="text-3xl font-bold text-slate-700">{stampCount}個</p>
        </div>

        {!showResetConfirm ? (
          <div>
            <p className="text-sm text-slate-600 mb-4">
              ※リセットすると累積スタンプ数が0個になります。この操作は取り消せません。
            </p>
            <Button
              variant="danger"
              onClick={() => setShowResetConfirm(true)}
            >
              リセット
            </Button>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium mb-4">
              本当にスタンプをリセットしますか？
            </p>
            <p className="text-sm text-red-600 mb-4">
              累積スタンプ数が0個になります。この操作は取り消せません。
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
              >
                キャンセル
              </Button>
              <Button
                variant="danger"
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? 'リセット中...' : 'リセットする'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
