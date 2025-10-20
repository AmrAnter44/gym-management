'use client'

import { useState, useEffect } from 'react'
import { printReceipt, generateReceiptHTML } from '../lib/printHelper'

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
    expiryDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [lastReceipt, setLastReceipt] = useState<{
    receiptNumber: number
    type: string
    amount: number
    itemDetails: string
    createdAt: string
  } | null>(null)

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

  const handlePrint = () => {
    if (!lastReceipt) return
    
    const details = JSON.parse(lastReceipt.itemDetails)
    const html = generateReceiptHTML(
      lastReceipt.receiptNumber,
      lastReceipt.type,
      lastReceipt.amount,
      details,
      new Date(lastReceipt.createdAt)
    )
    
    printReceipt(html)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        const member = result
        
        // جلب الإيصال
        try {
          const receiptsResponse = await fetch(`/api/receipts?memberId=${member.id}`)
          const receipts = await receiptsResponse.json()
          
          if (receipts.length > 0) {
            setLastReceipt(receipts[0])
            
            // طباعة تلقائية
            setTimeout(() => {
              const details = JSON.parse(receipts[0].itemDetails)
              const html = generateReceiptHTML(
                receipts[0].receiptNumber,
                receipts[0].type,
                receipts[0].amount,
                details,
                new Date(receipts[0].createdAt)
              )
              printReceipt(html)
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
          expiryDate: '',
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

  return (
    <div>
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
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
              onChange={(e) => setFormData({ ...formData, subscriptionPrice: parseFloat(e.target.value) || 0 })}
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

          <div>
            <label className="block text-sm font-medium mb-1">تاريخ الانتهاء</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
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

      {lastReceipt && (
        <div className="mt-8">
          <button
            onClick={handlePrint}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            🖨️ طباعة الإيصال مرة أخرى
          </button>
        </div>
      )}
    </div>
  )
}