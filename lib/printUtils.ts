// دالة طباعة الإيصال - طريقة مضمونة 100%
export function printReceipt(receiptData: {
  receiptNumber: number
  type: string
  amount: number
  details: any
  date: Date
}) {
  const { receiptNumber, type, amount, details, date } = receiptData

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

  // HTML الإيصال كامل
  const receiptHTML = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إيصال ${receiptNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: 80mm auto;
          margin: 0;
        }
        
        body {
          font-family: Arial, sans-serif;
          width: 80mm;
          padding: 5mm;
          background: white;
          color: black;
          font-size: 14px;
        }
        
        .receipt-header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .receipt-header h1 {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .receipt-header p {
          font-size: 13px;
          margin: 4px 0;
        }
        
        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
          font-size: 14px;
        }
        
        .receipt-details {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 15px 0;
          margin: 15px 0;
        }
        
        .receipt-details h3 {
          font-size: 16px;
          margin-bottom: 12px;
          font-weight: bold;
        }
        
        .detail-item {
          margin: 8px 0;
          font-size: 14px;
        }
        
        .member-number {
          font-size: 20px;
          font-weight: bold;
          color: #2563eb;
          text-align: center;
          margin: 15px 0;
          padding: 12px;
          background: #eff6ff;
          border-radius: 8px;
        }
        
        .receipt-total {
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          font-weight: bold;
          margin: 20px 0;
          padding: 15px 0;
          border-top: 3px solid #000;
        }
        
        .receipt-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 13px;
          border-top: 2px dashed #000;
          padding-top: 15px;
        }
        
        .receipt-footer p {
          margin: 5px 0;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <h1>🏋️ صالة الرياضة</h1>
        <p>إيصال استلام</p>
        <p>${getTypeLabel(type)}</p>
      </div>

      <div>
        <div class="receipt-row">
          <strong>رقم الإيصال:</strong>
          <span>#${receiptNumber}</span>
        </div>
        <div class="receipt-row">
          <strong>التاريخ:</strong>
          <span>${formattedDate}</span>
        </div>
      </div>

      <div class="receipt-details">
        <h3>تفاصيل العملية:</h3>
        
        ${details.memberNumber ? `
          <div class="member-number">
            رقم العضوية: ${details.memberNumber}
          </div>
        ` : ''}
        
        ${details.memberName ? `
          <div class="detail-item">
            <strong>الاسم:</strong> ${details.memberName}
          </div>
        ` : ''}
        
        ${details.clientName ? `
          <div class="detail-item">
            <strong>العميل:</strong> ${details.clientName}
          </div>
        ` : ''}
        
        ${details.name ? `
          <div class="detail-item">
            <strong>الاسم:</strong> ${details.name}
          </div>
        ` : ''}
        
        ${details.subscriptionPrice ? `
          <div class="detail-item">
            <strong>سعر الاشتراك:</strong> ${details.subscriptionPrice} جنيه
          </div>
        ` : ''}
        
        ${details.sessionsPurchased ? `
          <div class="detail-item">
            <strong>عدد الجلسات:</strong> ${details.sessionsPurchased}
          </div>
          ${details.pricePerSession ? `
            <div class="detail-item">
              <strong>سعر الجلسة:</strong> ${details.pricePerSession} جنيه
            </div>
          ` : ''}
        ` : ''}
        
        ${details.coachName ? `
          <div class="detail-item">
            <strong>المدرب:</strong> ${details.coachName}
          </div>
        ` : ''}
        
        ${details.staffName ? `
          <div class="detail-item">
            <strong>الموظف:</strong> ${details.staffName}
          </div>
        ` : ''}
        
        ${details.serviceType ? `
          <div class="detail-item">
            <strong>نوع الخدمة:</strong> ${details.serviceType === 'DayUse' ? 'يوم استخدام' : 'InBody'}
          </div>
        ` : ''}
        
        ${details.paidAmount !== undefined ? `
          <div class="detail-item">
            <strong>المبلغ المدفوع:</strong> ${details.paidAmount} جنيه
          </div>
        ` : ''}
        
        ${details.remainingAmount && details.remainingAmount > 0 ? `
          <div class="detail-item" style="color: #dc2626;">
            <strong>المتبقي:</strong> ${details.remainingAmount} جنيه
          </div>
        ` : ''}
      </div>

      <div class="receipt-total">
        <span>الإجمالي:</span>
        <span>${amount} جنيه</span>
      </div>

      <div class="receipt-footer">
        <p>شكراً لك ✨</p>
        <p>نتمنى لك تمريناً ممتعاً 💪</p>
        <p style="font-size: 11px; margin-top: 10px;">
          هذا الإيصال دليل على الدفع
        </p>
      </div>
    </body>
    </html>
  `

  // إنشاء iframe مخفي
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  document.body.appendChild(iframe)

  // كتابة المحتوى في الـ iframe
  const iframeDoc = iframe.contentWindow?.document
  if (!iframeDoc) {
    console.error('Failed to get iframe document')
    document.body.removeChild(iframe)
    return
  }

  iframeDoc.open()
  iframeDoc.write(receiptHTML)
  iframeDoc.close()

  // الطباعة بعد تحميل المحتوى
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        
        // حذف الـ iframe بعد الطباعة
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      } catch (error) {
        console.error('Print error:', error)
        document.body.removeChild(iframe)
      }
    }, 250)
  }
}