'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, ClipboardList, Settings } from 'lucide-react'
import type { Role } from '@/types'

interface FooterNavProps {
  userRole: Role
}

export function FooterNav({ userRole }: FooterNavProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive('/')
                ? 'text-[#003c68]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-6 h-6" />
            <span className="text-xs mt-1">記録</span>
          </Link>

          <Link
            href="/history"
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              isActive('/history')
                ? 'text-[#003c68]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-6 h-6" />
            <span className="text-xs mt-1">履歴</span>
          </Link>

          {userRole === 'admin' && (
            <Link
              href="/admin"
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive('/admin')
                  ? 'text-[#003c68]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-6 h-6" />
              <span className="text-xs mt-1">管理</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
