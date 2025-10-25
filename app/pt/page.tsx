'use client'

import { useEffect, useState } from 'react'
import { ReceiptToPrint } from '../../components/ReceiptToPrint'
import PaymentMethodSelector from '../../components/Paymentmethodselector '

interface PTSession {
  id: string
  clientName: string
  phone: string
  sessionsPurchased: number
  sessionsRemaining: number
  coachName: string
  pricePerSession: number
  createdAt: string
}

export default function PTPage() {
  const [sessions, setSessions] = useState<PTSession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    sessionsPurchased: 0,
    coachName: '',
    pricePerSession: 0,
    paymentMethod: 'cash', // إضافة طريقة الدفع
  })
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/pt')
      const data = await response.json()
      setSessions(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/pt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const pt = await response.json()
        
        try {
          const receiptsResponse = await fetch(`/api/receipts?ptId=${pt.id}`)
          const receipts = await receiptsResponse.json()
          
          if (receipts.length > 0) {
            const receipt = receipts[0]
            setReceiptData({
              receiptNumber: receipt.receiptNumber,
              type: receipt.type,
              amount: receipt.amount,
              details: JSON.parse(receipt.itemDetails),
              date: new Date(receipt.createdAt),
              paymentMethod: receipt.paymentMethod
            })
            setShowReceipt(true)
          }
        } catch (err) {
          console.error('Error fetching receipt:', err)
        }

        setFormData({
          clientName: '',
          phone: '',
          sessionsPurchased: 0,
          coachName: '',
          pricePerSession: 0,
          paymentMethod: 'cash',
        })
        
        setMessage('✅ تم إضافة الجلسة بنجاح!')
        setTimeout(() => setMessage(''), 3000)
        fetchSessions()
        setShowForm(false)
      } else {
        setMessage('❌ فشل إضافة الجلسة')
      }
    } catch (error) {
      console.error(error)
      setMessage('❌ حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const useSession = async (id: string) => {
    try {
      await fetch('/api/pt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'use_session' }),
      })
      fetchSessions()
      alert('تم تسجيل الحضور بنجاح')
    } catch (error) {
      alert('فشل تسجيل الحضور')
    }
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">التدريب الشخصي (PT)</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          {showForm ? 'إخفاء النموذج' : 'إضافة جلسة جديدة'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">إضافة جلسة PT جديدة</h2>
          
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم العميل</label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="اسم العميل"
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
                <label className="block text-sm font-medium mb-1">عدد الجلسات</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.sessionsPurchased}
                  onChange={(e) => setFormData({ ...formData, sessionsPurchased: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="عدد الجلسات"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">اسم المدرب</label>
                <input
                  type="text"
                  required
                  value={formData.coachName}
                  onChange={(e) => setFormData({ ...formData, coachName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="اسم المدرب"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">سعر الجلسة</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.pricePerSession}
                  onChange={(e) => setFormData({ ...formData, pricePerSession: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-end">
                <div className="bg-gray-100 px-3 py-2 rounded-lg w-full">
                  <span className="text-sm text-gray-600">الإجمالي: </span>
                  <span className="font-bold text-lg">
                    {formData.sessionsPurchased * formData.pricePerSession} ج.م
                  </span>
                </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري الحفظ...' : 'إضافة جلسة'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-right">العميل</th>
                <th className="px-4 py-3 text-right">الهاتف</th>
                <th className="px-4 py-3 text-right">المدرب</th>
                <th className="px-4 py-3 text-right">المشتراة</th>
                <th className="px-4 py-3 text-right">المتبقية</th>
                <th className="px-4 py-3 text-right">السعر</th>
                <th className="px-4 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{session.clientName}</td>
                  <td className="px-4 py-3">{session.phone}</td>
                  <td className="px-4 py-3">{session.coachName}</td>
                  <td className="px-4 py-3">{session.sessionsPurchased}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${session.sessionsRemaining === 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {session.sessionsRemaining}
                    </span>
                  </td>
                  <td className="px-4 py-3">{session.pricePerSession} ج.م</td>
                  <td className="px-4 py-3 space-x-2 space-x-reverse">
                    <button
                      onClick={() => useSession(session.id)}
                      disabled={session.sessionsRemaining === 0}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      تسجيل حضور
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sessions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              لا توجد جلسات حالياً
            </div>
          )}
        </div>
      )}

      {receiptData && (
        <div className="mt-6">
          <button
            onClick={() => setShowReceipt(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            🖨️ طباعة آخر إيصال
          </button>
        </div>
      )}

      {showReceipt && receiptData && (
        <ReceiptToPrint
          receiptNumber={receiptData.receiptNumber}
          type={receiptData.type}
          amount={receiptData.amount}
          details={receiptData.details}
          date={receiptData.date}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  )
}
