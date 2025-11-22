import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersList } from '@/components/admin/UsersList'
import type { User } from '@/types'

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // 現在のユーザーの権限をチェック
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', authUser.id)
    .single()

  if (!currentUser || currentUser.role !== 'admin') {
    redirect('/')
  }

  // 全ユーザーを取得
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
        <p className="text-sm text-gray-600 mt-1">
          全ユーザーの学習履歴を閲覧できます
        </p>
      </div>

      <UsersList users={(users as User[]) || []} />
    </div>
  )
}
