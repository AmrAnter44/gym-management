// استخدام Electron's native print API

export function printReceiptElectron(receiptData: {
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

  const html = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          width: 80mm;
          padding: 5mm;
          background: white;
          color: black;
          font-size: 14px;
        }
        .header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .header h1 { font-size: 24px; margin-bottom: 8px; }
        .header p { font-size: 13px; margin: 4px 0; }
        .row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }
        .details {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 15px 0;
          margin: 15px 0;
        }
        .details h3 { font-size: 16px; margin-bottom: 12px; }
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
        .total {
          display: flex;
          justify-content: space-between;
          font-size: 18px;
          font-weight: bold;
          margin: 20px 0;
          padding: 15px 0;
          border-top: 3px solid #000;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          border-top: 2px dashed #000;
          padding-top: 15px;
        }
        .footer p { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏋️ صالة الرياضة</h1>
        <p>إيصال استلام</p>
        <p>${getTypeLabel(type)}</p>
      </div>
      
      <div class="row">
        <strong>رقم الإيصال:</strong>
        <span>#${receiptNumber}</span>
      </div>
      <div class="row">
        <strong>التاريخ:</strong>
        <span>${formattedDate}</span>
      </div>
      
      <div class="details">
        <h3>تفاصيل العملية:</h3>
        ${details.memberNumber ? `<div class="member-number">رقم العضوية: ${details.memberNumber}</div>` : ''}
        ${details.memberName ? `<div style="margin: 8px 0"><strong>الاسم:</strong> ${details.memberName}</div>` : ''}
        ${details.clientName ? `<div style="margin: 8px 0"><strong>العميل:</strong> ${details.clientName}</div>` : ''}
        ${details.name ? `<div style="margin: 8px 0"><strong>الاسم:</strong> ${details.name}</div>` : ''}
        ${details.subscriptionPrice ? `<div style="margin: 8px 0"><strong>سعر الاشتراك:</strong> ${details.subscriptionPrice} جنيه</div>` : ''}
        ${details.sessionsPurchased ? `
          <div style="margin: 8px 0"><strong>عدد الجلسات:</strong> ${details.sessionsPurchased}</div>
          ${details.pricePerSession ? `<div style="margin: 8px 0"><strong>سعر الجلسة:</strong> ${details.pricePerSession} جنيه</div>` : ''}
        ` : ''}
        ${details.coachName ? `<div style="margin: 8px 0"><strong>المدرب:</strong> ${details.coachName}</div>` : ''}
        ${details.staffName ? `<div style="margin: 8px 0"><strong>الموظف:</strong> ${details.staffName}</div>` : ''}
        ${details.serviceType ? `<div style="margin: 8px 0"><strong>نوع الخدمة:</strong> ${details.serviceType === 'DayUse' ? 'يوم استخدام' : 'InBody'}</div>` : ''}
        ${details.paidAmount !== undefined ? `<div style="margin: 8px 0"><strong>المبلغ المدفوع:</strong> ${details.paidAmount} جنيه</div>` : ''}
        ${details.remainingAmount && details.remainingAmount > 0 ? `<div style="margin: 8px 0; color: #dc2626"><strong>المتبقي:</strong> ${details.remainingAmount} جنيه</div>` : ''}
      </div>
      
      <div class="total">
        <span>الإجمالي:</span>
        <span>${amount} جنيه</span>
      </div>
      
      <div class="footer">
        <p>شكراً لك ✨</p>
        <p>نتمنى لك تمريناً ممتعاً 💪</p>
        <p style="font-size: 11px; margin-top: 10px">هذا الإيصال دليل على الدفع</p>
      </div>
    </body>
    </html>
  `

  // فتح نافذة جديدة للطباعة
  const printWindow = window.open('', '_blank', 'width=302,height=600')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        // إغلاق النافذة بعد الطباعة
        printWindow.onafterprint = () => {
          printWindow.close()
        }
      }, 250)
    }
  }
}