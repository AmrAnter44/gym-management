'use client'

import { useState } from 'react'

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/members')
      const members = await response.json()

      const filtered = members.filter((m: any) => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm) ||
        m.id.toLowerCase().includes(searchTerm.toLowerCase())
      )

      setResults(filtered.length > 0 ? filtered[0] : null)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">البحث السريع عن الأعضاء</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                ابحث بالاسم، رقم الهاتف، أو ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="أدخل اسم العضو أو رقم الهاتف..."
                  className="flex-1 px-4 py-3 border rounded-lg text-lg"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? '...' : 'بحث'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {results && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{results.name}</h2>
              <span className={`px-4 py-2 rounded-lg text-lg font-bold ${
                results.isActive && !isExpired(results.expiryDate)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {results.isActive && !isExpired(results.expiryDate) ? '✓ نشط' : '✗ منتهي'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-lg">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-600 text-sm">رقم الهاتف</p>
                <p className="font-semibold">{results.phone}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-600 text-sm">ID</p>
                <p className="font-semibold font-mono">{results.id}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-600 text-sm">InBody المتبقية</p>
                <p className="font-semibold text-blue-600">{results.inBodyScans}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-600 text-sm">الدعوات المتبقية</p>
                <p className="font-semibold text-purple-600">{results.invitations}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-600 text-sm">سعر الاشتراك</p>
                <p className="font-semibold text-green-600">{results.subscriptionPrice} ج.م</p>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-600 text-sm">المبلغ المتبقي</p>
                <p className="font-semibold text-red-600">{results.remainingAmount} ج.م</p>
              </div>

              {results.expiryDate && (
                <div className="bg-gray-50 p-4 rounded col-span-2">
                  <p className="text-gray-600 text-sm">تاريخ الانتهاء</p>
                  <p className={`font-semibold ${isExpired(results.expiryDate) ? 'text-red-600' : 'text-gray-800'}`}>
                    {new Date(results.expiryDate).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              )}

              {results.notes && (
                <div className="bg-gray-50 p-4 rounded col-span-2">
                  <p className="text-gray-600 text-sm">ملاحظات</p>
                  <p className="font-semibold">{results.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {results === null && searchTerm && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-center">
            <p className="text-yellow-800 text-lg">❌ لم يتم العثور على نتائج</p>
          </div>
        )}
      </div>
    </div>
  )
}