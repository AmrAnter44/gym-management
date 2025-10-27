'use client'

import { useEffect, useState } from 'react'
import { ReceiptToPrint } from '../../components/ReceiptToPrint'
import PaymentMethodSelector from '../../components/Paymentmethodselector '
import { formatDateYMD, calculateRemainingDays, calculateDaysBetween, formatDurationInMonths } from '../../lib/dateFormatter'

interface PTSession {
  id: string
  ptNumber: number
  clientName: string
  phone: string
  sessionsPurchased: number
  sessionsRemaining: number
  coachName: string
  pricePerSession: number
  startDate?: string
  expiryDate?: string
  createdAt: string
}

export default function PTPage() {
  const [sessions, setSessions] = useState<PTSession[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [nextPTNumber, setNextPTNumber] = useState<number>(2001)
  
  const [formData, setFormData] = useState({
    ptNumber: '',
    clientName: '',
    phone: '',
    sessionsPurchased: 0,
    coachName: '',
    pricePerSession: 0,
    paymentMethod: 'cash',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
  })
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)

  // جلب رقم PT التالي
  useEffect(() => {
    const fetchNextNumber = async () => {
      try {
        const response = await fetch('/api/pt/next-number')
        const data = await response.json()
        setNextPTNumber(data.nextNumber)
        setFormData(prev => ({ ...prev, ptNumber: data.nextNumber.toString() }))
      } catch (error) {
        console.error('Error fetching next number:', error)
      }
    }
    fetchNextNumber()
  }, [])

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
      const response = await fetch('/api/pt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        const pt = result
        
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
              paymentMethod: formData.paymentMethod
            })
            setShowReceipt(true)
          }
        } catch (err) {
          console.error('Error fetching receipt:', err)
        }

        // تصفير الفورم
        const nextNumber = nextPTNumber + 1
        setNextPTNumber(nextNumber)
        setFormData({
          ptNumber: nextNumber.toString(),
          clientName: '',
          phone: '',
          sessionsPurchased: 0,
          coachName: '',
          pricePerSession: 0,
          paymentMethod: 'cash',
          startDate: new Date().toISOString().split('T')[0],
          expiryDate: '',
        })
        
        setMessage('✅ تم إضافة الجلسة بنجاح!')
        setTimeout(() => setMessage(''), 3000)
        fetchSessions()
        setShowForm(false)
      } else {
        setMessage(`❌ ${result.error || 'فشل إضافة الجلسة'}`)
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

  const duration = calculateDuration()

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
              {/* رقم PT */}
              <div>
                <label className="block text-sm font-medium mb-1">رقم PT</label>
                <input
                  type="number"
                  required
                  value={formData.ptNumber}
                  onChange={(e) => setFormData({ ...formData, ptNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 font-bold text-green-600"
                  placeholder="رقم PT"
                />
              </div>

              {/* اسم العميل */}
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

              {/* رقم الهاتف */}
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

              {/* عدد الجلسات */}
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

              {/* اسم المدرب */}
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

              {/* سعر الجلسة */}
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

              {/* الإجمالي */}
              <div className="col-span-2">
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600">الإجمالي: </span>
                  <span className="font-bold text-lg">
                    {formData.sessionsPurchased * formData.pricePerSession} ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* قسم التواريخ */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span>📅</span>
                <span>فترة الاشتراك (اختياري)</span>
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

              {duration !== null && formData.expiryDate && (
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
              disabled={loading || (duration !== null && formData.expiryDate && duration <= 0)}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right">رقم PT</th>
                  <th className="px-4 py-3 text-right">العميل</th>
                  <th className="px-4 py-3 text-right">الهاتف</th>
                  <th className="px-4 py-3 text-right">المدرب</th>
                  <th className="px-4 py-3 text-right">المشتراة</th>
                  <th className="px-4 py-3 text-right">المتبقية</th>
                  <th className="px-4 py-3 text-right">السعر</th>
                  <th className="px-4 py-3 text-right">تاريخ البداية</th>
                  <th className="px-4 py-3 text-right">تاريخ الانتهاء</th>
                  <th className="px-4 py-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const isExpired = session.expiryDate ? new Date(session.expiryDate) < new Date() : false
                  const daysRemaining = calculateRemainingDays(session.expiryDate)
                  const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7
                  
                  return (
                    <tr key={session.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-green-600">#{session.ptNumber}</td>
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
                      <td className="px-4 py-3">
                        <span className="text-gray-700 font-mono">
                          {formatDateYMD(session.startDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {session.expiryDate ? (
                          <div>
                            <span className={`font-mono ${isExpired ? 'text-red-600 font-bold' : isExpiringSoon ? 'text-orange-600 font-bold' : ''}`}>
                              {formatDateYMD(session.expiryDate)}
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
                  )
                })}
              </tbody>
            </table>
          </div>

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
          paymentMethod={receiptData.paymentMethod}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  )
}