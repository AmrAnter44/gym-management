// دوال تنسيق التواريخ

/**
 * تنسيق التاريخ بصيغة: سنة-شهر-يوم
 * مثال: 2025-01-21
 */
export function formatDateYMD(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * تنسيق التاريخ بصيغة: سنة شهر يوم (مع اسم الشهر)
 * مثال: 2025 يناير 21
 */
export function formatDateYMDText(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  const year = d.getFullYear()
  const month = d.toLocaleDateString('ar-EG', { month: 'long' })
  const day = d.getDate()
  
  return `${year} ${month} ${day}`
}

/**
 * تنسيق التاريخ بصيغة: سنة-شهر-يوم مع الوقت
 * مثال: 2025-01-21 10:30 ص
 */
export function formatDateTimeYMD(date: Date | string | null | undefined): string {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  const datePart = formatDateYMD(d)
  const time = d.toLocaleTimeString('ar-EG', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
  
  return `${datePart} ${time}`
}

/**
 * حساب عدد الأيام بين تاريخين
 */
export function calculateDaysBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? new Date(start) : start
  const endDate = typeof end === 'string' ? new Date(end) : end
  
  const diffTime = endDate.getTime() - startDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * حساب عدد الأيام المتبقية من اليوم
 */
export function calculateRemainingDays(expiryDate: Date | string | null | undefined): number | null {
  if (!expiryDate) return null
  
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate
  const today = new Date()
  
  return calculateDaysBetween(today, expiry)
}

/**
 * تنسيق المدة بالأشهر تقريباً
 */
export function formatDurationInMonths(days: number): string {
  if (days < 30) {
    return `${days} يوم`
  }
  
  const months = Math.round(days / 30)
  return `${days} يوم (≈ ${months} ${months === 1 ? 'شهر' : 'أشهر'})`
}