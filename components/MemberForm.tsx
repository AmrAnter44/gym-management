'use client'

import { useState, useEffect } from 'react'
import { printReceiptFromData } from '../lib/printSystem'
import { calculateDaysBetween, formatDurationInMonths } from '../lib/dateFormatter'
import PaymentMethodSelector from '../components/Paymentmethodselector '

interface MemberFormProps {
  onSuccess: () => void
}

export default function MemberForm({ onSuccess }: MemberFormProps) {
  const [nextMemberNumber, setNextMemberNumber] = useState<number>(1001)
  const [formData, setFormData] = useState({
    memberNumber: '',
    name: '',
    phone: '',
    inBodyScans: 0,
    invitations: 0,
    subscriptionPrice: 0,
    remainingAmount: 0,
    notes: '',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    paymentMethod: 'cash',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // جلب رقم العضوية التالي
  useEffect(() => {
    const fetchNextNumber = async () => {
      try {
        const response = await fetch('/api/members/next-number')
        const data = await response.json()
        setNextMemberNumber(data.nextNumber)
        setFormData(prev => ({ ...prev, memberNumber: data.nextNumber.toString() }))
      } catch (error) {
        console.error('Error fetching next number:', error)
      }
    }
    fetchNextNumber()
  }, [])

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
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        const member = result
        
        // جلب الإيصال وطباعته
        try {
          const receiptsResponse = await fetch(`/api/receipts?memberId=${member.id}`)
          const receipts = await receiptsResponse.json()
          
          if (receipts.length > 0) {
            const receipt = receipts[0]
            const details = JSON.parse(receipt.itemDetails)
            
            // طباعة مباشرة مع paymentMethod
            setTimeout(() => {
              printReceiptFromData(
                receipt.receiptNumber,
                receipt.type,
                receipt.amount,
                details,
                receipt.createdAt,
                formData.paymentMethod
              )
            }, 500)
          }
        } catch (err) {
          console.error('Error fetching receipt:', err)
        }

        // تصفير الفورم
        const nextNumber = nextMemberNumber + 1
        setNextMemberNumber(nextNumber)
        setFormData({
          memberNumber: nextNumber.toString(),
          name: '',
          phone: '',
          inBodyScans: 0,
          invitations: 0,
          subscriptionPrice: 0,
          remainingAmount: 0,
          notes: '',
          startDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
          paymentMethod: 'cash',
        })
        
        setMessage('✅ تم إضافة العضو بنجاح!')
        setTimeout(() => setMessage(''), 3000)
        onSuccess()
      } else {
        setMessage(`❌ ${result.error || 'فشل إضافة العضو'}`)
      }
    } catch (error) {
      console.error(error)
      setMessage('❌ حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  const duration = calculateDuration()

  return (
    <div>
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">رقم العضوية</label>
            <input
              type="number"
              required
              value={formData.memberNumber}
              onChange={(e) => setFormData({ ...formData, memberNumber: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 font-bold text-blue-600"
              placeholder="رقم العضوية"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">الاسم</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="أدخل اسم العضو"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="01xxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">عدد InBody</label>
            <input
              type="number"
              value={formData.inBodyScans}
              onChange={(e) => setFormData({ ...formData, inBodyScans: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">عدد الدعوات</label>
            <input
              type="number"
              value={formData.invitations}
              onChange={(e) => setFormData({ ...formData, invitations: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">سعر الاشتراك</label>
            <input
              type="number"
              required
              value={formData.subscriptionPrice}
onChange={(e) => {
  const value = e.target.value === '' ? 0 : Math.round(parseFloat(e.target.value))
  setFormData({ ...formData, subscriptionPrice: value })
}}
step="1"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">المبلغ المتبقي</label>
            <input
              type="number"
              value={formData.remainingAmount}
              onChange={(e) => setFormData({ ...formData, remainingAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* قسم طريقة الدفع */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-5">
          <PaymentMethodSelector
            value={formData.paymentMethod}
            onChange={(method) => setFormData({ ...formData, paymentMethod: method })}
            required
          />
        </div>

        {/* قسم التواريخ */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <span>📅</span>
            <span>فترة الاشتراك</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                تاريخ البداية <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border-2 rounded-lg font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">التنسيق: سنة-شهر-يوم</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                تاريخ الانتهاء <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border-2 rounded-lg font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">التنسيق: سنة-شهر-يوم</p>
            </div>
          </div>

          {/* أزرار سريعة */}
          <div className="mb-3">
            <p className="text-sm font-medium mb-2">⚡ إضافة سريعة:</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 6, 9, 12].map(months => (
                <button
                  key={months}
                  type="button"
                  onClick={() => calculateExpiryFromMonths(months)}
                  className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm transition"
                >
                  + {months} {months === 1 ? 'شهر' : 'أشهر'}
                </button>
              ))}
            </div>
          </div>

          {duration !== null && (
            <div className="bg-white border-2 border-blue-300 rounded-lg p-3">
              {duration > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⏱️</span>
                  <div>
                    <p className="font-bold text-blue-800">مدة الاشتراك:</p>
                    <p className="text-lg font-mono">
                      {formatDurationInMonths(duration)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-red-600">❌ تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ملاحظات</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
            placeholder="أي ملاحظات إضافية..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري الحفظ...' : 'إضافة عضو'}
        </button>
      </form>
    </div>
  )
}