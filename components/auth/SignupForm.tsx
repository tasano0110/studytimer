'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import Link from 'next/link'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // サーバーサイドAPIを使用してユーザー登録
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Signup error:', data)
        toast.error(data.error || '登録に失敗しました')
        if (data.details) {
          console.error('Error details:', data.details)
        }
        return
      }

      if (data.requiresEmailConfirmation) {
        toast.success(data.message)
      } else {
        toast.success('登録が完了しました。ログインしてください。')
      }

      router.push('/login')
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('登録に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
          名前
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
          placeholder="山田太郎"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
          placeholder="example@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
          パスワード
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
          placeholder="6文字以上"
        />
      </div>

      <Button type="submit" fullWidth disabled={loading}>
        {loading ? '登録中...' : '新規登録'}
      </Button>

      <p className="text-center text-sm text-slate-600">
        既にアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-slate-700 hover:text-slate-900 font-medium underline">
          ログイン
        </Link>
      </p>
    </form>
  )
}
