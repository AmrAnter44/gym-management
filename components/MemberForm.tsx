'use client'

import { useState, useRef } from 'react'
import PaymentMethodSelector from './Paymentmethodselector '
import { calculateDaysBetween } from '../lib/dateFormatter'

interface MemberFormProps {
  onSuccess: () => void
}

export default function MemberForm({ onSuccess }: MemberFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [nextMemberNumber, setNextMemberNumber] = useState<number | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    memberNumber: '',
    name: '',
    phone: '',
    profileImage: '',
    inBodyScans: 0,
    invitations: 0,
    freePTSessions: 0,
    subscriptionPrice: 0,
    remainingAmount: 0,
    notes: '',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    paymentMethod: 'cash' as 'cash' | 'visa' | 'instapay'
  })

  // جلب رقم العضوية التالي
  useState(() => {
    fetch('/api/members/next-number')
      .then(res => res.json())
      .then(data => {
        setNextMemberNumber(data.nextNumber)
        setFormData(prev => ({ ...prev, memberNumber: data.nextNumber.toString() }))
      })
      .catch(err => console.error('Error fetching next number:', err))
  })

  // معالجة رفع الصورة
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      setMessage('❌ يرجى اختيار صورة فقط')
      return
    }

    // التحقق من حجم الملف (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('❌ حجم الصورة يجب أن يكون أقل من 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      setFormData(prev => ({ ...prev, profileImage: base64String }))
    }
    reader.readAsDataURL(file)
  }

  // حذف الصورة
  const removeImage = () => {
    setImagePreview('')
    setFormData(prev => ({ ...prev, profileImage: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // حساب تاريخ الانتهاء بناءً على عدد الأشهر
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

  // حساب المدة بين التاريخين
  const calculateDuration = () => {
    if (!formData.startDate || !formData.expiryDate) return null
    return calculateDaysBetween(formData.startDate, formData.expiryDate)
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

      const data = await response.json()

      if (response.ok) {
        setMessage('✅ تم إضافة العضو بنجاح!')
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setMessage(`❌ ${data.error || 'حدث خطأ'}`)
      }
    } catch (error) {
      setMessage('❌ حدث خطأ في الاتصال')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const duration = calculateDuration()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg text-center font-medium ${
          message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* معلومات أساسية */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span>👤</span>
          <span>المعلومات الأساسية</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">رقم العضوية</label>
            <input
              type="number"
              value={formData.memberNumber}
              onChange={(e) => setFormData({ ...formData, memberNumber: e.target.value })}
              className="w-full px-3 py-2 border-2 rounded-lg font-bold text-blue-600"
              placeholder={nextMemberNumber ? `التالي: ${nextMemberNumber}` : 'تلقائي'}
            />
            <p className="text-xs text-gray-500 mt-1">
              {nextMemberNumber && `💡 الرقم التالي المتاح: ${nextMemberNumber}`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">الاسم *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border-2 rounded-lg"
              placeholder="الاسم الكامل"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">رقم الهاتف *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border-2 rounded-lg"
              placeholder="01xxxxxxxxx"
            />
          </div>
        </div>
      </div>

      {/* صورة العضو */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span>📸</span>
          <span>صورة العضو (اختياري)</span>
        </h3>

        <div className="flex flex-col items-center gap-4">
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-32 h-32 rounded-full object-cover border-4 border-purple-300"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-dashed border-purple-300 flex items-center justify-center bg-purple-100">
              <span className="text-4xl text-purple-400">👤</span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="profileImage"
          />
          
          <label
            htmlFor="profileImage"
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition"
          >
            {imagePreview ? '📷 تغيير الصورة' : '📷 رفع صورة'}
          </label>
          
          <p className="text-xs text-gray-500 text-center">
            يُفضل صورة بحجم 500×500 بكسل أو أكبر<br/>
            الحد الأقصى: 5MB
          </p>
        </div>
      </div>

      {/* 📅 تواريخ الاشتراك - منسوخ من PT Form */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
          <span>📅</span>
          <span>فترة الاشتراك</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              تاريخ البداية
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border-2 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              تاريخ الانتهاء
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full px-3 py-2 border-2 rounded-lg font-mono"
            />
          </div>
        </div>

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
            <p className="text-sm">
              <span className="font-medium">📊 مدة الاشتراك: </span>
              <span className="font-bold text-blue-600">
                {duration} يوم
                {duration >= 30 && ` (${Math.floor(duration / 30)} ${Math.floor(duration / 30) === 1 ? 'شهر' : 'أشهر'})`}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* الخدمات الإضافية */}
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span>🎁</span>
          <span>الخدمات الإضافية</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">⚖️ InBody</label>
            <input
              type="number"
              min="0"
              value={formData.inBodyScans}
              onChange={(e) => setFormData({ ...formData, inBodyScans: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border-2 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">🎟️ دعوات</label>
            <input
              type="number"
              min="0"
              value={formData.invitations}
              onChange={(e) => setFormData({ ...formData, invitations: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border-2 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">💪 حصص PT مجانية</label>
            <input
              type="number"
              min="0"
              value={formData.freePTSessions}
              onChange={(e) => setFormData({ ...formData, freePTSessions: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border-2 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* المعلومات المالية */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span>💰</span>
          <span>المعلومات المالية</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">سعر الاشتراك *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.subscriptionPrice}
              onChange={(e) => setFormData({ ...formData, subscriptionPrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border-2 rounded-lg"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">المبلغ المتبقي</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.remainingAmount}
              onChange={(e) => setFormData({ ...formData, remainingAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border-2 rounded-lg"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="bg-white border-2 border-yellow-300 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">المبلغ المدفوع:</span>
            <span className="font-bold text-green-600 text-lg">
              {(formData.subscriptionPrice - formData.remainingAmount).toFixed(2)} ج.م
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">المتبقي:</span>
            <span className="font-bold text-red-600 text-lg">
              {formData.remainingAmount.toFixed(2)} ج.م
            </span>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">طريقة الدفع</label>
          <PaymentMethodSelector
            value={formData.paymentMethod}
            onChange={(method) => setFormData({ ...formData, paymentMethod: method })}
          />
        </div>
      </div>

      {/* ملاحظات */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium mb-2">📝 ملاحظات</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border-2 rounded-lg"
          rows={3}
          placeholder="ملاحظات إضافية..."
        />
      </div>

      {/* أزرار الإرسال */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-bold text-lg transition"
        >
          {loading ? '⏳ جاري الحفظ...' : '✅ حفظ العضو'}
        </button>
      </div>
    </form>
  )
}