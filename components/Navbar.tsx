'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'الرئيسية' },
    { href: '/members', label: 'الأعضاء' },
    { href: '/pt', label: 'التدريب الشخصي' },
    { href: '/dayuse', label: 'يوم استخدام / InBody' },
    { href: '/visitors', label: 'الزوار' },
    { href: '/search', label: 'بحث' },
  ]

  return (
    <nav className="bg-gray-900 text-white shadow-lg" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-reverse space-x-8">
            <h1 className="text-xl font-bold">🏋️ نظام إدارة الصالة</h1>
            <div className="flex space-x-reverse space-x-4">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    pathname === link.href
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}