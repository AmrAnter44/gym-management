'use client'

import { useEffect, useState } from 'react'
import { formatDateYMD } from '../../lib/dateFormatter'

interface Invitation {
  id: string
  guestName: string
  guestPhone: string
  notes?: string
  createdAt: string
  member: {
    memberNumber: number
    name: string
    phone: string
  }
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations')
      const data = await response.json()
      setInvitations(data)
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الدعوة؟')) return

    try {
      await fetch(`/api/invitations?id=${id}`, { method: 'DELETE' })
      fetchInvitations()
    } catch (error) {
      console.error('Error deleting invitation:', error)
    }
  }

  // فلترة النتائج
  const filteredInvitations = invitations.filter(inv => {
    const matchesSearch = 
      inv.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.guestPhone.includes(searchTerm) ||
      inv.member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.member.memberNumber.toString().includes(searchTerm)

    const matchesDate = dateFilter 
      ? new Date(inv.createdAt).toISOString().split('T')[0] === dateFilter
      : true

    return matchesSearch && matchesDate
  })

  // إحصائيات
  const stats = {
    total: invitations.length,
    today: invitations.filter(inv => 
      new Date(inv.createdAt).toDateString() === new Date().toDateString()
    ).length,
    thisWeek: invitations.filter(inv => {
      const invDate = new Date(inv.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return invDate >= weekAgo
    }).length,
    thisMonth: invitations.filter(inv => {
      const invDate = new Date(inv.createdAt)
      return invDate.getMonth() === new Date().getMonth() &&
             invDate.getFullYear() === new Date().getFullYear()
    }).length
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span>🎟️</span>
          <span>سجل الدعوات</span>
        </h1>
        <p className="text-gray-600 mt-2">جميع دعوات الأعضاء المستخدمة</p>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5 shadow-lg">
          <p className="text-sm opacity-90 mb-1">إجمالي الدعوات</p>
          <p className="text-4xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-5 shadow-lg">
          <p className="text-sm opacity-90 mb-1">اليوم</p>
          <p className="text-4xl font-bold">{stats.today}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 shadow-lg">
          <p className="text-sm opacity-90 mb-1">هذا الأسبوع</p>
          <p className="text-4xl font-bold">{stats.thisWeek}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-5 shadow-lg">
          <p className="text-sm opacity-90 mb-1">هذا الشهر</p>
          <p className="text-4xl font-bold">{stats.thisMonth}</p>
        </div>
      </div>

      {/* البحث والفلاتر */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">🔍 البحث</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم الضيف، رقم الهاتف، أو العضو..."
              className="w-full px-4 py-2 border-2 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">📅 تصفية بالتاريخ</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border-2 rounded-lg"
            />
          </div>
        </div>
        {(searchTerm || dateFilter) && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                setSearchTerm('')
                setDateFilter('')
              }}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg"
            >
              ✖️ مسح الفلاتر
            </button>
            <p className="text-sm text-gray-600 py-1">
              عرض {filteredInvitations.length} من {invitations.length} دعوة
            </p>
          </div>
        )}
      </div>

      {/* الجدول */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-xl">جاري التحميل...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">اسم الضيف</th>
                  <th className="px-4 py-3 text-right">هاتف الضيف</th>
                  <th className="px-4 py-3 text-right">العضو المستضيف</th>
                  <th className="px-4 py-3 text-right">رقم العضوية</th>
                  <th className="px-4 py-3 text-right">ملاحظات</th>
                  <th className="px-4 py-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvitations.map((invitation) => (
                  <tr key={invitation.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-mono text-sm">
                          {formatDateYMD(invitation.createdAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(invitation.createdAt).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-purple-700">
                        {invitation.guestName}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono">{invitation.guestPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{invitation.member.name}</p>
                      <p className="text-xs text-gray-500">{invitation.member.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold text-sm">
                        #{invitation.member.memberNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {invitation.notes ? (
                        <p className="text-sm text-gray-600 max-w-xs truncate" title={invitation.notes}>
                          {invitation.notes}
                        </p>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(invitation.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvitations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || dateFilter ? (
                <>
                  <div className="text-5xl mb-3">🔍</div>
                  <p>لا توجد نتائج تطابق البحث</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">🎟️</div>
                  <p>لا توجد دعوات مسجلة حتى الآن</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ملاحظة */}
      <div className="mt-6 bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>💡 ملاحظة:</strong> هذا السجل يحتوي على جميع الدعوات التي استخدمها الأعضاء لإحضار ضيوف إلى الجيم.
        </p>
      </div>
    </div>
  )
}