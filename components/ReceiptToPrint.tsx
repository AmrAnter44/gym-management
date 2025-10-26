'use client'

import React from 'react'
import { printReceiptFromData } from '../lib/printSystem'

interface ReceiptProps {
  receiptNumber: number
  type: string
  amount: number
  details: any
  date: Date
  paymentMethod?: string
  onClose: () => void
}

export function ReceiptToPrint({ receiptNumber, type, amount, details, date, paymentMethod, onClose }: ReceiptProps) {
  const handlePrint = () => {
    printReceiptFromData(
      receiptNumber,
      type,
      amount,
      details,
      date,
      paymentMethod || details.paymentMethod || 'cash'
    )
  }

  // طباعة تلقائية عند التحميل
  React.useEffect(() => {
    const timer = setTimeout(() => {
      handlePrint()
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 no-print">
      <div className="bg-white rounded-2xl p-6 max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">طباعة الإيصال</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl font-light transition"
          >
            ×
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-center text-gray-600">
            <div className="text-5xl mb-3">🖨️</div>
            <p className="font-medium">إيصال رقم <span className="text-blue-600">#{receiptNumber}</span></p>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handlePrint}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium text-lg shadow-md hover:shadow-lg"
          >
            🖨️ طباعة
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            إغلاق
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>💡 تأكد من تشغيل الطابعة قبل الطباعة</p>
        </div>
      </div>
    </div>
  )
}