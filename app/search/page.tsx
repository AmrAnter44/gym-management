'use client'

import { useState } from 'react'

interface SearchResult {
  type: 'member' | 'pt' | 'receipt'
  data: any
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'members' | 'phone'>('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      alert('يرجى إدخال كلمة البحث')
      return
    }

    setLoading(true)
    setSearched(true)
    const foundResults: SearchResult[] = []

    try {
      // البحث في الأعضاء
      if (searchType === 'all' || searchType === 'members') {
        const membersRes = await fetch('/api/members')
        const members = await membersRes.json()
        
        const filteredMembers = members.filter((m: any) => 
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.memberNumber.toString().includes(searchTerm) ||
          m.phone.includes(searchTerm)
        )
        
        filteredMembers.forEach((member: any) => {
          foundResults.push({ type: 'member', data: member })
        })
      }

      // البحث في PT
      if (searchType === 'all') {
        const ptRes = await fetch('/api/pt')
        const ptSessions = await ptRes.json()
        
        const filteredPT = ptSessions.filter((pt: any) =>
          pt.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pt.phone.includes(searchTerm)
        )
        
        filteredPT.forEach((pt: any) => {
          foundResults.push({ type: 'pt', data: pt })
        })
      }

      // البحث بالهاتف فقط
      if (searchType === 'phone') {
        const membersRes = await fetch('/api/members')
        const members = await membersRes.json()
        
        const filteredByPhone = members.filter((m: any) => 
          m.phone.includes(searchTerm)
        )
        
        filteredByPhone.forEach((member: any) => {
          foundResults.push({ type: 'member', data: member })
        })

        const ptRes = await fetch('/api/pt')
        const ptSessions = await ptRes.json()
        
        const ptByPhone = ptSessions.filter((pt: any) =>
          pt.phone.includes(searchTerm)
        )
        
        ptByPhone.forEach((pt: any) => {
          foundResults.push({ type: 'pt', data: pt })
        })
      }

      setResults(foundResults)
    } catch (error) {
      console.error('Search error:', error)
      alert('حدث خطأ في البحث')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔍 البحث السريع</h1>
        <p className="text-gray-600">ابحث عن الأعضاء والعملاء حسب الاسم أو رقم الهاتف أو رقم العضوية</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">كلمة البحث</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="ابحث بالاسم، رقم الهاتف، أو رقم العضوية..."
              className="w-full px-4 py-3 border rounded-lg text-lg"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">نوع البحث</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="w-full px-4 py-3 border rounded-lg text-lg"
            >
              <option value="all">بحث شامل</option>
              <option value="members">الأعضاء فقط</option>
              <option value="phone">بحث بالهاتف</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !searchTerm.trim()}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-medium"
        >
          {loading ? 'جاري البحث...' : '🔍 بحث'}
        </button>
      </div>

      {searched && (
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p>جاري البحث...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl">لا توجد نتائج للبحث عن "{searchTerm}"</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-xl font-bold">نتائج البحث ({results.length})</h2>
              </div>
              
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                    {result.type === 'member' && (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-medium">
                              عضو
                            </span>
                            <h3 className="text-xl font-bold mt-2">{result.data.name}</h3>
                          </div>
                          <span className="text-3xl font-bold text-blue-600">
                            #{result.data.memberNumber}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div>
                            <p className="text-sm text-gray-600">الهاتف</p>
                            <p className="font-medium">{result.data.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">السعر</p>
                            <p className="font-medium">{result.data.subscriptionPrice} ج.م</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">المتبقي</p>
                            <p className="font-medium text-red-600">{result.data.remainingAmount} ج.م</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">الحالة</p>
                            <span className={`px-2 py-1 rounded text-sm ${
                              result.data.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {result.data.isActive ? 'نشط' : 'منتهي'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {result.type === 'pt' && (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded text-sm font-medium">
                              PT
                            </span>
                            <h3 className="text-xl font-bold mt-2">{result.data.clientName}</h3>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div>
                            <p className="text-sm text-gray-600">الهاتف</p>
                            <p className="font-medium">{result.data.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">المدرب</p>
                            <p className="font-medium">{result.data.coachName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">الجلسات المتبقية</p>
                            <p className="font-medium text-green-600">{result.data.sessionsRemaining}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">سعر الجلسة</p>
                            <p className="font-medium">{result.data.pricePerSession} ج.م</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}