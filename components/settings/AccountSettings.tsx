'use client'

import { useState, useEffect } from 'react'
import { User } from '@/types'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function AccountSettings() {
  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    setIsLoadingUser(true)
    try {
      const response = await fetch('/api/user')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setName(data.user.name || '')
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      toast.error('ユーザー情報の読み込みに失敗しました')
    } finally {
      setIsLoadingUser(false)
    }
  }

  const handleUpdateName = async () => {
    if (name.length === 0 || name.length > 100) {
      toast.error('名前は1文字以上100文字以内で入力してください')
      return
    }

    setIsUpdatingName(true)
    try {
      const response = await fetch('/api/user/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (response.ok) {
        toast.success('名前を変更しました')
        loadUser()
      } else {
        throw new Error('Failed to update name')
      }
    } catch (error) {
      console.error('Failed to update name:', error)
      toast.error('名前の変更に失敗しました')
    } finally {
      setIsUpdatingName(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (currentPassword.length === 0) {
      toast.error('現在のパスワードを入力してください')
      return
    }

    if (newPassword.length < 8) {
      toast.error('新しいパスワードは8文字以上で入力してください')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('新しいパスワードが一致しません')
      return
    }

    setIsUpdatingPassword(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      })

      if (response.ok) {
        toast.success('パスワードを変更しました')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update password')
      }
    } catch (error: any) {
      console.error('Failed to update password:', error)
      if (error.message.includes('Invalid password')) {
        toast.error('現在のパスワードが正しくありません')
      } else {
        toast.error('パスワードの変更に失敗しました')
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (isLoadingUser) {
    return <div className="text-center py-8 text-gray-600">読み込み中...</div>
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-700 mb-4">アカウント設定</h2>
      <p className="text-sm text-slate-600 mb-6">
        アカウント情報を変更できます。
      </p>

      {/* Name Settings */}
      <div className="border-b border-gray-200 pb-8 mb-8">
        <h3 className="text-base font-bold text-slate-700 mb-4">名前の変更</h3>
        <div className="mb-2">
          <p className="text-sm text-slate-600">現在の名前</p>
          <p className="font-medium text-slate-700">{user?.name || '未設定'}</p>
        </div>
        <div className="mb-4 mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            新しい名前（{name.length}/100文字）
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c68]"
            placeholder="名前を入力"
          />
        </div>
        <Button onClick={handleUpdateName} disabled={isUpdatingName}>
          {isUpdatingName ? '変更中...' : '名前を変更'}
        </Button>
      </div>

      {/* Password Settings */}
      <div>
        <h3 className="text-base font-bold text-slate-700 mb-4">パスワードの変更</h3>
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              現在のパスワード
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c68]"
              placeholder="現在のパスワード"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              新しいパスワード（8文字以上）
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c68]"
              placeholder="新しいパスワード"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              新しいパスワード（確認）
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003c68]"
              placeholder="新しいパスワード（確認）"
            />
          </div>
        </div>
        <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword}>
          {isUpdatingPassword ? '変更中...' : 'パスワードを変更'}
        </Button>
      </div>
    </div>
  )
}
