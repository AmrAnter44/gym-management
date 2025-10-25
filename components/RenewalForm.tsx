'use client'

import { useState } from 'react'
import { printReceiptFromData } from '../lib/printSystem'
import { calculateDaysBetween, formatDateYMD, formatDurationInMonths } from '../lib/dateFormatter'
import PaymentMethodSelector from './PaymentMethodSelector'

interface Member {
  id: string
  memberNumber: number
  name: string
  phone: string
  subscriptionPrice: number
  startDate?: string
  expiryDate?: string
}

interface RenewalFormProps {
  member: Member
  onSuccess: () => void
  onClose: () => void
}

export default function RenewalForm({ member, onSuccess, onClose }: RenewalFormProps) {
  // تحديد تاريخ البداية الافتراضي
  const getDefaultStartDate = () => {
    if (member.expiryDate) {
      const expiry = new Date(member.expiryDate)
      const today = new Date()
      
      return expiry < today 
        ? today.toISOString().split('T')[0]
        : expiry.toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    subscriptionPrice: member.subscriptionPrice,
    remainingAmount: 0,
    startDate: getDefaultStartDate(),
    expiryDate: '',
    notes: '',
    paymentMethod: 'cash', // الافتراضي كاش
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // حساب مدة الاشتراك بالأيام
  const calculateDuration = () => {
    if (!formData.startDate || !formData.expiryDate) return null
    return calculateDaysBetween(formData.startDate, formData.expiryDate)
  }

  // حساب تاريخ النهاية من عدد الأشهر
  const calculateExpiryFromMonths = (months: number) => {
    if (!formData.startDate) return
    
    const start = new Date(formData.startDate)
    const expiry = new Date(start)
    expiry.setMonth(expiry.getMonth() + months)
    
    setFormData(prev => ({ 
      ...prev, 
      expiryDate: expiry.toISOString().split('T')[0] 
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // التحقق من التواريخ
    if (formData.startDate && formData.expiryDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.expiryDate)
      
      if (end <= start) {
        setMessage('❌ تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية')
        setLoading(false)
        return
      }
    }

    try {
      const response = await fetch('/api/members/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          ...formData
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // طباعة الإيصال تلقائياً
        if (result.receipt) {
          setTimeout(() => {
            printReceiptFromData(
              result.receipt.receiptNumber,
              'Member',
              result.receipt.amount,
              result.receipt.itemDetails,
              result.receipt.createdAt,
              formData.paymentMethod
            )
          }, 500)
        }

        setMessage('✅ تم تجديد الاشتراك بنجاح!')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        setMessage(`❌ ${result.error || 'فشل التجديد'}`)
      }
    } catch (error) {
      console.error(error)
      setMessage('❌ حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const paidAmount = formData.subscriptionPrice - formData.remainingAmount
  const duration = calculateDuration()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">🔄 تجديد الاشتراك</h2>
              <p className="text-blue-100">تجديد اشتراك العضو</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* معلومات العضو */}
          <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">رقم العضوية</p>
                <p className="text-2xl font-bold text-blue-600">#{member.memberNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الاسم</p>
                <p className="text-lg font-bold">{member.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">رقم الهاتف</p>
                <p className="text-lg">{member.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">تاريخ الانتهاء الحالي</p>
                <p className="text-lg font-mono">
                  {formatDateYMD(member.expiryDate)}
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* قسم طريقة الدفع */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-5">
              <PaymentMethodSelector
                value={formData.paymentMethod}
                onChange={(method) => setFormData({ ...formData, paymentMethod: method })}
                required
              />
            </div>

            {/* قسم التواريخ */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span>📅</span>
                <span>فترة الاشتراك الجديدة</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    تاريخ البداية <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    تاريخ الانتهاء <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* أزرار سريعة */}
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">⚡ إضافة سريعة:</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 6, 9, 12].map(months => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => calculateExpiryFromMonths(months)}
                      className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm transition font-medium"
                    >
                      + {months} {months === 1 ? 'شهر' : 'أشهر'}
                    </button>
                  ))}
                </div>
              </div>

              {/* عرض المدة */}
              {duration !== null && (
                <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                  {duration > 0 ? (
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">⏱️</span>
                      <div>
                        <p className="font-bold text-blue-800 mb-1">مدة الاشتراك الجديدة:</p>
                        <p className="text-xl font-mono">
                          {formatDurationInMonths(duration)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600 flex items-center gap-2">
                      <span>❌</span>
                      <span>تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* السعر والمتبقي */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  سعر الاشتراك <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.subscriptionPrice}
                  onChange={(e) => setFormData({ ...formData, subscriptionPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 rounded-lg text-lg"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  المبلغ المتبقي
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.remainingAmount}
                  onChange={(e) => setFormData({ ...formData, remainingAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 rounded-lg text-lg"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* ملاحظات */}
            <div>
              <label className="block text-sm font-medium mb-2">ملاحظات التجديد</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border-2 rounded-lg"
                rows={3}
                placeholder="أي ملاحظات عن التجديد..."
              />
            </div>

            {/* ملخص المبالغ */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span>💰</span>
                <span>ملخص الدفع</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">سعر الاشتراك:</span>
                  <span className="font-bold">{formData.subscriptionPrice} ج.م</span>
                </div>
                
                {formData.remainingAmount > 0 && (
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-600">المتبقي:</span>
                    <span className="font-bold text-red-600">- {formData.remainingAmount} ج.م</span>
                  </div>
                )}
                
                <div className="border-t-2 border-gray-300 pt-3">
                  <div className="flex justify-between text-xl">
                    <span className="font-bold text-gray-800">المبلغ المدفوع:</span>
                    <span className="font-bold text-green-600">{paidAmount} ج.م</span>
                  </div>
                </div>

                <div className="bg-blue-100 border-r-4 border-blue-500 p-3 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>📝 ملاحظة:</strong> سيتم إنشاء إيصال جديد برقم إيصال جديد
                  </p>
                </div>
              </div>
            </div>

            {/* الأزرار */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || (duration !== null && duration <= 0)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-bold text-lg"
              >
                {loading ? 'جاري التجديد...' : '✅ تجديد الاشتراك'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
