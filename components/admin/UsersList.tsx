'use client'

import Link from 'next/link'
import type { User } from '@/types'
import { ChevronRight } from 'lucide-react'

interface UsersListProps {
  users: User[]
}

const roleLabels = {
  user: 'ユーザー',
  admin: '管理者',
}

export function UsersList({ users }: UsersListProps) {
  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">ユーザーが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
      {users.map((user) => (
        <Link
          key={user.user_id}
          href={`/admin/users/${user.user_id}`}
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1">
              {user.name || user.email}
            </h3>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>{user.email}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {roleLabels[user.role]}
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      ))}
    </div>
  )
}
