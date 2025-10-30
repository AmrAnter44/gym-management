// components/MemberForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { ReceiptToPrint } from './ReceiptToPrint'
import PaymentMethodSelector from './Paymentmethodselector '
import ImageUpload from './ImageUpload'

interface MemberFormProps {
  onSuccess: () => void
}

export default function MemberForm({ onSuccess }: MemberFormProps) {
  const [formData, setFormData] = useState({
    memberNumber: '',
    name: '',
    phone: '',
    profileImage: null as string | null, // ✅ إضافة الصورة
    inBodyScans: 0,
    invitations: 0,
    freePTSessions: 0,
    subscriptionPrice: 0,
    remainingAmount: 0,
    notes: '',
    startDate: '',
    expiryDate: '',
    paymentMethod: 'cash'
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [nextMemberNumber, setNextMemberNumber] = useState<number | null>(null)

  useEffect(() => {
    fetchNextMemberNumber()
  }, [])

  const fetchNextMemberNumber = async () => {
    try {
      const response = await fetch('/api/members/next-number')
      const data = await response.json()
      setNextMemberNumber(data.nextNumber)
      setFormData(prev => ({ ...prev, memberNumber: data.nextNumber.toString() }))
    } catch (error) {
      console.error('Error fetching next member number:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.phone) {
      setMessage('⚠️ يرجى إدخال الاسم ورقم الهاتف')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          memberNumber: formData.memberNumber ? parseInt(formData.memberNumber) : nextMemberNumber,
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('✅ تم إضافة العضو بنجاح!')
        
        // جلب آخر إيصال للعضو
        const receiptsResponse = await fetch('/api/receipts')
        const receipts = await receiptsResponse.json()
        const memberReceipt = receipts
          .filter((r: any) => r.memberId === data.id)
          .sort((a: any, b: any) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0]

        if (memberReceipt) {
          setReceiptData({
            receiptNumber: memberReceipt.receiptNumber,
            type: 'Member',
            amount: memberReceipt.amount,
            details: JSON.parse(memberReceipt.itemDetails),
            date: new Date(memberReceipt.createdAt),
            paymentMethod: formData.paymentMethod
          })
          setShowReceipt(true)
        }

        // إعادة تعيين النموذج
        setFormData({
          memberNumber: '',
          name: '',
          phone: '',
          profileImage: null, // ✅ إعادة تعيين الصورة
          inBodyScans: 0,
          invitations: 0,
          freePTSessions: 0,
          subscriptionPrice: 0,
          remainingAmount: 0,
          notes: '',
          startDate: '',
          expiryDate: '',
          paymentMethod: 'cash'
        })

        fetchNextMemberNumber()
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        setMessage(`❌ ${data.error || 'فشل إضافة العضو'}`)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ حدث خطأ في الإضافة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ✅ قسم الصورة */}
          <div className="md:col-span-2 flex justify-center">
            <ImageUpload
              currentImage={formData.profileImage}
              onImageChange={(url) => setFormData({ ...formData, profileImage: url })}
              disabled={loading}
            />
          </div>

          {/* رقم العضوية */}
          <div>
            <label className="block text-sm font-medium mb-2">
              رقم العضوية <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              value={formData.memberNumber}
              onChange={(e) => setFormData({ ...formData, memberNumber: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder={nextMemberNumber ? `الرقم التالي: ${nextMemberNumber}` : 'تلقائي'}
            />
          </div>

          {/* الاسم */}
          <div>
            <label className="block text-sm font-medium mb-2">
              الاسم <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {/* رقم الهاتف */}
          <div>
            <label className="block text-sm font-medium mb-2">
              رقم الهاتف <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {/* سعر الاشتراك */}
          <div>
            <label className="block text-sm font-medium mb-2">
              سعر الاشتراك <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              value={formData.subscriptionPrice}
              onChange={(e) => setFormData({ ...formData, subscriptionPrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* المبلغ المتبقي */}
          <div>
            <label className="block text-sm font-medium mb-2">المبلغ المتبقي</label>
            <input
              type="number"
              value={formData.remainingAmount}
              onChange={(e) => setFormData({ ...formData, remainingAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* InBody */}
          <div>
            <label className="block text-sm font-medium mb-2">حصص InBody</label>
            <input
              type="number"
              value={formData.inBodyScans}
              onChange={(e) => setFormData({ ...formData, inBodyScans: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* الدعوات */}
          <div>
            <label className="block text-sm font-medium mb-2">عدد الدعوات</label>
            <input
              type="number"
              value={formData.invitations}
              onChange={(e) => setFormData({ ...formData, invitations: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* حصص PT */}
          <div>
            <label className="block text-sm font-medium mb-2">حصص PT مجانية</label>
            <input
              type="number"
              value={formData.freePTSessions}
              onChange={(e) => setFormData({ ...formData, freePTSessions: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* تاريخ البداية */}
          <div>
            <label className="block text-sm font-medium mb-2">تاريخ البداية</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* تاريخ الانتهاء */}
          <div>
            <label className="block text-sm font-medium mb-2">تاريخ الانتهاء</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          {/* طريقة الدفع */}
          <div className="md:col-span-2">
            <PaymentMethodSelector
              value={formData.paymentMethod}
              onChange={(method) => setFormData({ ...formData, paymentMethod: method })}
            />
          </div>

          {/* ملاحظات */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">ملاحظات</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>
        </div>

        {/* زر الإرسال */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-bold text-lg"
        >
          {loading ? 'جاري الحفظ...' : '✅ إضافة العضو'}
        </button>
      </form>

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
    </>
  )
}