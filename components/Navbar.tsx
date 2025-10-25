'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'الرئيسية', icon: '🏠' },
    { href: '/members', label: 'الأعضاء', icon: '👥' },
    { href: '/pt', label: 'PT', icon: '💪' },
    { href: '/dayuse', label: 'يوم استخدام', icon: '📊' },
    { href: '/visitors', label: 'الزوار', icon: '🚶' },
    { href: '/receipts', label: 'الإيصالات', icon: '🧾' },
    { href: '/search', label: 'بحث', icon: '🔍' },
    { href: '/staff', label: 'الموظفين', icon: '👨‍💼' },
{ href: '/expenses', label: 'المصاريف', icon: '💸' },
{ href: '/closing', label: 'التقفيل', icon: '💰' },
    { href: '/settings', label: 'إعدادات', icon: '⚙️' },
  ]

  return (
    <nav className="bg-gray-900 text-white shadow-lg" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-reverse space-x-8">
            <h1 className="text-xl font-bold">🏋️ نظام إدارة الصالة</h1>
            <div className="flex space-x-reverse space-x-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1 ${
                    pathname === link.href
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}