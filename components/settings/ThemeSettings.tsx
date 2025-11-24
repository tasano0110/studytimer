'use client'

import { useState } from 'react'
import { ColorTheme } from '@/types'
import { useTheme, THEME_COLORS } from '@/lib/contexts/ThemeContext'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(theme)
  const [isSaving, setIsSaving] = useState(false)

  const themes: { id: ColorTheme; label: string; color: string }[] = [
    { id: 'blue', label: 'ブルー（デフォルト）', color: THEME_COLORS.blue.primary },
    { id: 'pink', label: 'ピンク', color: THEME_COLORS.pink.primary },
  ]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await setTheme(selectedTheme)
      toast.success('テーマを変更しました')
    } catch (error) {
      console.error('Failed to save theme:', error)
      toast.error('テーマの変更に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">デザイン設定</h2>
      <p className="text-sm text-gray-600 mb-6">
        アプリ全体のカラーテーマを変更できます。
      </p>

      <div className="space-y-4 mb-6">
        {themes.map((themeOption) => (
          <label
            key={themeOption.id}
            className={`block border-2 rounded-lg p-4 cursor-pointer transition-colors ${
              selectedTheme === themeOption.id
                ? 'border-[#003c68] bg-[#003c68]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <input
                type="radio"
                name="theme"
                value={themeOption.id}
                checked={selectedTheme === themeOption.id}
                onChange={(e) => setSelectedTheme(e.target.value as ColorTheme)}
                className="w-4 h-4 text-[#003c68] focus:ring-[#003c68]"
              />
              <div className="ml-4 flex-1">
                <div className="font-medium text-gray-900">{themeOption.label}</div>
                <div className="flex items-center mt-2">
                  <div
                    className="w-16 h-8 rounded"
                    style={{ backgroundColor: themeOption.color }}
                  />
                  <span className="ml-3 text-sm text-gray-600">{themeOption.color}</span>
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600">
          プレビュー：選択したテーマはボタンやアクティブな要素、合計時間カードなどに適用されます。
        </p>
      </div>

      <Button onClick={handleSave} disabled={isSaving || selectedTheme === theme}>
        {isSaving ? '保存中...' : '保存'}
      </Button>
    </div>
  )
}
