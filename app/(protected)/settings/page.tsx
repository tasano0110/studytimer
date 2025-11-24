import { Metadata } from 'next'
import SettingsContent from '@/components/settings/SettingsContent'

export const metadata: Metadata = {
  title: '設定 | STUDY TIMER',
  description: 'アプリの設定',
}

export default function SettingsPage() {
  return <SettingsContent />
}
