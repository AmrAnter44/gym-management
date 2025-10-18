'use client'

import React from 'react'

interface ReceiptProps {
  receiptNumber: number
  type: string
  amount: number
  details: any
  date: Date
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ receiptNumber, type, amount, details, date }, ref) => {
    return (
      <div ref={ref} className="p-8 bg-white text-black max-w-md mx-auto" dir="rtl">
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-2xl font-bold">صالة الرياضة</h1>
          <p className="text-sm">إيصال استلام</p>
        </div>

        <div className="mb-4 space-y-2">
          <div className="flex justify-between">
            <span className="font-semibold">رقم الإيصال:</span>
            <span>#{receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">التاريخ:</span>
            <span>{new Date(date).toLocaleDateString('ar-EG')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">النوع:</span>
            <span>{type}</span>
          </div>
        </div>

        <div className="border-t-2 border-b-2 border-black py-4 my-4">
          <h3 className="font-bold mb-2">التفاصيل:</h3>
          {details.memberName && (
            <p>الاسم: {details.memberName}</p>
          )}
          {details.clientName && (
            <p>الاسم: {details.clientName}</p>
          )}
          {details.subscriptionPrice && (
            <p>سعر الاشتراك: {details.subscriptionPrice} جنيه</p>
          )}
          {details.sessionsPurchased && (
            <p>عدد الجلسات: {details.sessionsPurchased}</p>
          )}
          {details.serviceType && (
            <p>نوع الخدمة: {details.serviceType}</p>
          )}
          {details.paidAmount !== undefined && (
            <p>المبلغ المدفوع: {details.paidAmount} جنيه</p>
          )}
          {details.remainingAmount > 0 && (
            <p className="text-red-600">المتبقي: {details.remainingAmount} جنيه</p>
          )}
        </div>

        <div className="flex justify-between items-center text-lg font-bold">
          <span>الإجمالي:</span>
          <span>{amount} جنيه</span>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>شكراً لك</p>
          <p>نتمنى لك تمريناً ممتعاً</p>
        </div>
      </div>
    )
  }
)

Receipt.displayName = 'Receipt'