'use client'

import { useState, useRef, useEffect } from 'react'

interface SearchResult {
  type: 'member' | 'pt'
  data: any
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'members' | 'phone'>('members')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Auto-focus عند تحميل الصفحة
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // إنشاء صوت تنبيه قوي وواضح
  const playSound = (isSuccess: boolean) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      if (isSuccess) {
        // صوت نجاح: نغمتين متتاليتين عاليتين (دو - صول)
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1) // G5
        gainNode.gain.setValueAtTime(0.7, ctx.currentTime) // حجم أعلى
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.3)
      } else {
        // صوت فشل: نغمة منخفضة
        oscillator.frequency.setValueAtTime(200, ctx.currentTime)
        gainNode.gain.setValueAtTime(0.7, ctx.currentTime) // حجم أعلى
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.5)
      }
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      playSound(false)
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
      setLastSearchTime(new Date())

      // تشغيل صوت حسب النتيجة
      if (foundResults.length > 0) {
        playSound(true) // صوت نجاح
      } else {
        playSound(false) // صوت فشل
      }

      // مسح الحقل وإعادة التركيز بعد 2 ثانية
      setTimeout(() => {
        setSearchTerm('')
        setResults([])
        setSearched(false)
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 2000)

    } catch (error) {
      console.error('Search error:', error)
      playSound(false)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const calculateRemainingDays = (expiryDate: string | null | undefined): number | null => {
    if (!expiryDate) return null
    
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  return (
    <div className="container mx-auto p-6 min-h-screen" dir="rtl">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <span>🔍</span>
          <span>التحقق السريع من الاشتراكات</span>
        </h1>
        <p className="text-gray-600">سكان سريع - الصوت يؤكد النتيجة تلقائياً</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg mb-6 border-4 border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* حقل البحث - أكبر وأوضح */}
          <div className="md:col-span-3">
            <label className="block text-lg font-bold mb-3 text-blue-800">
              📱 أدخل رقم العضوية أو الهاتف أو الاسم
            </label>
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-6 py-5 border-4 border-blue-300 rounded-xl text-3xl font-bold text-center focus:border-blue-600 focus:ring-4 focus:ring-blue-200 transition"
              placeholder="اسكن أو اكتب هنا..."
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-lg font-bold mb-3 text-blue-800">نوع البحث</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="w-full px-4 py-5 border-4 border-blue-300 rounded-xl text-xl font-bold focus:border-blue-600"
            >
              <option value="members">أعضاء فقط</option>
              <option value="all">بحث شامل</option>
              <option value="phone">بحث بالهاتف</option>
            </select>
          </div>
        </div>

        {/* معلومات مساعدة */}
        <div className="bg-blue-50 border-r-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💡</span>
            <div>
              <p className="font-bold text-blue-800">نصائح الاستخدام:</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• اسكن الباركود أو اكتب رقم العضوية واضغط Enter</li>
                <li>• صوت عالي = تم العثور على العضو ✅</li>
                <li>• صوت منخفض = لم يتم العثور ❌</li>
                <li>• الحقل يُمسح تلقائياً بعد ثانيتين للسكان التالي</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* عرض آخر عملية بحث */}
      {lastSearchTime && (
        <div className="bg-gray-100 p-3 rounded-lg text-center text-sm text-gray-600 mb-4">
          آخر بحث: {lastSearchTime.toLocaleTimeString('ar-EG')}
        </div>
      )}

      {/* نتائج البحث */}
      {searched && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-green-200 animate-fadeIn">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
              <p className="text-2xl text-gray-600 font-bold">جاري البحث...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 bg-red-50">
              <div className="text-8xl mb-6">❌</div>
              <p className="text-3xl font-bold text-red-600 mb-3">لم يتم العثور على نتائج</p>
              <p className="text-xl text-red-500">للبحث عن "{searchTerm}"</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="bg-green-100 border-4 border-green-500 rounded-xl p-6 mb-6 text-center">
                <div className="text-8xl mb-4">✅</div>
                <p className="text-3xl font-bold text-green-800">تم العثور على {results.length} نتيجة</p>
              </div>
              
              <div className="space-y-6">
                {results.map((result, index) => (
                  <div key={index} className="border-4 border-blue-200 rounded-2xl p-6 hover:bg-blue-50 transition">
                    {result.type === 'member' && (
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="bg-blue-500 text-white px-4 py-2 rounded-lg text-lg font-bold">
                              👤 عضو
                            </span>
                            <h3 className="text-3xl font-bold mt-3">{result.data.name}</h3>
                          </div>
                          <span className="text-5xl font-bold text-blue-600">
                            #{result.data.memberNumber}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">الهاتف</p>
                            <p className="text-xl font-bold">{result.data.phone}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">السعر</p>
                            <p className="text-xl font-bold">{result.data.subscriptionPrice} ج.م</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">المتبقي</p>
                            <p className="text-xl font-bold text-red-600">{result.data.remainingAmount} ج.م</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">الحالة</p>
                            <span className={`inline-block px-3 py-1 rounded-lg text-lg font-bold ${
                              result.data.isActive && (!result.data.expiryDate || new Date(result.data.expiryDate) >= new Date())
                                ? 'bg-green-500 text-white' 
                                : 'bg-red-500 text-white'
                            }`}>
                              {result.data.isActive && (!result.data.expiryDate || new Date(result.data.expiryDate) >= new Date()) ? '✅ نشط' : '❌ منتهي'}
                            </span>
                          </div>
                        </div>

                        {result.data.expiryDate && (
                          <div className="mt-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">تاريخ الانتهاء</p>
                                <p className="text-xl font-bold text-gray-800">
                                  {new Date(result.data.expiryDate).toLocaleDateString('ar-EG')}
                                </p>
                              </div>
                              {(() => {
                                const days = calculateRemainingDays(result.data.expiryDate)
                                if (days === null) return null
                                
                                if (days < 0) {
                                  return (
                                    <div className="text-right">
                                      <p className="text-red-600 font-bold text-2xl">
                                        ❌ منتهي منذ {Math.abs(days)} يوم
                                      </p>
                                    </div>
                                  )
                                } else if (days <= 7) {
                                  return (
                                    <div className="text-right">
                                      <p className="text-orange-600 font-bold text-2xl">
                                        ⚠️ باقي {days} يوم فقط
                                      </p>
                                    </div>
                                  )
                                } else {
                                  return (
                                    <div className="text-right">
                                      <p className="text-green-600 font-bold text-2xl">
                                        ✅ باقي {days} يوم
                                      </p>
                                    </div>
                                  )
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {result.type === 'pt' && (
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="bg-green-500 text-white px-4 py-2 rounded-lg text-lg font-bold">
                              💪 PT
                            </span>
                            <h3 className="text-3xl font-bold mt-3">{result.data.clientName}</h3>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">الهاتف</p>
                            <p className="text-xl font-bold">{result.data.phone}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">المدرب</p>
                            <p className="text-xl font-bold">{result.data.coachName}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">الجلسات المتبقية</p>
                            <p className="text-xl font-bold text-green-600">{result.data.sessionsRemaining}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">سعر الجلسة</p>
                            <p className="text-xl font-bold">{result.data.pricePerSession} ج.م</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}