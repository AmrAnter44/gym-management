'use client'

import React from 'react'

interface ReceiptProps {
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

export function Receipt({ receiptNumber, type, amount, details, date }: ReceiptProps) {
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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          
          .receipt-container {
            width: 80mm !important;
            padding: 5mm !important;
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif !important;
            font-size: 12px !important;
            margin: 0 !important;
          }
          
          .receipt-header {
            text-align: center !important;
            border-bottom: 2px dashed #000 !important;
            padding-bottom: 10px !important;
            margin-bottom: 15px !important;
          }
          
          .receipt-header h1 {
            font-size: 20px !important;
            font-weight: bold !important;
            margin: 0 0 5px 0 !important;
          }
          
          .receipt-header p {
            font-size: 11px !important;
            margin: 2px 0 !important;
          }
          
          .receipt-info {
            margin-bottom: 15px !important;
          }
          
          .receipt-row {
            display: flex !important;
            justify-content: space-between !important;
            margin: 5px 0 !important;
            font-size: 12px !important;
          }
          
          .receipt-row-label {
            font-weight: bold !important;
          }
          
          .receipt-details {
            border-top: 1px solid #000 !important;
            border-bottom: 1px solid #000 !important;
            padding: 10px 0 !important;
            margin: 10px 0 !important;
          }
          
          .receipt-details h3 {
            font-size: 13px !important;
            font-weight: bold !important;
            margin-bottom: 8px !important;
          }
          
          .receipt-detail-item {
            margin: 5px 0 !important;
            font-size: 12px !important;
          }
          
          .receipt-total {
            display: flex !important;
            justify-content: space-between !important;
            font-size: 16px !important;
            font-weight: bold !important;
            margin: 15px 0 !important;
            padding: 10px 0 !important;
            border-top: 2px solid #000 !important;
          }
          
          .receipt-footer {
            text-align: center !important;
            margin-top: 15px !important;
            font-size: 11px !important;
            color: #555 !important;
            border-top: 2px dashed #000 !important;
            padding-top: 10px !important;
          }
          
          .member-number {
            font-size: 18px !important;
            font-weight: bold !important;
            color: #2563eb !important;
            text-align: center !important;
            margin: 10px 0 !important;
            padding: 8px !important;
            background: #eff6ff !important;
            border-radius: 5px !important;
          }
        }
      `}} />
      
      <div className="receipt-container" style={{
        width: '80mm',
        padding: '10mm',
        background: 'white',
        color: 'black',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px'
      }}>
        <div className="receipt-header" style={{
          textAlign: 'center',
          borderBottom: '2px dashed #000',
          paddingBottom: '10px',
          marginBottom: '15px'
        }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            margin: '0 0 5px 0'
          }}>🏋️ صالة الرياضة</h1>
          <p style={{
            fontSize: '11px',
            margin: '2px 0'
          }}>إيصال استلام</p>
          <p style={{
            fontSize: '11px',
            margin: '2px 0'
          }}>{getTypeLabel(type)}</p>
        </div>

        <div className="receipt-info" style={{ marginBottom: '15px' }}>
          <div className="receipt-row" style={{
            display: 'flex',
            justifyContent: 'space-between',
            margin: '5px 0',
            fontSize: '12px'
          }}>
            <span style={{ fontWeight: 'bold' }}>رقم الإيصال:</span>
            <span>#{receiptNumber}</span>
          </div>
          <div className="receipt-row" style={{
            display: 'flex',
            justifyContent: 'space-between',
            margin: '5px 0',
            fontSize: '12px'
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

        <div className="receipt-details" style={{
          borderTop: '1px solid #000',
          borderBottom: '1px solid #000',
          padding: '10px 0',
          margin: '10px 0'
        }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>تفاصيل العملية:</h3>
          
          {details.memberNumber && (
            <div className="member-number" style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#2563eb',
              textAlign: 'center',
              margin: '10px 0',
              padding: '8px',
              background: '#eff6ff',
              borderRadius: '5px'
            }}>
              رقم العضوية: {details.memberNumber}
            </div>
          )}
          
          {details.memberName && (
            <div style={{ margin: '5px 0', fontSize: '12px' }}>
              <strong>الاسم:</strong> {details.memberName}
            </div>
          )}
          
          {details.clientName && (
            <div style={{ margin: '5px 0', fontSize: '12px' }}>
              <strong>العميل:</strong> {details.clientName}
            </div>
          )}
          
          {details.name && (
            <div style={{ margin: '5px 0', fontSize: '12px' }}>
              <strong>الاسم:</strong> {details.name}
            </div>
          )}
          
          {details.subscriptionPrice && (
            <div style={{ margin: '5px 0', fontSize: '12px' }}>
              <strong>سعر الاشتراك:</strong> {details.subscriptionPrice} جنيه
            </div>
          )}
          
          {details.sessionsPurchased && (
            <>
              <div style={{ margin: '5px 0', fontSize: '12px' }}>
                <strong>عدد الجلسات:</strong> {details.sessionsPurchased}
              </div>
              {details.pricePerSession && (
                <div style={{ margin: '5px 0', fontSize: '12px' }}>
                  <strong>سعر الجلسة:</strong> {details.pricePerSession} جنيه
                </div>
              )}
            </>
          )}
          
          {details.coachName && (
            <div style={{ margin: '5px 0', fontSize: '12px' }}>
              <strong>المدرب:</strong> {details.coachName}
            </div>
          )}
          
          {details.staffName && (
            <div style={{ margin: '5px 0', fontSize: '12px' }}>
              <strong>الموظف:</strong> {details.staffName}
            </div>
          )}
          
          {details.serviceType && (
            <div style={{ margin: '5px 0', fontSize: '12px' }}>
              <strong>نوع الخدمة:</strong> {details.serviceType === 'DayUse' ? 'يوم استخدام' : 'InBody'}
            </div>
          )}
          
          {details.paidAmount !== undefined && (
            <div style={{ margin: '5px 0', fontSize: '12px' }}>
              <strong>المبلغ المدفوع:</strong> {details.paidAmount} جنيه
            </div>
          )}
          
          {details.remainingAmount !== undefined && details.remainingAmount > 0 && (
            <div style={{ margin: '5px 0', fontSize: '12px', color: '#dc2626' }}>
              <strong>المتبقي:</strong> {details.remainingAmount} جنيه
            </div>
          )}
        </div>

        <div className="receipt-total" style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '16px',
          fontWeight: 'bold',
          margin: '15px 0',
          padding: '10px 0',
          borderTop: '2px solid #000'
        }}>
          <span>الإجمالي:</span>
          <span>{amount} جنيه</span>
        </div>

        <div className="receipt-footer" style={{
          textAlign: 'center',
          marginTop: '15px',
          fontSize: '11px',
          color: '#555',
          borderTop: '2px dashed #000',
          paddingTop: '10px'
        }}>
          <p>شكراً لك ✨</p>
          <p>نتمنى لك تمريناً ممتعاً 💪</p>
          <p style={{ fontSize: '10px', marginTop: '8px' }}>
            هذا الإيصال دليل على الدفع
          </p>
        </div>
      </div>
    </>
  )
}