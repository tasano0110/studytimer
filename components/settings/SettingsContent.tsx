'use client'

import { useState } from 'react'
import MessageSettings from './MessageSettings'
import StampSettings from './StampSettings'
import SubjectSettings from './SubjectSettings'
import AccountSettings from './AccountSettings'
import ThemeSettings from './ThemeSettings'

type SettingsSection = 'message' | 'stamp' | 'subject' | 'account' | 'theme'

export default function SettingsContent() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('message')

  const sections = [
    { id: 'message' as const, label: 'メッセージ設定', component: MessageSettings },
    { id: 'stamp' as const, label: 'スタンプ設定', component: StampSettings },
    { id: 'subject' as const, label: '教科設定', component: SubjectSettings },
    { id: 'account' as const, label: 'アカウント設定', component: AccountSettings },
    { id: 'theme' as const, label: 'デザイン設定', component: ThemeSettings },
  ]

  const ActiveComponent = sections.find((s) => s.id === activeSection)?.component || MessageSettings

  return (
    <div className="min-h-screen bg-[#003c68]/5 pb-20">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">設定</h1>

        {/* Section Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-x-auto">
          <div className="flex border-b border-gray-200">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'border-b-2 border-[#003c68] text-[#003c68]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Section Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  )
}
