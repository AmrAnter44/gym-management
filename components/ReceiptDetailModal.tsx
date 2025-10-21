'use client'

import { printReceiptFromData } from '../lib/printSystem'

interface ReceiptDetailModalProps {
  receipt: {
    receiptNumber: number
    type: string
    amount: number
    itemDetails: string
    createdAt: string
  }
  onClose: () => void
}

export function ReceiptDetailModal({ receipt, onClose }: ReceiptDetailModalProps) {
  const details = JSON.parse(receipt.itemDetails)
  
  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'Member': 'اشتراك عضوية',
      'PT': 'تدريب شخصي',
      'DayUse': 'يوم استخدام',
      'InBody': 'فحص InBody'
    }
    return types[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'Member': 'from-blue-500 to-blue-600',
      'PT': 'from-green-500 to-green-600',
      'DayUse': 'from-purple-500 to-purple-600',
      'InBody': 'from-orange-500 to-orange-600'
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }

  const handlePrint = () => {
    printReceiptFromData(
      receipt.receiptNumber,
      receipt.type,
      receipt.amount,
      details,
      receipt.createdAt
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${getTypeColor(receipt.type)} text-white p-6 rounded-t-2xl`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">تفاصيل الإيصال</h2>
              <p className="text-sm opacity-90">{getTypeLabel(receipt.type)}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full w-10 h-10 flex items-center justify-center transition text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90 mb-1">رقم الإيصال</p>
                <p className="text-3xl font-bold">#{receipt.receiptNumber}</p>
              </div>
              <div className="text-6xl">🧾</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Member Number */}
          {details.memberNumber && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 mb-1">رقم العضوية</p>
                  <p className="text-3xl font-bold text-blue-600">#{details.memberNumber}</p>
                </div>
                <div className="text-5xl">👤</div>
              </div>
            </div>
          )}

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {details.memberName && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">اسم العضو</p>
                <p className="text-lg font-bold text-gray-800">{details.memberName}</p>
              </div>
            )}
            
            {details.clientName && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">اسم العميل</p>
                <p className="text-lg font-bold text-gray-800">{details.clientName}</p>
              </div>
            )}
            
            {details.name && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">الاسم</p>
                <p className="text-lg font-bold text-gray-800">{details.name}</p>
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="border-t-2 pt-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>📋</span>
              <span>تفاصيل الخدمة</span>
            </h3>
            
            <div className="space-y-2">
              {details.subscriptionPrice && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">سعر الاشتراك</span>
                  <span className="font-bold">{details.subscriptionPrice} ج.م</span>
                </div>
              )}
              
              {details.sessionsPurchased && (
                <>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">عدد الجلسات</span>
                    <span className="font-bold">{details.sessionsPurchased} جلسة</span>
                  </div>
                  {details.pricePerSession && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">سعر الجلسة</span>
                      <span className="font-bold">{details.pricePerSession} ج.م</span>
                    </div>
                  )}
                </>
              )}
              
              {details.coachName && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">اسم المدرب</span>
                  <span className="font-bold">{details.coachName}</span>
                </div>
              )}
              
              {details.staffName && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">اسم الموظف</span>
                  <span className="font-bold">{details.staffName}</span>
                </div>
              )}
              
              {details.serviceType && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">نوع الخدمة</span>
                  <span className="font-bold">
                    {details.serviceType === 'DayUse' ? 'يوم استخدام' : 'InBody'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t-2 pt-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>💰</span>
              <span>تفاصيل الدفع</span>
            </h3>
            
            <div className="space-y-2">
              {details.paidAmount !== undefined && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">المبلغ المدفوع</span>
                  <span className="font-bold text-green-600">{details.paidAmount} ج.م</span>
                </div>
              )}
              
              {details.remainingAmount !== undefined && details.remainingAmount > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">المبلغ المتبقي</span>
                  <span className="font-bold text-red-600">{details.remainingAmount} ج.م</span>
                </div>
              )}
              
              <div className="flex justify-between py-3 bg-green-50 px-3 rounded-lg mt-2">
                <span className="font-bold text-gray-800">الإجمالي</span>
                <span className="font-bold text-2xl text-green-600">{receipt.amount} ج.م</span>
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">تاريخ الإصدار</p>
            <p className="text-lg font-bold text-gray-800">
              {new Date(receipt.createdAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>🖨️</span>
            <span>طباعة الإيصال</span>
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  )
}