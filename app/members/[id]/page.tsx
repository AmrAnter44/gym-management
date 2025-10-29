'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ReceiptToPrint } from '../../../components/ReceiptToPrint'
import PaymentMethodSelector from '../../../components/Paymentmethodselector '
import RenewalForm from '../../../components/RenewalForm'
import { formatDateYMD, calculateRemainingDays } from '../../../lib/dateFormatter'

interface Member {
  id: string
  memberNumber: number
  name: string
  phone: string
  inBodyScans: number
  invitations: number
  freePTSessions?: number
  subscriptionPrice: number
  remainingAmount: number
  notes?: string
  isActive: boolean
  startDate?: string
  expiryDate?: string
  createdAt: string
}

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string

  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [showRenewalForm, setShowRenewalForm] = useState(false)

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  // نماذج العمليات
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    notes: ''
  })

  const [freezeData, setFreezeData] = useState({
    days: 0,
    reason: ''
  })

  // 🆕 بيانات نموذج الدعوة
  const [invitationData, setInvitationData] = useState({
    guestName: '',
    guestPhone: '',
    notes: ''
  })

  const [activeModal, setActiveModal] = useState<string | null>(null)

  // جلب بيانات العضو
  const fetchMember = async () => {
    try {
      const response = await fetch('/api/members')
      const members = await response.json()
      const foundMember = members.find((m: Member) => m.id === memberId)
      
      if (foundMember) {
        const memberWithDefaults = {
          ...foundMember,
          freePTSessions: foundMember.freePTSessions ?? 0,
          inBodyScans: foundMember.inBodyScans ?? 0,
          invitations: foundMember.invitations ?? 0
        }
        
        console.log('Member data:', memberWithDefaults)
        setMember(memberWithDefaults)
      } else {
        setMessage('❌ لم يتم العثور على العضو')
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ حدث خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMember()
  }, [memberId])

  // دفع المبلغ المتبقي
  const handlePayment = async () => {
    if (!member || paymentData.amount <= 0) {
      setMessage('⚠️ يرجى إدخال مبلغ صحيح')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (paymentData.amount > member.remainingAmount) {
      setMessage('⚠️ المبلغ أكبر من المبلغ المتبقي')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const newRemaining = member.remainingAmount - paymentData.amount

      const response = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          remainingAmount: newRemaining
        })
      })

      if (response.ok) {
        const receiptResponse = await fetch('/api/receipts/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: member.id,
            amount: paymentData.amount,
            paymentMethod: paymentData.paymentMethod,
            notes: paymentData.notes
          })
        })

        if (receiptResponse.ok) {
          const receipt = await receiptResponse.json()
          setReceiptData({
            receiptNumber: receipt.receiptNumber,
            type: 'Payment',
            amount: receipt.amount,
            details: JSON.parse(receipt.itemDetails),
            date: new Date(receipt.createdAt),
            paymentMethod: paymentData.paymentMethod
          })
          setShowReceipt(true)
        }

        setMessage('✅ تم دفع المبلغ بنجاح!')
        setTimeout(() => setMessage(''), 3000)
        
        setPaymentData({ amount: 0, paymentMethod: 'cash', notes: '' })
        setActiveModal(null)
        fetchMember()
      } else {
        setMessage('❌ فشل تسجيل الدفع')
      }
    } catch (error) {
      console.error(error)
      setMessage('❌ حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  // تنقيص حصة InBody
  const handleUseInBody = async () => {
    if (!member || (member.inBodyScans ?? 0) <= 0) {
      setMessage('⚠️ لا توجد حصص InBody متبقية')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setConfirmModal({
      show: true,
      title: '⚖️ استخدام حصة InBody',
      message: 'هل تريد تنقيص حصة InBody؟',
      onConfirm: async () => {
        setConfirmModal(null)
        setLoading(true)
        try {
          const response = await fetch('/api/members', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: member.id,
              inBodyScans: (member.inBodyScans ?? 0) - 1
            })
          })

          if (response.ok) {
            setMessage('✅ تم تنقيص حصة InBody')
            setTimeout(() => setMessage(''), 3000)
            fetchMember()
          }
        } catch (error) {
          setMessage('❌ حدث خطأ')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // 🆕 تنقيص حصة دعوة - فتح نموذج إدخال تفاصيل الضيف
  const handleUseInvitation = async () => {
    if (!member || (member.invitations ?? 0) <= 0) {
      setMessage('⚠️ لا توجد دعوات متبقية')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    // فتح نموذج إدخال تفاصيل الضيف
    setActiveModal('invitation')
  }

  // 🆕 إرسال بيانات الدعوة
  const handleSubmitInvitation = async () => {
    if (!member) return

    // التحقق من البيانات المطلوبة
    if (!invitationData.guestName.trim() || !invitationData.guestPhone.trim()) {
      setMessage('⚠️ يرجى إدخال اسم ورقم هاتف الضيف')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          guestName: invitationData.guestName.trim(),
          guestPhone: invitationData.guestPhone.trim(),
          notes: invitationData.notes.trim() || undefined
        })
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('✅ تم تسجيل الدعوة بنجاح!')
        setTimeout(() => setMessage(''), 3000)
        
        // إعادة تعيين النموذج
        setInvitationData({
          guestName: '',
          guestPhone: '',
          notes: ''
        })
        setActiveModal(null)
        
        // تحديث بيانات العضو
        fetchMember()
      } else {
        setMessage(`❌ ${result.error || 'فشل تسجيل الدعوة'}`)
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error(error)
      setMessage('❌ حدث خطأ في الاتصال')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  // تنقيص حصة PT مجانية
  const handleUseFreePT = async () => {
    if (!member || (member.freePTSessions ?? 0) <= 0) {
      setMessage('⚠️ لا توجد حصص PT مجانية متبقية')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setConfirmModal({
      show: true,
      title: '💪 استخدام حصة PT مجانية',
      message: 'هل تريد تنقيص حصة PT مجانية؟',
      onConfirm: async () => {
        setConfirmModal(null)
        setLoading(true)
        try {
          const response = await fetch('/api/members', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: member.id,
              freePTSessions: (member.freePTSessions ?? 0) - 1
            })
          })

          if (response.ok) {
            setMessage('✅ تم تنقيص حصة PT مجانية')
            setTimeout(() => setMessage(''), 3000)
            fetchMember()
          }
        } catch (error) {
          setMessage('❌ حدث خطأ')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  // تجميد الاشتراك (إضافة أيام)
  const handleFreeze = async () => {
    if (!member || !member.expiryDate || freezeData.days <= 0) {
      setMessage('⚠️ يرجى إدخال عدد أيام صحيح')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    setLoading(true)
    try {
      const currentExpiry = new Date(member.expiryDate)
      const newExpiry = new Date(currentExpiry)
      newExpiry.setDate(newExpiry.getDate() + freezeData.days)

      const response = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          expiryDate: newExpiry.toISOString()
        })
      })

      if (response.ok) {
        setMessage(`✅ تم إضافة ${freezeData.days} يوم للاشتراك`)
        setTimeout(() => setMessage(''), 3000)
        
        setFreezeData({ days: 0, reason: '' })
        setActiveModal(null)
        fetchMember()
      }
    } catch (error) {
      setMessage('❌ حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  // حذف العضو
  const handleDelete = async () => {
    if (!member) return

    setConfirmModal({
      show: true,
      title: '⚠️ تأكيد حذف العضو',
      message: `هل أنت متأكد من حذف العضو "${member.name}" (#${member.memberNumber})؟ لا يمكن التراجع عن هذا الإجراء!`,
      onConfirm: async () => {
        setConfirmModal(null)
        setLoading(true)
        try {
          const response = await fetch(`/api/members?id=${member.id}`, { 
            method: 'DELETE' 
          })

          if (response.ok) {
            setMessage('✅ تم حذف العضو بنجاح')
            setTimeout(() => {
              router.push('/members')
            }, 1500)
          } else {
            setMessage('❌ فشل حذف العضو')
          }
        } catch (error) {
          console.error(error)
          setMessage('❌ حدث خطأ في الحذف')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  if (loading && !member) {
    return (
      <div className="container mx-auto p-6 text-center" dir="rtl">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-xl">جاري التحميل...</p>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="container mx-auto p-6 text-center" dir="rtl">
        <div className="text-6xl mb-4">❌</div>
        <p className="text-xl mb-4">لم يتم العثور على العضو</p>
        <button
          onClick={() => router.push('/members')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          العودة للأعضاء
        </button>
      </div>
    )
  }

  const isExpired = member.expiryDate ? new Date(member.expiryDate) < new Date() : false
  const daysRemaining = calculateRemainingDays(member.expiryDate)

  return (
    <div className="container mx-auto p-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">👤 تفاصيل العضو</h1>
          <p className="text-gray-600">إدارة حساب العضو والعمليات المختلفة</p>
        </div>
        <button
          onClick={() => router.push('/members')}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
        >
          ← العودة
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : message.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* بطاقة معلومات العضو */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-2xl p-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm opacity-90 mb-2">رقم العضوية</p>
            <p className="text-5xl font-bold">#{member.memberNumber}</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-2">الاسم</p>
            <p className="text-3xl font-bold">{member.name}</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-2">رقم الهاتف</p>
            <p className="text-2xl font-mono">{member.phone}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white border-opacity-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">الحالة</p>
              <p className="text-lg font-bold">
                {member.isActive && !isExpired ? '✅ نشط' : '❌ منتهي'}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">تاريخ الانتهاء</p>
              <p className="text-lg font-mono">
                {formatDateYMD(member.expiryDate)}
              </p>
              {daysRemaining !== null && daysRemaining > 0 && (
                <p className="text-xs opacity-75 mt-1">باقي {daysRemaining} يوم</p>
              )}
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">سعر الاشتراك</p>
              <p className="text-2xl font-bold">{member.subscriptionPrice} ج.م</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-sm opacity-90">المبلغ المتبقي</p>
              <p className="text-2xl font-bold text-yellow-300">{member.remainingAmount} ج.م</p>
            </div>
          </div>
        </div>
      </div>

      {/* الحصص المتاحة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm">InBody</p>
              <p className="text-4xl font-bold text-green-600">{member.inBodyScans ?? 0}</p>
            </div>
            <div className="text-5xl">⚖️</div>
          </div>
          <button
            onClick={handleUseInBody}
            disabled={(member.inBodyScans ?? 0) <= 0 || loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            استخدام حصة
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm">الدعوات</p>
              <p className="text-4xl font-bold text-purple-600">{member.invitations ?? 0}</p>
            </div>
            <div className="text-5xl">🎟️</div>
          </div>
          <button
            onClick={handleUseInvitation}
            disabled={(member.invitations ?? 0) <= 0 || loading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            استخدام دعوة
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-r-4 border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm">حصص PT مجانية</p>
              <p className="text-4xl font-bold text-orange-600">{member.freePTSessions ?? 0}</p>
            </div>
            <div className="text-5xl">💪</div>
          </div>
          <button
            onClick={handleUseFreePT}
            disabled={(member.freePTSessions ?? 0) <= 0 || loading}
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            استخدام حصة
          </button>
        </div>
      </div>

      {/* العمليات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* دفع المبلغ المتبقي */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-3xl">💰</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">دفع المبلغ المتبقي</h3>
              <p className="text-sm text-gray-600">المتبقي: {member.remainingAmount} ج.م</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('payment')}
            disabled={member.remainingAmount <= 0 || loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold"
          >
            دفع مبلغ
          </button>
        </div>

        {/* تجميد الاشتراك */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="text-3xl">❄️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">تجميد الاشتراك (Freeze)</h3>
              <p className="text-sm text-gray-600">إضافة أيام للاشتراك</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('freeze')}
            disabled={!member.expiryDate || loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold"
          >
            تجميد الاشتراك
          </button>
        </div>
      </div>

      {/* قسم التجديد والحذف */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* تجديد الاشتراك */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-200 p-3 rounded-full">
              <span className="text-3xl">🔄</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-800">تجديد الاشتراك</h3>
              <p className="text-sm text-green-700">تجديد اشتراك العضو لفترة جديدة</p>
            </div>
          </div>
          <button
            onClick={() => setShowRenewalForm(true)}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg shadow-md hover:shadow-lg"
          >
            🔄 تجديد الاشتراك
          </button>
        </div>

        {/* حذف العضو */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-200 p-3 rounded-full">
              <span className="text-3xl">🗑️</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-red-800">حذف العضو</h3>
              <p className="text-sm text-red-700">حذف العضو نهائياً من النظام</p>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold text-lg shadow-md hover:shadow-lg"
          >
            🗑️ حذف العضو
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && confirmModal.show && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-3">{confirmModal.title}</h3>
              <p className="text-gray-600 text-lg">{confirmModal.message}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm()
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold"
              >
                ✅ نعم، تأكيد
              </button>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-bold"
              >
                ✖️ إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: دفع المبلغ */}
      {activeModal === 'payment' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null)
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">💰 دفع المبلغ المتبقي</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="bg-yellow-50 border-r-4 border-yellow-500 p-4 rounded-lg mb-6">
              <p className="font-bold text-yellow-800">
                المبلغ المتبقي: {member.remainingAmount} ج.م
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  المبلغ المدفوع <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={paymentData.amount || ''}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                  max={member.remainingAmount}
                  className="w-full px-4 py-3 border-2 rounded-lg text-xl focus:outline-none focus:border-blue-500"
                  placeholder="0"
                  autoFocus
                />
              </div>

              <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-5">
                <PaymentMethodSelector
                  value={paymentData.paymentMethod}
                  onChange={(method) => setPaymentData({ ...paymentData, paymentMethod: method })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ملاحظات</label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex justify-between text-lg">
                  <span>المتبقي بعد الدفع:</span>
                  <span className="font-bold text-green-600">
                    {(member.remainingAmount - paymentData.amount).toFixed(0)} ج.م
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={loading || paymentData.amount <= 0}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-bold"
                >
                  {loading ? 'جاري المعالجة...' : '✅ تأكيد الدفع'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: تجميد */}
      {activeModal === 'freeze' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null)
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">❄️ تجميد الاشتراك</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
              <p className="text-sm text-blue-800 mb-2">
                تاريخ الانتهاء الحالي: <strong>{formatDateYMD(member.expiryDate)}</strong>
              </p>
              {daysRemaining !== null && (
                <p className="text-sm text-blue-800">
                  الأيام المتبقية: <strong>{daysRemaining > 0 ? daysRemaining : 0} يوم</strong>
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  عدد الأيام المراد إضافتها <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={freezeData.days || ''}
                  onChange={(e) => setFreezeData({ ...freezeData, days: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="w-full px-4 py-3 border-2 rounded-lg text-xl focus:outline-none focus:border-blue-500"
                  placeholder="عدد الأيام"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">السبب</label>
                <textarea
                  value={freezeData.reason}
                  onChange={(e) => setFreezeData({ ...freezeData, reason: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500"
                  rows={3}
                  placeholder="سبب التجميد..."
                />
              </div>

              {freezeData.days > 0 && member.expiryDate && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <p className="text-sm text-green-800 mb-2">
                    التاريخ الجديد للانتهاء:
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {formatDateYMD(new Date(new Date(member.expiryDate).getTime() + freezeData.days * 24 * 60 * 60 * 1000))}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleFreeze}
                  disabled={loading || freezeData.days <= 0}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-bold"
                >
                  {loading ? 'جاري المعالجة...' : '✅ تأكيد التجميد'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Modal: إدخال تفاصيل الضيف (الدعوة) */}
      {activeModal === 'invitation' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null)
              setInvitationData({ guestName: '', guestPhone: '', notes: '' })
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <span>🎟️</span>
                <span>تسجيل دعوة ضيف</span>
              </h3>
              <button
                onClick={() => {
                  setActiveModal(null)
                  setInvitationData({ guestName: '', guestPhone: '', notes: '' })
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="bg-purple-50 border-r-4 border-purple-500 p-4 rounded-lg mb-6">
              <p className="font-bold text-purple-800">
                العضو: {member.name} (#{member.memberNumber})
              </p>
              <p className="text-sm text-purple-700 mt-1">
                الدعوات المتبقية: {member.invitations ?? 0}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  اسم الضيف <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={invitationData.guestName}
                  onChange={(e) => setInvitationData({ ...invitationData, guestName: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="أدخل اسم الضيف"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  رقم هاتف الضيف <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  value={invitationData.guestPhone}
                  onChange={(e) => setInvitationData({ ...invitationData, guestPhone: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-purple-500 font-mono"
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">ملاحظات</label>
                <textarea
                  value={invitationData.notes}
                  onChange={(e) => setInvitationData({ ...invitationData, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-purple-500"
                  rows={3}
                  placeholder="ملاحظات إضافية عن الضيف..."
                />
              </div>

              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="font-semibold">سيتم:</p>
                    <p className="text-sm">• تسجيل دعوة الضيف</p>
                    <p className="text-sm">• تنقيص دعوة واحدة من العضو</p>
                    <p className="text-sm">• حفظ البيانات في سجل الدعوات</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSubmitInvitation}
                  disabled={loading || !invitationData.guestName.trim() || !invitationData.guestPhone.trim()}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-bold"
                >
                  {loading ? 'جاري الحفظ...' : '✅ تسجيل الدعوة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null)
                    setInvitationData({ guestName: '', guestPhone: '', notes: '' })
                  }}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نموذج التجديد */}
      {showRenewalForm && (
        <RenewalForm
          member={member}
          onSuccess={() => {
            fetchMember()
            setShowRenewalForm(false)
          }}
          onClose={() => setShowRenewalForm(false)}
        />
      )}

      {/* الإيصال */}
      {showReceipt && receiptData && (
        <ReceiptToPrint
          receiptNumber={receiptData.receiptNumber}
          type={receiptData.type}
          amount={receiptData.amount}
          details={receiptData.details}
          date={receiptData.date}
          paymentMethod={receiptData.paymentMethod}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  )
}