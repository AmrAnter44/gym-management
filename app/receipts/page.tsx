'use client'

import { useEffect, useState } from 'react'
import { printReceiptFromData } from '../../lib/printSystem'

interface ReceiptData {
  id: string
  receiptNumber: number
  type: string
  amount: number
  itemDetails: string
  paymentMethod: string
  createdAt: string
  memberId?: string
  ptId?: string
  dayUseId?: string
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<ReceiptData[]>([])
  const [filteredReceipts, setFilteredReceipts] = useState<ReceiptData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [nextReceiptNumber, setNextReceiptNumber] = useState<number>(1000)

  const fetchReceipts = async () => {
    try {
      const response = await fetch('/api/receipts')
      const data = await response.json()
      setReceipts(data)
      setFilteredReceipts(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchNextReceiptNumber = async () => {
    try {
      const response = await fetch('/api/receipts/next-number')
      const data = await response.json()
      setNextReceiptNumber(data.nextNumber)
    } catch (error) {
      console.error('Error fetching next receipt number:', error)
    }
  }

  useEffect(() => {
    fetchReceipts()
    fetchNextReceiptNumber()
  }, [])

  useEffect(() => {
    let filtered = receipts

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType)
    }

    // Filter by payment method
    if (filterPaymentMethod !== 'all') {
      filtered = filtered.filter(r => r.paymentMethod === filterPaymentMethod)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r => {
        const details = JSON.parse(r.itemDetails)
        return (
          r.receiptNumber.toString().includes(searchTerm) ||
          details.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          details.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          details.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (details.memberNumber && details.memberNumber.toString().includes(searchTerm))
        )
      })
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(r => {
        const receiptDate = new Date(r.createdAt)
        
        if (dateFilter === 'today') {
          return receiptDate.toDateString() === now.toDateString()
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return receiptDate >= weekAgo
        } else if (dateFilter === 'month') {
          return receiptDate.getMonth() === now.getMonth() && 
                 receiptDate.getFullYear() === now.getFullYear()
        }
        return true
      })
    }

    setFilteredReceipts(filtered)
  }, [filterType, filterPaymentMethod, searchTerm, dateFilter, receipts])

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'Member': 'اشتراك عضوية',
      'PT': 'تدريب شخصي',
      'DayUse': 'يوم استخدام',
      'InBody': 'InBody'
    }
    return types[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Member': 'bg-blue-100 text-blue-800',
      'PT': 'bg-green-100 text-green-800',
      'DayUse': 'bg-purple-100 text-purple-800',
      'InBody': 'bg-orange-100 text-orange-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods: { [key: string]: string } = {
      'cash': 'كاش 💵',
      'visa': 'فيزا 💳',
      'instapay': 'إنستا باي 📱',
      'wallet': 'محفظة 💰'
    }
    return methods[method] || 'كاش 💵'
  }

  const getPaymentMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      'cash': 'bg-green-100 text-green-800 border-green-300',
      'visa': 'bg-blue-100 text-blue-800 border-blue-300',
      'instapay': 'bg-purple-100 text-purple-800 border-purple-300',
      'wallet': 'bg-orange-100 text-orange-800 border-orange-300'
    }
    return colors[method] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getTotalRevenue = () => {
    return filteredReceipts.reduce((sum, r) => sum + r.amount, 0)
  }

  const getTodayCount = () => {
    const today = new Date().toDateString()
    return receipts.filter(r => new Date(r.createdAt).toDateString() === today).length
  }

  const getRevenueByPaymentMethod = (method: string) => {
    return receipts
      .filter(r => r.paymentMethod === method)
      .reduce((sum, r) => sum + r.amount, 0)
  }

  const handlePrintReceipt = (receipt: ReceiptData) => {
    const details = JSON.parse(receipt.itemDetails)
    printReceiptFromData(
      receipt.receiptNumber,
      receipt.type,
      receipt.amount,
      details,
      receipt.createdAt,
      receipt.paymentMethod
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // البحث يحدث تلقائياً مع useEffect
    }
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🧾 سجل الإيصالات</h1>
        <p className="text-gray-600">متابعة وإدارة جميع الإيصالات الصادرة</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">إجمالي الإيصالات</p>
            <span className="text-3xl">📊</span>
          </div>
          <p className="text-3xl font-bold">{filteredReceipts.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">الإيرادات المعروضة</p>
            <span className="text-3xl">💰</span>
          </div>
          <p className="text-3xl font-bold">{getTotalRevenue().toFixed(0)} ج.م</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">إيصالات اليوم</p>
            <span className="text-3xl">📅</span>
          </div>
          <p className="text-3xl font-bold">{getTodayCount()}</p>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm opacity-90">الإيصال التالي</p>
            <span className="text-3xl">🔢</span>
          </div>
          <p className="text-3xl font-bold">#{nextReceiptNumber}</p>
        </div>
      </div>

      {/* Payment Methods Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border-2 border-green-200 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">كاش</p>
              <p className="text-2xl font-bold text-green-600">
                {getRevenueByPaymentMethod('cash').toFixed(0)} ج.م
              </p>
            </div>
            <span className="text-4xl">💵</span>
          </div>
          <p className="text-xs text-gray-500">
            {receipts.filter(r => r.paymentMethod === 'cash').length} إيصال
          </p>
        </div>

        <div className="bg-white border-2 border-blue-200 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">فيزا</p>
              <p className="text-2xl font-bold text-blue-600">
                {getRevenueByPaymentMethod('visa').toFixed(0)} ج.م
              </p>
            </div>
            <span className="text-4xl">💳</span>
          </div>
          <p className="text-xs text-gray-500">
            {receipts.filter(r => r.paymentMethod === 'visa').length} إيصال
          </p>
        </div>

        <div className="bg-white border-2 border-purple-200 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">إنستا باي</p>
              <p className="text-2xl font-bold text-purple-600">
                {getRevenueByPaymentMethod('instapay').toFixed(0)} ج.م
              </p>
            </div>
            <span className="text-4xl">📱</span>
          </div>
          <p className="text-xs text-gray-500">
            {receipts.filter(r => r.paymentMethod === 'instapay').length} إيصال
          </p>
        </div>

        <div className="bg-white border-2 border-orange-200 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-600">محفظة</p>
              <p className="text-2xl font-bold text-orange-600">
                {getRevenueByPaymentMethod('wallet').toFixed(0)} ج.م
              </p>
            </div>
            <span className="text-4xl">💰</span>
          </div>
          <p className="text-xs text-gray-500">
            {receipts.filter(r => r.paymentMethod === 'wallet').length} إيصال
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2">🔍 البحث</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="رقم الإيصال، الاسم..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">📋 نوع العملية</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الأنواع</option>
              <option value="Member">اشتراكات العضوية</option>
              <option value="PT">التدريب الشخصي</option>
              <option value="DayUse">يوم استخدام</option>
              <option value="InBody">InBody</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">💳 طريقة الدفع</label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الطرق</option>
              <option value="cash">كاش 💵</option>
              <option value="visa">فيزا 💳</option>
              <option value="instapay">إنستا باي 📱</option>
              <option value="wallet">محفظة 💰</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">📅 الفترة الزمنية</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">كل الفترات</option>
              <option value="today">اليوم</option>
              <option value="week">آخر أسبوع</option>
              <option value="month">هذا الشهر</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterType('all')
                setFilterPaymentMethod('all')
                setDateFilter('all')
              }}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              🔄 إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">جاري تحميل الإيصالات...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                <tr>
                  <th className="px-6 py-4 text-right font-bold">رقم الإيصال</th>
                  <th className="px-6 py-4 text-right font-bold">النوع</th>
                  <th className="px-6 py-4 text-right font-bold">التفاصيل</th>
                  <th className="px-6 py-4 text-right font-bold">المبلغ</th>
                  <th className="px-6 py-4 text-right font-bold">طريقة الدفع</th>
                  <th className="px-6 py-4 text-right font-bold">التاريخ</th>
                  <th className="px-6 py-4 text-right font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((receipt) => {
                  const details = JSON.parse(receipt.itemDetails)
                  return (
                    <tr key={receipt.id} className="border-t hover:bg-blue-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-xl text-green-600">
                          #{receipt.receiptNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(receipt.type)}`}>
                          {getTypeLabel(receipt.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {details.memberNumber && (
                          <div className="mb-1">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">
                              عضوية #{details.memberNumber}
                            </span>
                          </div>
                        )}
                        {details.memberName && (
                          <div>
                            <p className="font-semibold text-gray-800">{details.memberName}</p>
                          </div>
                        )}
                        {details.clientName && (
                          <div>
                            <p className="font-semibold text-gray-800">{details.clientName}</p>
                            <p className="text-sm text-gray-600">{details.sessionsPurchased} جلسة - {details.coachName}</p>
                          </div>
                        )}
                        {details.name && (
                          <div>
                            <p className="font-semibold text-gray-800">{details.name}</p>
                            <p className="text-sm text-gray-600">{details.serviceType === 'DayUse' ? 'يوم استخدام' : 'InBody'}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-xl text-green-600">{receipt.amount} ج.م</span>
                          {details.remainingAmount > 0 && (
                            <p className="text-xs text-red-600 mt-1">
                              متبقي: {details.remainingAmount} ج.م
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-2 rounded-lg text-sm font-bold border-2 ${getPaymentMethodColor(receipt.paymentMethod)}`}>
                          {getPaymentMethodLabel(receipt.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>
                          <p className="font-medium">
                            {new Date(receipt.createdAt).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(receipt.createdAt).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handlePrintReceipt(receipt)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                          <span>🖨️</span>
                          <span>طباعة</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredReceipts.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-xl font-medium">لا توجد إيصالات تطابق البحث</p>
              <p className="text-sm mt-2">جرّب تغيير معايير البحث أو الفلترة</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 bg-blue-50 border-r-4 border-blue-500 p-5 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-3xl">💡</div>
          <div className="flex-1">
            <h4 className="font-bold text-blue-800 mb-2">نصائح سريعة</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• استخدم البحث للعثور على إيصال محدد برقمه أو باسم العميل</li>
              <li>• فلتر حسب طريقة الدفع لمعرفة الإيرادات من كل وسيلة</li>
              <li>• اطبع الإيصال مباشرة من زر الطباعة 🖨️</li>
              <li>• رقم الإيصال مستقل ومتسلسل لجميع العمليات</li>
              <li>• يمكنك تغيير رقم بداية الإيصالات من صفحة <a href="/settings" className="underline font-bold">الإعدادات ⚙️</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}