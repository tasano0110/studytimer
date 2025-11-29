'use client'

import { useState, useEffect } from 'react'
import { UserMessageSetting, DayType } from '@/types'
import { Button } from '@/components/ui/Button'
import { useTheme } from '@/lib/contexts/ThemeContext'
import toast from 'react-hot-toast'

export default function MessageSettings() {
  const { colors } = useTheme()
  const [dayType, setDayType] = useState<DayType>('weekday')
  const [settings, setSettings] = useState<UserMessageSetting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [dayType])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/message-settings?day_type=${dayType}`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || [])
      }
    } catch (error) {
      console.error('Failed to load message settings:', error)
      toast.error('設定の読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingChange = (index: number, field: 'threshold_minutes' | 'message', value: string | number) => {
    const newSettings = [...settings]
    newSettings[index] = {
      ...newSettings[index],
      [field]: field === 'threshold_minutes' ? Number(value) : value,
    }
    setSettings(newSettings)
  }

  const handleSave = async () => {
    // Validate
    for (let i = 0; i < settings.length; i++) {
      if (settings[i].message.length === 0 || settings[i].message.length > 50) {
        toast.error('メッセージは1文字以上50文字以内で入力してください')
        return
      }
      if (i > 0 && settings[i].threshold_minutes <= settings[i - 1].threshold_minutes) {
        toast.error('時間は昇順に設定してください')
        return
      }
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/message-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_type: dayType,
          settings: settings,
        }),
      })

      if (response.ok) {
        toast.success('設定を保存しました')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Failed to save message settings:', error)
      toast.error('設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600">読み込み中...</div>
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-700 mb-4">メッセージ設定</h2>
      <p className="text-sm text-slate-600 mb-6">
        合計時間に応じて表示されるメッセージを設定できます。
      </p>

      {/* Tab Selection */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setDayType('weekday')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            dayType === 'weekday'
              ? 'text-white'
              : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
          }`}
          style={dayType === 'weekday' ? { backgroundColor: colors.primary } : {}}
        >
          平日（月〜金）
        </button>
        <button
          onClick={() => setDayType('weekend')}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            dayType === 'weekend'
              ? 'text-white'
              : 'bg-gray-100 text-slate-700 hover:bg-gray-200'
          }`}
          style={dayType === 'weekend' ? { backgroundColor: colors.primary } : {}}
        >
          週末（土〜日）
        </button>
      </div>

      {/* Settings List */}
      <div className="space-y-4 mb-6">
        {settings.map((setting, index) => (
          <div key={setting.setting_id} className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm font-medium text-slate-700 mb-2">レベル {index + 1}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">時間（時間以上）</label>
                <select
                  value={Math.floor(setting.threshold_minutes / 60)}
                  onChange={(e) => handleSettingChange(index, 'threshold_minutes', Number(e.target.value) * 60)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c68]"
                >
                  {Array.from({ length: 25 }, (_, i) => i).map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}時間
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">
                  メッセージ（{setting.message.length}/50文字）
                </label>
                <input
                  type="text"
                  value={setting.message}
                  onChange={(e) => handleSettingChange(index, 'message', e.target.value)}
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c68]"
                  placeholder="メッセージを入力"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}
