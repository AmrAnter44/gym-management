'use client'

import { useEffect, useState } from 'react'
import MemberForm from '../../components/MemberForm'
import RenewalForm from '../../components/RenewalForm'
import { formatDateYMD, calculateRemainingDays } from '../../lib/dateFormatter'

interface Member {
  id: string
  memberNumber: number
  name: string
  phone: string
  inBodyScans: number
  invitations: number
  subscriptionPrice: number
  remainingAmount: number
  notes?: string
  isActive: boolean
  startDate?: string
  expiryDate?: string
  createdAt: string
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showRenewalForm, setShowRenewalForm] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setMembers(data)
      } else {
        console.error('Invalid data format:', data)
        setMembers([])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return

    try {
      await fetch(`/api/members?id=${id}`, { method: 'DELETE' })
      fetchMembers()
    } catch (error) {
      console.error('Error deleting member:', error)
    }
  }

  const handleRenewal = (member: Member) => {
    setSelectedMember(member)
    setShowRenewalForm(true)
  }

  const closeRenewalForm = () => {
    setShowRenewalForm(false)
    setSelectedMember(null)
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة الأعضاء</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'إخفاء النموذج' : 'إضافة عضو جديد'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">إضافة عضو جديد</h2>
          <MemberForm onSuccess={() => {
            fetchMembers()
            setShowForm(false)
          }} />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right">رقم العضوية</th>
                  <th className="px-4 py-3 text-right">الاسم</th>
                  <th className="px-4 py-3 text-right">الهاتف</th>
                  <th className="px-4 py-3 text-right">InBody</th>
                  <th className="px-4 py-3 text-right">دعوات</th>
                  <th className="px-4 py-3 text-right">السعر</th>
                  <th className="px-4 py-3 text-right">المتبقي</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">تاريخ البداية</th>
                  <th className="px-4 py-3 text-right">تاريخ الانتهاء</th>
                  <th className="px-4 py-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(members) && members.map((member) => {
                  const isExpired = member.expiryDate ? new Date(member.expiryDate) < new Date() : false
                  const daysRemaining = calculateRemainingDays(member.expiryDate)
                  const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7
                  
                  return (
                    <tr key={member.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-blue-600">#{member.memberNumber}</td>
                      <td className="px-4 py-3">{member.name}</td>
                      <td className="px-4 py-3">{member.phone}</td>
                      <td className="px-4 py-3">{member.inBodyScans}</td>
                      <td className="px-4 py-3">{member.invitations}</td>
                      <td className="px-4 py-3">{member.subscriptionPrice} ج.م</td>
                      <td className="px-4 py-3 text-red-600">{member.remainingAmount} ج.م</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          member.isActive && !isExpired ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {member.isActive && !isExpired ? 'نشط' : 'منتهي'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700 font-mono">
                          {formatDateYMD(member.startDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {member.expiryDate ? (
                          <div>
                            <span className={`font-mono ${isExpired ? 'text-red-600 font-bold' : isExpiringSoon ? 'text-orange-600 font-bold' : ''}`}>
                              {formatDateYMD(member.expiryDate)}
                            </span>
                            {daysRemaining !== null && daysRemaining > 0 && (
                              <p className={`text-xs ${isExpiringSoon ? 'text-orange-600' : 'text-gray-500'}`}>
                                {isExpiringSoon && '⚠️ '} باقي {daysRemaining} يوم
                              </p>
                            )}
                            {isExpired && daysRemaining !== null && (
                              <p className="text-xs text-red-600">
                                ❌ منتهي منذ {Math.abs(daysRemaining)} يوم
                              </p>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRenewal(member)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
                            title="تجديد الاشتراك"
                          >
                            🔄 تجديد
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="text-red-600 hover:text-red-800"
                            title="حذف العضو"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {members.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              لا يوجد أعضاء حالياً
            </div>
          )}
        </div>
      )}

      {/* نموذج التجديد */}
      {showRenewalForm && selectedMember && (
        <RenewalForm
          member={selectedMember}
          onSuccess={fetchMembers}
          onClose={closeRenewalForm}
        />
      )}
    </div>
  )
}