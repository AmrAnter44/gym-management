'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const [stats, setStats] = useState({
    members: 0,
    activePT: 0,
    todayRevenue: 0,
    totalReceipts: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // جلب الأعضاء
        const membersRes = await fetch('/api/members')
        const members = await membersRes.json()
        
        // جلب جلسات PT
        const ptRes = await fetch('/api/pt')
        const ptSessions = await ptRes.json()
        
        // جلب الإيصالات
        const receiptsRes = await fetch('/api/receipts?limit=100')
        const receipts = await receiptsRes.json()
        
        // حساب إيرادات اليوم
        const today = new Date().toDateString()
        const todayReceipts = receipts.filter((r: any) => {
          return new Date(r.createdAt).toDateString() === today
        })
        const todayRevenue = todayReceipts.reduce((sum: number, r: any) => sum + r.amount, 0)
        
        // حساب PT النشطة
        const activePT = ptSessions.filter((pt: any) => pt.sessionsRemaining > 0).length
        
        setStats({
          members: Array.isArray(members) ? members.length : 0,
          activePT,
          todayRevenue,
          totalReceipts: receipts.length,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }
    
    fetchStats()
  }, [])

  const modules = [
    {
      title: 'الأعضاء',
      icon: '👥',
      description: 'إدارة اشتراكات الأعضاء والإيصالات',
      href: '/members',
      color: 'bg-blue-500',
    },
    {
      title: 'التدريب الشخصي',
      icon: '💪',
      description: 'متابعة جلسات المدربين الشخصيين',
      href: '/pt',
      color: 'bg-green-500',
    },
    {
      title: 'يوم استخدام / InBody',
      icon: '📊',
      description: 'إدارة الزيارات اليومية وفحوصات InBody',
      href: '/dayuse',
      color: 'bg-purple-500',
    },
    {
      title: 'الزوار',
      icon: '🚶',
      description: 'تسجيل معلومات الزوار المحتملين',
      href: '/visitors',
      color: 'bg-orange-500',
    },
    {
      title: 'الإيصالات',
      icon: '🧾',
      description: 'متابعة جميع الإيصالات الصادرة',
      href: '/receipts',
      color: 'bg-indigo-500',
    },
    {
      title: 'البحث السريع',
      icon: '🔍',
      description: 'بحث فوري عن الأعضاء والاشتراكات',
      href: '/search',
      color: 'bg-red-500',
    },
    {
      title: 'سجل الدعوات',
      icon: '🎟️',
      description: 'متابعة جميع دعوات الأعضاء المستخدمة',
      href: '/invitations',
      color: 'bg-pink-500',
    },
  ]

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">مرحباً بك في نظام إدارة الصالة</h1>
        <p className="text-gray-600">نظام شامل وسريع لإدارة جميع عمليات الصالة الرياضية</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي الأعضاء</p>
              <p className="text-3xl font-bold">{stats.members}</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">جلسات PT النشطة</p>
              <p className="text-3xl font-bold">{stats.activePT}</p>
            </div>
            <div className="text-4xl">💪</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إيرادات اليوم</p>
              <p className="text-3xl font-bold">{stats.todayRevenue.toFixed(0)} ج.م</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي الإيصالات</p>
              <p className="text-3xl font-bold">{stats.totalReceipts}</p>
            </div>
            <div className="text-4xl">🧾</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition transform hover:scale-105"
          >
            <div className={`${module.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4`}>
              {module.icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{module.title}</h3>
            <p className="text-gray-600">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}