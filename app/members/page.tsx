// app/members/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MemberForm from '../../components/MemberForm'
import { formatDateYMD, calculateRemainingDays } from '../../lib/dateFormatter'

interface Member {
  id: string
  memberNumber: number
  name: string
  phone: string
  profileImage?: string | null // ✅ إضافة الصورة
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
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [searchId, setSearchId] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchPhone, setSearchPhone] = useState('')

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      const data = await response.json()
      
      if (Array.isArray(data)) {
        setMembers(data)
        setFilteredMembers(data)
      } else {
        console.error('Invalid data format:', data)
        setMembers([])
        setFilteredMembers([])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([])
      setFilteredMembers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  useEffect(() => {
    if (!searchId && !searchName && !searchPhone) {
      setFilteredMembers(members)
      return
    }

    const filtered = members.filter((member) => {
      const idMatch = searchId 
        ? member.memberNumber.toString().includes(searchId)
        : true
      
      const nameMatch = searchName
        ? member.name.toLowerCase().includes(searchName.toLowerCase())
        : true
      
      const phoneMatch = searchPhone
        ? member.phone.includes(searchPhone)
        : true
      
      return idMatch && nameMatch && phoneMatch
    })

    setFilteredMembers(filtered)
  }, [searchId, searchName, searchPhone, members])

  const handleViewDetails = (memberId: string) => {
    router.push(`/members/${memberId}`)
  }

  const clearSearch = () => {
    setSearchId('')
    setSearchName('')
    setSearchPhone('')
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

      {/* قسم البحث المباشر */}
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border-2 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span>🔍</span>
            <span>بحث مباشر</span>
          </h3>
          {(searchId || searchName || searchPhone) && (
            <button
              onClick={clearSearch}
              className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 text-sm font-medium"
            >
              ✖️ مسح البحث
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">رقم العضوية (ID)</label>
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              placeholder="ابحث برقم العضوية..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">الاسم</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              placeholder="ابحث بالاسم..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition"
              placeholder="ابحث برقم الهاتف..."
            />
          </div>
        </div>

        {(searchId || searchName || searchPhone) && (
          <div className="mt-4 text-center">
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium">
              📊 عرض {filteredMembers.length} من {members.length} عضو
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right">الصورة</th>
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
                {Array.isArray(filteredMembers) && filteredMembers.map((member) => {
                  const isExpired = member.expiryDate ? new Date(member.expiryDate) < new Date() : false
                  const daysRemaining = calculateRemainingDays(member.expiryDate)
                  const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7
                  
                  return (
                    <tr key={member.id} className="border-t hover:bg-gray-50">
                      {/* ✅ صورة العضو */}
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                          {member.profileImage ? (
                            <img 
                              src={member.profileImage} 
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      
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
                        <button
                          onClick={() => handleViewDetails(member.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition shadow-md hover:shadow-lg font-medium"
                          title="عرض التفاصيل الكاملة"
                        >
                          👁️ عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              {(searchId || searchName || searchPhone) ? (
                <>
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-xl">لا توجد نتائج مطابقة للبحث</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-xl">لا يوجد أعضاء حالياً</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}