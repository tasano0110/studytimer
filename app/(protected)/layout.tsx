import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { FooterNav } from '@/components/layout/FooterNav'
import { ThemeProvider } from '@/lib/contexts/ThemeContext'
import type { User, UserPreference, ColorTheme } from '@/types'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // users テーブルからユーザー情報を取得
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', authUser.id)
    .single<User>()

  // ユーザーのテーマ設定を取得
  const { data: preference } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', authUser.id)
    .single<UserPreference>()

  const initialTheme: ColorTheme = preference?.color_theme || 'blue'

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <div className="min-h-screen bg-[#003c68]/5 flex flex-col">
        <Header user={user} />
        <main className="flex-1 pb-20">{children}</main>
        <FooterNav userRole={user?.role || 'user'} />
      </div>
    </ThemeProvider>
  )
}
