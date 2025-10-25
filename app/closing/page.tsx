'use client'

import { useEffect, useState } from 'react'

interface DailyData {
  date: string
  floor: number
  pt: number
  dayuse: number
  expenses: number
  expenseDetails: string
  visa: number
  instapay: number
  cash: number
  staffLoans: { [key: string]: number }
}

interface Staff {
  id: string
  name: string
}

export default function ClosingPage() {
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'all'>('month')
  const [totals, setTotals] = useState({
    floor: 0,
    pt: 0,
    dayuse: 0,
    expenses: 0,
    visa: 0,
    instapay: 0,
    cash: 0,
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
      const filterDate = (date: string) => {
        const d = new Date(date)
        if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return d >= weekAgo
        } else if (dateFilter === 'month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
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
            dayuse: 0,
            expenses: 0,
            expenseDetails: '',
            visa: 0,
            instapay: 0,
            cash: 0,
            staffLoans: {}
          }
        }

        if (receipt.type === 'Member') {
          dailyMap[date].floor += receipt.amount
        } else if (receipt.type === 'PT') {
          dailyMap[date].pt += receipt.amount
        } else if (receipt.type === 'DayUse' || receipt.type === 'InBody') {
          dailyMap[date].dayuse += receipt.amount
        }

        dailyMap[date].cash += receipt.amount
      })

      filteredExpenses.forEach((expense: any) => {
        const date = new Date(expense.createdAt).toISOString().split('T')[0]
        
        if (!dailyMap[date]) {
          dailyMap[date] = {
            date,
            floor: 0,
            pt: 0,
            dayuse: 0,
            expenses: 0,
            expenseDetails: '',
            visa: 0,
            instapay: 0,
            cash: 0,
            staffLoans: {}
          }
        }

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
        acc.dayuse += day.dayuse
        acc.expenses += day.expenses
        acc.cash += day.cash
        return acc
      }, {
        floor: 0,
        pt: 0,
        dayuse: 0,
        expenses: 0,
        visa: 0,
        instapay: 0,
        cash: 0,
        totalRevenue: 0,
        netProfit: 0
      })

      newTotals.totalRevenue = newTotals.floor + newTotals.pt + newTotals.dayuse
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
  }, [dateFilter])

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    // سنضيف هذه الوظيفة بعد قليل
    alert('سيتم تفعيل التصدير لـ Excel قريباً')
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6 no-print">
        <h1 className="text-3xl font-bold mb-2">💰 التقفيل المالي التفصيلي</h1>
        <p className="text-gray-600">تقرير يومي شامل على طريقة Excel</p>
      </div>

      {/* Controls */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md no-print">
        <div className="flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium mb-2">📅 الفترة</label>
            <div className="flex gap-2">
              {(['week', 'month', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`px-4 py-2 rounded-lg transition ${
                    dateFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filter === 'week' && 'آخر أسبوع'}
                  {filter === 'month' && 'هذا الشهر'}
                  {filter === 'all' && 'كل الفترات'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1"></div>

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
          </div>

          {/* Summary Cards - No Print */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 no-print">
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
          </div>

          {/* Excel-like Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
            <table className="w-full border-collapse text-sm excel-table">
              <thead>
                <tr className="bg-gray-200 border-2 border-gray-400">
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold">التاريخ</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-blue-100">Floor</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-green-100">PT</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-purple-100">DayUse</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-orange-100">مصاريف</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold min-w-[300px]">تفاصيل المصاريف</th>
                  <th className="border border-gray-400 px-3 py-2 text-center font-bold bg-yellow-50">السلف</th>
                  {staffList.map(staff => (
                    <th key={staff.id} className="border border-gray-400 px-3 py-2 text-center font-bold bg-red-50 min-w-[80px]">
                      {staff.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dailyData.map((day, index) => (
                  <tr key={day.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                      {new Date(day.date).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-bold text-blue-600">
                      {day.floor > 0 ? day.floor.toFixed(0) : '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-bold text-green-600">
                      {day.pt > 0 ? day.pt.toFixed(0) : '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-bold text-purple-600">
                      {day.dayuse > 0 ? day.dayuse.toFixed(0) : '-'}
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
                  </tr>
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
                  <td className="border border-gray-400 px-3 py-3 text-right text-purple-700 text-lg">
                    {totals.dayuse.toFixed(0)}
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
                </tr>

                {/* Net Profit Row */}
                <tr className="bg-green-100 border-t-2 border-green-600 font-bold">
                  <td colSpan={4} className="border border-gray-400 px-3 py-3 text-center text-lg">
                    صافي الربح
                  </td>
                  <td colSpan={staffList.length + 3} className="border border-gray-400 px-3 py-3 text-right text-2xl text-green-700">
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