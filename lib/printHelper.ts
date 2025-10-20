// مساعد الطباعة
export function printReceipt(receiptHTML: string) {
  // إنشاء iframe مخفي
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '-9999px'
  iframe.style.width = '80mm'
  iframe.style.height = 'auto'
  document.body.appendChild(iframe)

  // الحصول على document الخاص بالـ iframe
  const iframeDoc = iframe.contentWindow?.document
  if (!iframeDoc) return

  // كتابة محتوى الإيصال
  iframeDoc.open()
  iframeDoc.write(`
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          margin: 0;
          size: 80mm auto;
        }
        
        body {
          font-family: Arial, sans-serif;
          width: 80mm;
          padding: 5mm;
          background: white;
          color: black;
        }
        
        .receipt-header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .receipt-header h1 {
          font-size: 20px;
          margin-bottom: 5px;
        }
        
        .receipt-header p {
          font-size: 11px;
          margin: 2px 0;
        }
        
        .receipt-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          font-size: 12px;
        }
        
        .receipt-details {
          border-top: 1px solid #000;
          border-bottom: 1px solid #000;
          padding: 10px 0;
          margin: 10px 0;
        }
        
        .receipt-details h3 {
          font-size: 13px;
          margin-bottom: 8px;
        }
        
        .detail-item {
          margin: 5px 0;
          font-size: 12px;
        }
        
        .member-number {
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
          text-align: center;
          margin: 10px 0;
          padding: 8px;
          background: #eff6ff;
          border-radius: 5px;
        }
        
        .receipt-total {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: bold;
          margin: 15px 0;
          padding: 10px 0;
          border-top: 2px solid #000;
        }
        
        .receipt-footer {
          text-align: center;
          margin-top: 15px;
          font-size: 11px;
          border-top: 2px dashed #000;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      ${receiptHTML}
    </body>
    </html>
  `)
  iframeDoc.close()

  // انتظر تحميل المحتوى ثم اطبع
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print()
      
      // إزالة الـ iframe بعد الطباعة
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 1000)
    }, 250)
  }
}

// دالة لتوليد HTML الإيصال
export function generateReceiptHTML(
  receiptNumber: number,
  type: string,
  amount: number,
  details: any,
  date: Date
): string {
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

  return `
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
      <p style="font-size: 10px; margin-top: 8px;">
        هذا الإيصال دليل على الدفع
      </p>
    </div>
  `
}