'use client'

import { useEffect, useState } from 'react'
import { Receipt } from '../../components/Receipt'

interface ReceiptData {
  id: string
  receiptNumber: number
  type: string
  amount: number
  itemDetails: string
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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)

  const handlePrint = () => {
    window.print()
  }

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

  useEffect(() => {
    fetchReceipts()
  }, [])

  useEffect(() => {
    let filtered = receipts

    // فلترة حسب النوع
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType)
    }

    // فلترة حسب البحث
    if (searchTerm) {
      filtered = filtered.filter(r => {
        const details = JSON.parse(r.itemDetails)
        return (
          r.receiptNumber.toString().includes(searchTerm) ||
          details.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          details.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          details.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    setFilteredReceipts(filtered)
  }, [filterType, searchTerm, receipts])

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

  const getTotalRevenue = () => {
    return filteredReceipts.reduce((sum, r) => sum + r.amount, 0)
  }

  const printReceipt = (receipt: ReceiptData) => {
    setSelectedReceipt(receipt)
    setTimeout(() => {
      handlePrint()
    }, 100)
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">سجل الإيصالات</h1>
        <p className="text-gray-600">متابعة جميع الإيصالات الصادرة</p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-600 text-sm">إجمالي الإيصالات</p>
          <p className="text-2xl font-bold">{filteredReceipts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-600 text-sm">الإيرادات المعروضة</p>
          <p className="text-2xl font-bold text-green-600">{getTotalRevenue().toFixed(2)} ج.م</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-600 text-sm">اشتراكات اليوم</p>
          <p className="text-2xl font-bold text-blue-600">
            {filteredReceipts.filter(r => {
              const today = new Date().toDateString()
              return new Date(r.createdAt).toDateString() === today
            }).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-600 text-sm">آخر إيصال</p>
          <p className="text-2xl font-bold text-purple-600">
            #{receipts[0]?.receiptNumber || '-'}
          </p>
        </div>
      </div>

      {/* فلاتر */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">البحث</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم الإيصال أو الاسم..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">فلترة حسب النوع</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">الكل</option>
              <option value="Member">اشتراكات العضوية</option>
              <option value="PT">التدريب الشخصي</option>
              <option value="DayUse">يوم استخدام</option>
              <option value="InBody">InBody</option>
            </select>
          </div>
        </div>
      </div>

      {/* جدول الإيصالات */}
      {loading ? (
        <div className="text-center py-12">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right">رقم الإيصال</th>
                  <th className="px-4 py-3 text-right">النوع</th>
                  <th className="px-4 py-3 text-right">التفاصيل</th>
                  <th className="px-4 py-3 text-right">المبلغ</th>
                  <th className="px-4 py-3 text-right">التاريخ</th>
                  <th className="px-4 py-3 text-right">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceipts.map((receipt) => {
                  const details = JSON.parse(receipt.itemDetails)
                  return (
                    <tr key={receipt.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-bold text-blue-600">#{receipt.receiptNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-sm ${getTypeColor(receipt.type)}`}>
                          {getTypeLabel(receipt.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {details.memberName && (
                          <div>
                            <p className="font-semibold">{details.memberName}</p>
                            {details.memberNumber && (
                              <p className="text-sm text-gray-600">عضوية #{details.memberNumber}</p>
                            )}
                          </div>
                        )}
                        {details.clientName && (
                          <div>
                            <p className="font-semibold">{details.clientName}</p>
                            <p className="text-sm text-gray-600">{details.sessionsPurchased} جلسة</p>
                          </div>
                        )}
                        {details.name && (
                          <div>
                            <p className="font-semibold">{details.name}</p>
                            <p className="text-sm text-gray-600">{details.serviceType}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-green-600">{receipt.amount} ج.م</span>
                        {details.remainingAmount > 0 && (
                          <p className="text-xs text-red-600">متبقي: {details.remainingAmount} ج.م</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(receipt.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => printReceipt(receipt)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          طباعة
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredReceipts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              لا توجد إيصالات تطابق البحث
            </div>
          )}
        </div>
      )}

      {/* الإيصال للطباعة */}
      {selectedReceipt && (
        <div className="print-only">
          <Receipt
            receiptNumber={selectedReceipt.receiptNumber}
            type={selectedReceipt.type}
            amount={selectedReceipt.amount}
            details={JSON.parse(selectedReceipt.itemDetails)}
            date={new Date(selectedReceipt.createdAt)}
          />
        </div>
      )}
    </div>
  )
}