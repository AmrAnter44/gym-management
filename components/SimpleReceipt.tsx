'use client'

import React from 'react'

interface SimpleReceiptProps {
  receiptNumber: number
  type: string
  amount: number
  details: {
    memberNumber?: number
    memberName?: string
    clientName?: string
    subscriptionPrice?: number
    sessionsPurchased?: number
    pricePerSession?: number
    serviceType?: string
    name?: string
    staffName?: string
    coachName?: string
    paidAmount?: number
    remainingAmount?: number
    totalAmount?: number
  }
  date: Date | string
}

export function SimpleReceipt({ receiptNumber, type, amount, details, date }: SimpleReceiptProps) {
  const formattedDate = date instanceof Date ? date : new Date(date)
  
  const getTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'Member': 'اشتراك عضوية',
      'PT': 'تدريب شخصي',
      'DayUse': 'يوم استخدام',
      'InBody': 'فحص InBody'
    }
    return types[type] || type
  }
  
  return (
    <div style={{
      width: '80mm',
      padding: '10mm',
      background: 'white',
      color: 'black',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        borderBottom: '2px dashed #000',
        paddingBottom: '10px',
        marginBottom: '15px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          margin: '0 0 8px 0'
        }}>🏋️ صالة الرياضة</h1>
        <p style={{ fontSize: '13px', margin: '4px 0' }}>إيصال استلام</p>
        <p style={{ fontSize: '13px', margin: '4px 0' }}>{getTypeLabel(type)}</p>
      </div>

      {/* Receipt Info */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          margin: '8px 0',
          fontSize: '14px'
        }}>
          <span style={{ fontWeight: 'bold' }}>رقم الإيصال:</span>
          <span>#{receiptNumber}</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          margin: '8px 0',
          fontSize: '14px'
        }}>
          <span style={{ fontWeight: 'bold' }}>التاريخ:</span>
          <span>{formattedDate.toLocaleDateString('ar-EG', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </div>
      </div>

      {/* Details */}
      <div style={{
        borderTop: '2px solid #000',
        borderBottom: '2px solid #000',
        padding: '15px 0',
        margin: '15px 0'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '12px'
        }}>تفاصيل العملية:</h3>
        
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
        
        {details.memberName && (
          <div style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>الاسم:</strong> {details.memberName}
          </div>
        )}
        
        {details.clientName && (
          <div style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>العميل:</strong> {details.clientName}
          </div>
        )}
        
        {details.name && (
          <div style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>الاسم:</strong> {details.name}
          </div>
        )}
        
        {details.subscriptionPrice && (
          <div style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>سعر الاشتراك:</strong> {details.subscriptionPrice} جنيه
          </div>
        )}
        
        {details.sessionsPurchased && (
          <>
            <div style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>عدد الجلسات:</strong> {details.sessionsPurchased}
            </div>
            {details.pricePerSession && (
              <div style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong>سعر الجلسة:</strong> {details.pricePerSession} جنيه
              </div>
            )}
          </>
        )}
        
        {details.coachName && (
          <div style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>المدرب:</strong> {details.coachName}
          </div>
        )}
        
        {details.staffName && (
          <div style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>الموظف:</strong> {details.staffName}
          </div>
        )}
        
        {details.serviceType && (
          <div style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>نوع الخدمة:</strong> {details.serviceType === 'DayUse' ? 'يوم استخدام' : 'InBody'}
          </div>
        )}
        
        {details.paidAmount !== undefined && (
          <div style={{ margin: '8px 0', fontSize: '14px' }}>
            <strong>المبلغ المدفوع:</strong> {details.paidAmount} جنيه
          </div>
        )}
        
        {details.remainingAmount !== undefined && details.remainingAmount > 0 && (
          <div style={{ margin: '8px 0', fontSize: '14px', color: '#dc2626' }}>
            <strong>المتبقي:</strong> {details.remainingAmount} جنيه
          </div>
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
        fontSize: '13px',
        color: '#555',
        borderTop: '2px dashed #000',
        paddingTop: '15px'
      }}>
        <p style={{ margin: '5px 0' }}>شكراً لك ✨</p>
        <p style={{ margin: '5px 0' }}>نتمنى لك تمريناً ممتعاً 💪</p>
        <p style={{ fontSize: '11px', marginTop: '10px' }}>
          هذا الإيصال دليل على الدفع
        </p>
      </div>
    </div>
  )
}