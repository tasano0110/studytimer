'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import type { User } from '@/types'

interface HeaderProps {
  user: User | null
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('ログアウトしました')
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast.error('ログアウトに失敗しました')
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <h1
            className="text-xl font-bold tracking-wide text-slate-700"
          >
            STUDY TIMER
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user?.name || user?.email}
            </span>
            <Button variant="secondary" onClick={handleLogout}>
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
