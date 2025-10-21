'use client'

import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [receiptNumber, setReceiptNumber] = useState(1000)
  const [memberNumber, setMemberNumber] = useState(1001)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // جلب الأرقام الحالية
  useEffect(() => {
    const fetchNumbers = async () => {
      try {
        // جلب رقم الإيصال
        const receiptRes = await fetch('/api/receipts/next-number')
        const receiptData = await receiptRes.json()
        setReceiptNumber(receiptData.nextNumber)

        // جلب رقم العضوية
        const memberRes = await fetch('/api/members/next-number')
        const memberData = await memberRes.json()
        setMemberNumber(memberData.nextNumber)
      } catch (error) {
        console.error('Error fetching numbers:', error)
      }
    }
    fetchNumbers()
  }, [])

  const handleUpdateReceipt = async () => {
    if (receiptNumber < 1) {
      alert('رقم الإيصال يجب أن يكون أكبر من 0')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/receipts/next-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNumber: receiptNumber })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ حدث خطأ في التحديث')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMember = async () => {
    if (memberNumber < 1) {
      alert('رقم العضوية يجب أن يكون أكبر من 0')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/members/next-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startNumber: memberNumber })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ ${data.message}`)
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(`❌ ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ حدث خطأ في التحديث')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">⚙️ الإعدادات</h1>
        <p className="text-gray-600">إدارة أرقام العضويات والإيصالات</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* إعدادات الإيصالات */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-3 rounded-full">
              <span className="text-3xl">🧾</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">أرقام الإيصالات</h2>
              <p className="text-sm text-gray-600">التحكم في ترقيم الإيصالات</p>
            </div>
          </div>

          <div className="bg-blue-50 border-r-4 border-blue-500 p-4 mb-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>📌 ملاحظة:</strong> رقم الإيصال التالي سيكون من الرقم الذي تحدده. 
              هذا الرقم مستقل تماماً عن رقم العضوية.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                الرقم التالي للإيصال
              </label>
              <input
                type="number"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 rounded-lg text-xl font-bold text-green-600"
                placeholder="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                الإيصال القادم سيحمل رقم: <strong>#{receiptNumber}</strong>
              </p>
            </div>

            <button
              onClick={handleUpdateReceipt}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? 'جاري التحديث...' : 'تحديث رقم الإيصال'}
            </button>
          </div>
        </div>

        {/* إعدادات العضويات */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <span className="text-3xl">👥</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">أرقام العضويات</h2>
              <p className="text-sm text-gray-600">التحكم في ترقيم الأعضاء</p>
            </div>
          </div>

          <div className="bg-blue-50 border-r-4 border-blue-500 p-4 mb-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>📌 ملاحظة:</strong> رقم العضوية التالي سيكون من الرقم الذي تحدده.
              يمكنك إدخال رقم عضوية مخصص عند إضافة عضو جديد.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                الرقم التالي للعضوية
              </label>
              <input
                type="number"
                value={memberNumber}
                onChange={(e) => setMemberNumber(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 rounded-lg text-xl font-bold text-blue-600"
                placeholder="1001"
              />
              <p className="text-xs text-gray-500 mt-1">
                العضوية القادمة ستحمل رقم: <strong>#{memberNumber}</strong>
              </p>
            </div>

            <button
              onClick={handleUpdateMember}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
            >
              {loading ? 'جاري التحديث...' : 'تحديث رقم العضوية'}
            </button>
          </div>
        </div>
      </div>

      {/* معلومات إضافية */}
      <div className="mt-6 bg-yellow-50 border-r-4 border-yellow-500 p-6 rounded-lg">
        <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
          <span>⚠️</span>
          <span>تحذير مهم</span>
        </h3>
        <ul className="space-y-2 text-sm text-yellow-800">
          <li>• تأكد من عدم استخدام أرقام موجودة بالفعل في النظام</li>
          <li>• رقم الإيصال ورقم العضوية منفصلان تماماً ولا يؤثر أحدهما على الآخر</li>
          <li>• بعد التحديث، جميع الإيصالات والعضويات الجديدة ستبدأ من الأرقام المحددة</li>
          <li>• يُنصح بتحديد أرقام أكبر من آخر رقم مستخدم لتجنب التعارض</li>
        </ul>
      </div>

      {/* إحصائيات */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
          <div className="text-4xl mb-2">🧾</div>
          <div className="text-sm opacity-90">رقم الإيصال الحالي</div>
          <div className="text-3xl font-bold">#{receiptNumber}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-sm opacity-90">رقم العضوية الحالي</div>
          <div className="text-3xl font-bold">#{memberNumber}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="text-4xl mb-2">🔢</div>
          <div className="text-sm opacity-90">الفرق بين الرقمين</div>
          <div className="text-3xl font-bold">{Math.abs(memberNumber - receiptNumber)}</div>
        </div>
      </div>
    </div>
  )
}