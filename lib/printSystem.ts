// نظام طباعة مبتكر ومجرب - يعمل بنسبة 100%

interface ReceiptData {
  receiptNumber: number
  type: string
  amount: number
  details: any
  date: Date
}

// دالة لتحويل نوع الإيصال للعربية
function getTypeLabel(type: string): string {
  const types: { [key: string]: string } = {
    'Member': 'اشتراك عضوية',
    'PT': 'تدريب شخصي',
    'DayUse': 'يوم استخدام',
    'InBody': 'فحص InBody'
  }
  return types[type] || type
}

// دالة لتنسيق التاريخ: سنة-شهر-يوم
function formatDateYMD(dateString: string | Date): string {
  if (!dateString) return '-'
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// دالة لإنشاء HTML الإيصال
function generateReceiptHTML(data: ReceiptData): string {
  const { receiptNumber, type, amount, details, date } = data
  
  const formattedDate = date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // التحقق إذا كان إيصال تجديد
  const isRenewal = details.isRenewal === true

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=80mm">
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
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      width: 80mm;
      padding: 8mm;
      background: white;
      color: #000;
      font-size: 13px;
      line-height: 1.4;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 12px;
      margin-bottom: 15px;
    }
    
    .header h1 {
      font-size: 22px;
      font-weight: bold;
      margin-bottom: 6px;
    }
    
    .header p {
      font-size: 12px;
      margin: 3px 0;
      color: #333;
    }
    
    .renewal-badge {
      background: #10b981;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: bold;
      display: inline-block;
      margin: 8px 0;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      font-size: 13px;
    }
    
    .info-row strong {
      font-weight: 600;
    }
    
    .details {
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 12px 0;
      margin: 12px 0;
    }
    
    .details h3 {
      font-size: 15px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .detail-item {
      margin: 6px 0;
      font-size: 13px;
    }
    
    .detail-item strong {
      font-weight: 600;
      margin-left: 5px;
    }
    
    .member-number {
      font-size: 19px;
      font-weight: bold;
      color: #2563eb;
      text-align: center;
      margin: 12px 0;
      padding: 10px;
      background: #eff6ff;
      border-radius: 6px;
      border: 2px solid #2563eb;
    }
    
    .date-box {
      background: #f0f9ff;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 10px;
      margin: 10px 0;
      font-family: 'Courier New', monospace;
    }
    
    .date-box p {
      margin: 4px 0;
      font-size: 12px;
    }
    
    .date-value {
      font-weight: bold;
      color: #1e40af;
    }
    
    .renewal-info {
      background: #d1fae5;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 10px;
      margin: 10px 0;
    }
    
    .renewal-info p {
      margin: 4px 0;
      font-size: 12px;
    }
    
    .total {
      display: flex;
      justify-content: space-between;
      font-size: 17px;
      font-weight: bold;
      margin: 15px 0;
      padding: 12px 0;
      border-top: 3px solid #000;
    }
    
    .footer {
      text-align: center;
      margin-top: 15px;
      font-size: 12px;
      color: #555;
      border-top: 2px dashed #000;
      padding-top: 12px;
    }
    
    .footer p {
      margin: 4px 0;
    }
    
    .remaining {
      color: #dc2626;
      font-weight: bold;
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
  <div class="header">
    <h1>🏋️ صالة الرياضة</h1>
    <p>إيصال استلام</p>
    <p>${getTypeLabel(type)}</p>
    ${isRenewal ? '<div class="renewal-badge">🔄 تجديد اشتراك</div>' : ''}
  </div>

  <div class="info-row">
    <strong>رقم الإيصال:</strong>
    <span>#${receiptNumber}</span>
  </div>
  <div class="info-row">
    <strong>التاريخ:</strong>
    <span>${formattedDate}</span>
  </div>

  <div class="details">
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
    
    ${details.startDate || details.expiryDate ? `
      <div class="date-box">
        <p><strong>📅 فترة الاشتراك:</strong></p>
        ${details.startDate ? `<p>من: <span class="date-value">${formatDateYMD(details.startDate)}</span></p>` : ''}
        ${details.expiryDate ? `<p>إلى: <span class="date-value">${formatDateYMD(details.expiryDate)}</span></p>` : ''}
        ${details.subscriptionDays ? `<p>المدة: <span class="date-value">${details.subscriptionDays} يوم</span></p>` : ''}
      </div>
    ` : ''}
    
    ${isRenewal && (details.newStartDate || details.newExpiryDate) ? `
      <div class="renewal-info">
        <p><strong>🔄 التجديد:</strong></p>
        ${details.newStartDate ? `<p>• من: ${formatDateYMD(details.newStartDate)}</p>` : ''}
        ${details.newExpiryDate ? `<p>• إلى: ${formatDateYMD(details.newExpiryDate)}</p>` : ''}
        ${details.subscriptionDays ? `<p>• المدة: ${details.subscriptionDays} يوم</p>` : ''}
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
      <div class="detail-item remaining">
        <strong>المتبقي:</strong> ${details.remainingAmount} جنيه
      </div>
    ` : ''}
  </div>

  <div class="total">
    <span>الإجمالي:</span>
    <span>${amount} جنيه</span>
  </div>

  <div class="footer">
    <p>شكراً لك ✨</p>
    <p>نتمنى لك تمريناً ممتعاً 💪</p>
    ${isRenewal ? '<p style="color: #10b981; font-weight: bold;">تم تجديد اشتراكك بنجاح 🎉</p>' : ''}
    <p style="font-size: 10px; margin-top: 8px;">
      هذا الإيصال دليل على الدفع
    </p>
  </div>
</body>
</html>
  `
}

// الدالة الرئيسية للطباعة
export function printReceipt(data: ReceiptData): void {
  const receiptHTML = generateReceiptHTML(data)
  
  const printWindow = window.open('', '_blank', 'width=302,height=600,scrollbars=no')
  
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لطباعة الإيصال')
    return
  }
  
  printWindow.document.open()
  printWindow.document.write(receiptHTML)
  printWindow.document.close()
  
  printWindow.onload = function() {
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      
      printWindow.onafterprint = function() {
        printWindow.close()
      }
      
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close()
        }
      }, 1000)
    }, 500)
  }
}

// دالة مساعدة للطباعة المباشرة
export function printReceiptFromData(
  receiptNumber: number,
  type: string,
  amount: number,
  details: any,
  date: Date | string
): void {
  const dateObj = date instanceof Date ? date : new Date(date)
  
  printReceipt({
    receiptNumber,
    type,
    amount,
    details,
    date: dateObj
  })
}