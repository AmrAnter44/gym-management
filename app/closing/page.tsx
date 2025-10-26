'use client'

import { useEffect, useState } from 'react'

interface DailyData {
  date: string
  floor: number
  pt: number
  expenses: number
  expenseDetails: string
  visa: number
  instapay: number
  cash: number
  wallet: number
  staffLoans: { [key: string]: number }
  receipts: any[] // تفاصيل الإيصالات
  expensesList: any[] // تفاصيل المصروفات
}

interface Staff {
  id: string
  name: string
}

export default function ClosingPage() {
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'custom'>('month')
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  
  // فلاتر التاريخ المخصص
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [customTimeFrom, setCustomTimeFrom] = useState('00:00')
  const [customTimeTo, setCustomTimeTo] = useState('23:59')
  
  const [totals, setTotals] = useState({
    floor: 0,
    pt: 0,
    expenses: 0,
    visa: 0,
    instapay: 0,
    cash: 0,
    wallet: 0,
    totalRevenue: 0,
    netProfit: 0
  })

  const fetchData = async () => {
    try {
      setLoading(true)

      // جلب الموظفين
      const staffRes = await fetch('/api/staff')
      const staff = await staffRes.json()
      setStaffList(staff)

      // جلب الإيصالات
      const receiptsRes = await fetch('/api/receipts')
      const receipts = await receiptsRes.json()

      // جلب المصاريف
      const expensesRes = await fetch('/api/expenses')
      const expenses = await expensesRes.json()

      // تطبيق الفلتر الزمني
      const now = new Date()
      const filterDate = (dateString: string) => {
        const d = new Date(dateString)
        
        if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return d >= weekAgo
        } else if (dateFilter === 'month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        } else if (dateFilter === 'custom' && customDateFrom && customDateTo) {
          const fromDateTime = new Date(`${customDateFrom}T${customTimeFrom}:00`)
          const toDateTime = new Date(`${customDateTo}T${customTimeTo}:59`)
          return d >= fromDateTime && d <= toDateTime
        }
        return true
      }

      const filteredReceipts = receipts.filter((r: any) => filterDate(r.createdAt))
      const filteredExpenses = expenses.filter((e: any) => filterDate(e.createdAt))

      // تجميع البيانات حسب اليوم
      const dailyMap: { [key: string]: DailyData } = {}

      filteredReceipts.forEach((receipt: any) => {
        const date = new Date(receipt.createdAt).toISOString().split('T')[0]
        
        if (!dailyMap[date]) {
          dailyMap[date] = {
            date,
            floor: 0,
            pt: 0,
            expenses: 0,
            expenseDetails: '',
            visa: 0,
            instapay: 0,
            cash: 0,
            wallet: 0,
            staffLoans: {},
            receipts: [],
            expensesList: []
          }
        }

        // إضافة الإيصال للتفاصيل
        dailyMap[date].receipts.push(receipt)

        // تصنيف حسب نوع الإيصال
        if (receipt.type === 'Member') {
          dailyMap[date].floor += receipt.amount
        } else if (receipt.type === 'PT') {
          dailyMap[date].pt += receipt.amount
        }

        // تصنيف حسب طريقة الدفع
        const paymentMethod = receipt.paymentMethod || 'cash'
        if (paymentMethod === 'visa') {
          dailyMap[date].visa += receipt.amount
        } else if (paymentMethod === 'instapay') {
          dailyMap[date].instapay += receipt.amount
        } else if (paymentMethod === 'wallet') {
          dailyMap[date].wallet += receipt.amount
        } else {
          dailyMap[date].cash += receipt.amount
        }
      })

      filteredExpenses.forEach((expense: any) => {
        const date = new Date(expense.createdAt).toISOString().split('T')[0]
        
        if (!dailyMap[date]) {
          dailyMap[date] = {
            date,
            floor: 0,
            pt: 0,
            expenses: 0,
            expenseDetails: '',
            visa: 0,
            instapay: 0,
            cash: 0,
            wallet: 0,
            staffLoans: {},
            receipts: [],
            expensesList: []
          }
        }

        // إضافة المصروف للتفاصيل
        dailyMap[date].expensesList.push(expense)

        dailyMap[date].expenses += expense.amount
        
        if (expense.type === 'staff_loan' && expense.staff) {
          const staffName = expense.staff.name
          if (!dailyMap[date].staffLoans[staffName]) {
            dailyMap[date].staffLoans[staffName] = 0
          }
          dailyMap[date].staffLoans[staffName] += expense.amount
        }

        if (dailyMap[date].expenseDetails) {
          dailyMap[date].expenseDetails += ' + '
        }
        dailyMap[date].expenseDetails += `${expense.amount}${expense.description}`
      })

      const sortedData = Object.values(dailyMap).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      setDailyData(sortedData)

      // حساب الإجماليات
      const newTotals = sortedData.reduce((acc, day) => {
        acc.floor += day.floor
        acc.pt += day.pt
        acc.expenses += day.expenses
        acc.visa += day.visa
        acc.instapay += day.instapay
        acc.cash += day.cash
        acc.wallet += day.wallet
        return acc
      }, {
        floor: 0,
        pt: 0,
        expenses: 0,
        visa: 0,
        instapay: 0,
        cash: 0,
        wallet: 0,
        totalRevenue: 0,
        netProfit: 0
      })

      newTotals.totalRevenue = newTotals.floor + newTotals.pt
      newTotals.netProfit = newTotals.totalRevenue - newTotals.expenses

      setTotals(newTotals)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [dateFilter, customDateFrom, customDateTo, customTimeFrom, customTimeTo])

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    alert('سيتم تفعيل التصدير لـ Excel قريباً')
  }

  const toggleDayDetails = (date: string) => {
    setExpandedDay(expandedDay === date ? null : date)
  }

  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'Member': 'عضوية',
      'PT': 'تدريب شخصي',
      'DayUse': 'يوم استخدام',
      'InBody': 'InBody'
    }
    return types[type] || type
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods: { [key: string]: string } = {
      'cash': 'كاش 💵',
      'visa': 'فيزا 💳',
      'instapay': 'إنستاباي 📱',
      'wallet': 'محفظة 💰'
    }
    return methods[method] || 'كاش 💵'
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6 no-print">
        <h1 className="text-3xl font-bold mb-2">💰 التقفيل المالي التفصيلي</h1>
        <p className="text-gray-600">تقرير يومي شامل مع تفصيل كل العمليات</p>
      </div>

      {/* Controls */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md no-print">
        <div className="space-y-4">
          {/* نوع الفلتر */}
          <div>
            <label className="block text-sm font-medium mb-2">📅 نوع الفترة</label>
            <div className="flex gap-2">
              {(['week', 'month', 'custom'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`px-4 py-2 rounded-lg transition ${
                    dateFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filter === 'week' && '📅 آخر أسبوع'}
                  {filter === 'month' && '📆 هذا الشهر'}
                  {filter === 'custom' && '🔧 فترة مخصصة'}
                </button>
              ))}
            </div>
          </div>

          {/* فلتر مخصص */}
          {dateFilter === 'custom' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span>🔧</span>
                <span>تحديد الفترة الزمنية</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* من */}
                <div>
                  <label className="block text-sm font-medium mb-2">📍 من التاريخ</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-lg font-mono"
                  />
                  <label className="block text-sm font-medium mt-2 mb-2">⏰ الساعة</label>
                  <input
                    type="time"
                    value={customTimeFrom}
                    onChange={(e) => setCustomTimeFrom(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-lg font-mono"
                  />
                </div>

                {/* إلى */}
                <div>
                  <label className="block text-sm font-medium mb-2">📍 إلى التاريخ</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-lg font-mono"
                  />
                  <label className="block text-sm font-medium mt-2 mb-2">⏰ الساعة</label>
                  <input
                    type="time"
                    value={customTimeTo}
                    onChange={(e) => setCustomTimeTo(e.target.value)}
                    className="w-full px-3 py-2 border-2 rounded-lg font-mono"
                  />
                </div>
              </div>

              {customDateFrom && customDateTo && (
                <div className="mt-3 bg-white border-2 border-blue-300 rounded-lg p-3">
                  <p className="text-sm">
                    <strong>📊 الفترة المحددة:</strong>
                    <br />
                    من: {new Date(`${customDateFrom}T${customTimeFrom}`).toLocaleString('ar-EG')}
                    <br />
                    إلى: {new Date(`${customDateTo}T${customTimeTo}`).toLocaleString('ar-EG')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              🖨️ طباعة
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              📊 تصدير Excel
            </button>
            <button
              onClick={fetchData}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              🔄 تحديث
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin text-6xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">جاري التحميل...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="text-center mb-6 print-only" style={{ display: 'none' }}>
            <h1 className="text-3xl font-bold mb-2">X - GYM</h1>
            <p className="text-lg text-gray-600">التقفيل المالي التفصيلي</p>
            {dateFilter === 'custom' && customDateFrom && customDateTo && (
              <p className="text-sm text-gray-600">
                من {new Date(`${customDateFrom}T${customTimeFrom}`).toLocaleString('ar-EG')} 
                إلى {new Date(`${customDateTo}T${customTimeTo}`).toLocaleString('ar-EG')}
              </p>
            )}
          </div>

          {/* Summary Cards - No Print */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 no-print">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg shadow-lg">
              <p className="text-sm opacity-90">إجمالي الإيرادات</p>
              <p className="text-3xl font-bold">{totals.totalRevenue.toFixed(0)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-lg shadow-lg">
              <p className="text-sm opacity-90">إجمالي المصروفات</p>
              <p className="text-3xl font-bold">{totals.expenses.toFixed(0)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
              <p className="text-sm opacity-90">صافي الربح</p>
              <p className="text-3xl font-bold">{totals.netProfit.toFixed(0)}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
              <p className="text-sm opacity-90">عدد الأيام</p>
              <p className="text-3xl font-bold">{dailyData.length}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg shadow-lg">
              <p className="text-sm opacity-90">متوسط اليوم</p>
              <p className="text-3xl font-bold">
                {dailyData.length > 0 ? (totals.totalRevenue / dailyData.length).toFixed(0) : 0}
              </p>
            </div>
          </div>

          {/* Payment Methods Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
            <div className="bg-white border-2 border-green-300 p-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">كاش 💵</p>
                  <p className="text-2xl font-bold text-green-600">{totals.cash.toFixed(0)}</p>
                </div>
                <span className="text-4xl">💵</span>
              </div>
            </div>
            <div className="bg-white border-2 border-blue-300 p-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">فيزا 💳</p>
                  <p className="text-2xl font-bold text-blue-600">{totals.visa.toFixed(0)}</p>
                </div>
                <span className="text-4xl">💳</span>
              </div>
            </div>
            <div className="bg-white border-2 border-purple-300 p-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إنستاباي 📱</p>
                  <p className="text-2xl font-bold text-purple-600">{totals.instapay.toFixed(0)}</p>
                </div>
                <span className="text-4xl">📱</span>
              </div>
            </div>
            <div className="bg-white border-2 border-orange-300 p-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">محفظة 💰</p>
                  <p className="text-2xl font-bold text-orange-600">{totals.wallet.toFixed(0)}</p>
                </div>
                <span className="text-4xl">💰</span>
              </div>
            </div>
          </div>

          {/* Excel-like Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-x-auto mb-6">
            <table className="w-full border-collapse text-sm excel-table">
              <thead>
                <tr className="bg-gray-200 border-2 border-gray-400">
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold">التاريخ</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-blue-100">Floor</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-green-100">PT</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-green-50">كاش 💵</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-blue-50">فيزا 💳</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-purple-50">إنستاباي 📱</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-orange-50">محفظة 💰</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-orange-100">مصاريف</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold min-w-[300px]">تفاصيل المصاريف</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-yellow-50">السلف</th>
                  {staffList.map(staff => (
                    <th key={staff.id} className="border border-gray-400 px-3 py-2 text-center font-bold bg-red-50 min-w-[80px]">
                      {staff.name}
                    </th>
                  ))}
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold no-print">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.map((day, index) => (
                  <>
                    <tr 
                      key={day.date} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} cursor-pointer hover:bg-blue-50`}
                      onClick={() => toggleDayDetails(day.date)}
                    >
                      <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                        {new Date(day.date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-bold text-blue-600">
                        {day.floor > 0 ? day.floor.toFixed(0) : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-bold text-green-600">
                        {day.pt > 0 ? day.pt.toFixed(0) : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-bold text-green-700">
                        {day.cash > 0 ? day.cash.toFixed(0) : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-bold text-blue-700">
                        {day.visa > 0 ? day.visa.toFixed(0) : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-bold text-purple-700">
                        {day.instapay > 0 ? day.instapay.toFixed(0) : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-bold text-orange-700">
                        {day.wallet > 0 ? day.wallet.toFixed(0) : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-bold text-red-600">
                        {day.expenses > 0 ? day.expenses.toFixed(0) : '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-xs">
                        {day.expenseDetails || '-'}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right font-bold text-orange-600">
                        {Object.values(day.staffLoans).reduce((a, b) => a + b, 0).toFixed(0) || '-'}
                      </td>
                      {staffList.map(staff => (
                        <td key={staff.id} className="border border-gray-300 px-3 py-2 text-right text-red-600">
                          {day.staffLoans[staff.name] ? day.staffLoans[staff.name].toFixed(0) : '-'}
                        </td>
                      ))}
                      <td className="border border-gray-300 px-3 py-2 text-center no-print">
                        <button className="text-blue-600 hover:text-blue-800 font-bold">
                          {expandedDay === day.date ? '▼ إخفاء' : '▶ عرض'}
                        </button>
                      </td>
                    </tr>

                    {/* تفاصيل اليوم */}
                    {expandedDay === day.date && (
                      <tr className="bg-blue-50 no-print">
                        <td colSpan={staffList.length + 12} className="border border-gray-400 p-4">
                          <div className="space-y-4">
                            {/* الإيصالات */}
                            {day.receipts.length > 0 && (
                              <div>
                                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                                  <span>🧾</span>
                                  <span>الإيصالات ({day.receipts.length})</span>
                                </h4>
                                <div className="bg-white rounded-lg overflow-hidden border-2 border-blue-200">
                                  <table className="w-full text-sm">
                                    <thead className="bg-blue-100">
                                      <tr>
                                        <th className="px-3 py-2 text-right">الوقت</th>
                                        <th className="px-3 py-2 text-right">رقم الإيصال</th>
                                        <th className="px-3 py-2 text-right">النوع</th>
                                        <th className="px-3 py-2 text-right">التفاصيل</th>
                                        <th className="px-3 py-2 text-right">المبلغ</th>
                                        <th className="px-3 py-2 text-right">طريقة الدفع</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {day.receipts.map((receipt: any) => {
                                        const details = JSON.parse(receipt.itemDetails)
                                        return (
                                          <tr key={receipt.id} className="border-t hover:bg-blue-50">
                                            <td className="px-3 py-2 font-mono text-xs">
                                              {new Date(receipt.createdAt).toLocaleTimeString('ar-EG')}
                                            </td>
                                            <td className="px-3 py-2 font-bold text-green-600">
                                              #{receipt.receiptNumber}
                                            </td>
                                            <td className="px-3 py-2">
                                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                {getTypeLabel(receipt.type)}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2">
                                              {details.memberName && (
                                                <div>
                                                  {details.memberName}
                                                  {details.memberNumber && (
                                                    <span className="text-xs text-gray-600"> (#{details.memberNumber})</span>
                                                  )}
                                                </div>
                                              )}
                                              {details.clientName && <div>{details.clientName}</div>}
                                              {details.name && <div>{details.name}</div>}
                                            </td>
                                            <td className="px-3 py-2 font-bold text-green-600">
                                              {receipt.amount} ج.م
                                            </td>
                                            <td className="px-3 py-2">
                                              <span className="text-xs">
                                                {getPaymentMethodLabel(receipt.paymentMethod)}
                                              </span>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* المصروفات */}
                            {day.expensesList.length > 0 && (
                              <div>
                                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                                  <span>💸</span>
                                  <span>المصروفات ({day.expensesList.length})</span>
                                </h4>
                                <div className="bg-white rounded-lg overflow-hidden border-2 border-red-200">
                                  <table className="w-full text-sm">
                                    <thead className="bg-red-100">
                                      <tr>
                                        <th className="px-3 py-2 text-right">الوقت</th>
                                        <th className="px-3 py-2 text-right">النوع</th>
                                        <th className="px-3 py-2 text-right">الوصف</th>
                                        <th className="px-3 py-2 text-right">الموظف</th>
                                        <th className="px-3 py-2 text-right">المبلغ</th>
                                        <th className="px-3 py-2 text-right">الحالة</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {day.expensesList.map((expense: any) => (
                                        <tr key={expense.id} className="border-t hover:bg-red-50">
                                          <td className="px-3 py-2 font-mono text-xs">
                                            {new Date(expense.createdAt).toLocaleTimeString('ar-EG')}
                                          </td>
                                          <td className="px-3 py-2">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                              expense.type === 'gym_expense' 
                                                ? 'bg-orange-100 text-orange-800' 
                                                : 'bg-purple-100 text-purple-800'
                                            }`}>
                                              {expense.type === 'gym_expense' ? 'مصروف جيم' : 'سلفة'}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2">{expense.description}</td>
                                          <td className="px-3 py-2">
                                            {expense.staff ? expense.staff.name : '-'}
                                          </td>
                                          <td className="px-3 py-2 font-bold text-red-600">
                                            {expense.amount} ج.م
                                          </td>
                                          <td className="px-3 py-2">
                                            {expense.type === 'staff_loan' && (
                                              <span className={`px-2 py-1 rounded text-xs ${
                                                expense.isPaid 
                                                  ? 'bg-green-100 text-green-800' 
                                                  : 'bg-red-100 text-red-800'
                                              }`}>
                                                {expense.isPaid ? '✅ مدفوعة' : '❌ غير مدفوعة'}
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
                
                {/* Totals Row */}
                <tr className="bg-yellow-100 border-t-4 border-yellow-600 font-bold">
                  <td className="border border-gray-400 px-3 py-3 text-center">الإجمالي</td>
                  <td className="border border-gray-400 px-3 py-3 text-right text-blue-700 text-lg">
                    {totals.floor.toFixed(0)}
                  </td>
                  <td className="border border-gray-400 px-3 py-3 text-right text-green-700 text-lg">
                    {totals.pt.toFixed(0)}
                  </td>
                  <td className="border border-gray-400 px-3 py-3 text-right text-green-800 text-lg">
                    {totals.cash.toFixed(0)}
                  </td>
                  <td className="border border-gray-400 px-3 py-3 text-right text-blue-800 text-lg">
                    {totals.visa.toFixed(0)}
                  </td>
                  <td className="border border-gray-400 px-3 py-3 text-right text-purple-800 text-lg">
                    {totals.instapay.toFixed(0)}
                  </td>
                  <td className="border border-gray-400 px-3 py-3 text-right text-orange-800 text-lg">
                    {totals.wallet.toFixed(0)}
                  </td>
                  <td className="border border-gray-400 px-3 py-3 text-right text-red-700 text-lg">
                    {totals.expenses.toFixed(0)}
                  </td>
                  <td className="border border-gray-400 px-3 py-3"></td>
                  <td className="border border-gray-400 px-3 py-3 text-right text-orange-700 text-lg">
                    {dailyData.reduce((sum, day) => 
                      sum + Object.values(day.staffLoans).reduce((a, b) => a + b, 0), 0
                    ).toFixed(0)}
                  </td>
                  {staffList.map(staff => {
                    const total = dailyData.reduce((sum, day) => 
                      sum + (day.staffLoans[staff.name] || 0), 0
                    )
                    return (
                      <td key={staff.id} className="border border-gray-400 px-3 py-3 text-right text-red-700">
                        {total > 0 ? total.toFixed(0) : '-'}
                      </td>
                    )
                  })}
                  <td className="border border-gray-400 px-3 py-3 no-print"></td>
                </tr>

                {/* Net Profit Row */}
                <tr className="bg-green-100 border-t-2 border-green-600 font-bold">
                  <td colSpan={3} className="border border-gray-400 px-3 py-3 text-center text-lg">
                    صافي الربح
                  </td>
                  <td colSpan={staffList.length + 9} className="border border-gray-400 px-3 py-3 text-right text-2xl text-green-700">
                    {totals.netProfit.toFixed(0)} ج.م
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .excel-table {
            font-size: 10px;
          }
          .excel-table th,
          .excel-table td {
            padding: 4px 6px !important;
          }
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
        
        .excel-table {
          font-family: 'Arial', sans-serif;
        }
        
        .excel-table th {
          background-color: #e5e7eb;
          font-weight: 700;
        }
        
        .excel-table td,
        .excel-table th {
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
