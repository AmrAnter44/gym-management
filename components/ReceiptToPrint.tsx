'use client'

import React from 'react'

interface ReceiptProps {
  receiptNumber: number
  type: string
  amount: number
  details: any
  date: Date
  onClose: () => void
}

export function ReceiptToPrint({ receiptNumber, type, amount, details, date, onClose }: ReceiptProps) {
  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'Member': 'اشتراك عضوية',
      'PT': 'تدريب شخصي',
      'DayUse': 'يوم استخدام',
      'InBody': 'فحص InBody'
    }
    return types[type] || type
  }

  const formattedDate = date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  React.useEffect(() => {
    // طباعة تلقائية بعد التحميل
    const timer = setTimeout(() => {
      window.print()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print, #receipt-print * {
            visibility: visible;
          }
          #receipt-print {
            position: absolute;
            left: 0;
            top: 0;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}} />

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
        <div className="bg-white rounded-lg p-4 max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">جاهز للطباعة</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => window.print()}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🖨️ طباعة
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      <div id="receipt-print" style={{
        width: '80mm',
        margin: '0 auto',
        padding: '5mm',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        background: 'white',
        color: 'black'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          borderBottom: '2px dashed #000',
          paddingBottom: '10px',
          marginBottom: '15px'
        }}>
          <h1 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>🏋️ صالة الرياضة</h1>
          <p style={{ fontSize: '13px', margin: '4px 0' }}>إيصال استلام</p>
          <p style={{ fontSize: '13px', margin: '4px 0' }}>{getTypeLabel(type)}</p>
        </div>

        {/* Info */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
            <strong>رقم الإيصال:</strong>
            <span>#{receiptNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
            <strong>التاريخ:</strong>
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Details */}
        <div style={{
          borderTop: '2px solid #000',
          borderBottom: '2px solid #000',
          padding: '15px 0',
          margin: '15px 0'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>تفاصيل العملية:</h3>
          
          {details.memberNumber && (
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#2563eb',
              textAlign: 'center',
              margin: '15px 0',
              padding: '12px',
              background: '#eff6ff',
              borderRadius: '8px'
            }}>
              رقم العضوية: {details.memberNumber}
            </div>
          )}
          
          {details.memberName && <div style={{ margin: '8px 0' }}><strong>الاسم:</strong> {details.memberName}</div>}
          {details.clientName && <div style={{ margin: '8px 0' }}><strong>العميل:</strong> {details.clientName}</div>}
          {details.name && <div style={{ margin: '8px 0' }}><strong>الاسم:</strong> {details.name}</div>}
          {details.subscriptionPrice && <div style={{ margin: '8px 0' }}><strong>سعر الاشتراك:</strong> {details.subscriptionPrice} جنيه</div>}
          
          {details.sessionsPurchased && (
            <>
              <div style={{ margin: '8px 0' }}><strong>عدد الجلسات:</strong> {details.sessionsPurchased}</div>
              {details.pricePerSession && <div style={{ margin: '8px 0' }}><strong>سعر الجلسة:</strong> {details.pricePerSession} جنيه</div>}
            </>
          )}
          
          {details.coachName && <div style={{ margin: '8px 0' }}><strong>المدرب:</strong> {details.coachName}</div>}
          {details.staffName && <div style={{ margin: '8px 0' }}><strong>الموظف:</strong> {details.staffName}</div>}
          {details.serviceType && <div style={{ margin: '8px 0' }}><strong>نوع الخدمة:</strong> {details.serviceType === 'DayUse' ? 'يوم استخدام' : 'InBody'}</div>}
          {details.paidAmount !== undefined && <div style={{ margin: '8px 0' }}><strong>المبلغ المدفوع:</strong> {details.paidAmount} جنيه</div>}
          {details.remainingAmount && details.remainingAmount > 0 && (
            <div style={{ margin: '8px 0', color: '#dc2626' }}><strong>المتبقي:</strong> {details.remainingAmount} جنيه</div>
          )}
        </div>

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '18px',
          fontWeight: 'bold',
          margin: '20px 0',
          padding: '15px 0',
          borderTop: '3px solid #000'
        }}>
          <span>الإجمالي:</span>
          <span>{amount} جنيه</span>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          borderTop: '2px dashed #000',
          paddingTop: '15px'
        }}>
          <p style={{ margin: '5px 0' }}>شكراً لك ✨</p>
          <p style={{ margin: '5px 0' }}>نتمنى لك تمريناً ممتعاً 💪</p>
          <p style={{ fontSize: '11px', marginTop: '10px' }}>هذا الإيصال دليل على الدفع</p>
        </div>
      </div>
    </>
  )
}