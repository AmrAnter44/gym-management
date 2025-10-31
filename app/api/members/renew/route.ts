// app/api/members/renew/route.ts - النسخة المُصلحة
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// 🔧 دالة للبحث عن رقم إيصال متاح
async function getNextAvailableReceiptNumber(startingNumber: number): Promise<number> {
  let currentNumber = startingNumber
  let attempts = 0
  const MAX_ATTEMPTS = 100
  
  while (attempts < MAX_ATTEMPTS) {
    const existingReceipt = await prisma.receipt.findUnique({
      where: { receiptNumber: currentNumber }
    })
    
    if (!existingReceipt) {
      console.log(`✅ رقم إيصال متاح: ${currentNumber}`)
      return currentNumber
    }
    
    console.log(`⚠️ رقم ${currentNumber} موجود، تجربة ${currentNumber + 1}...`)
    currentNumber++
    attempts++
  }
  
  throw new Error(`فشل إيجاد رقم إيصال متاح بعد ${MAX_ATTEMPTS} محاولة`)
}

// POST - تجديد اشتراك عضو
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      memberId, 
      subscriptionPrice, 
      remainingAmount, 
      freePTSessions, 
      inBodyScans,
      invitations,
      startDate, 
      expiryDate, 
      notes, 
      paymentMethod 
    } = body

    console.log('🔄 تجديد اشتراك عضو:', { 
      memberId, 
      subscriptionPrice, 
      freePTSessions, 
      inBodyScans, 
      invitations, 
      startDate, 
      expiryDate, 
      paymentMethod 
    })

    // جلب بيانات العضو
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    })

    if (!member) {
      return NextResponse.json({ error: 'العضو غير موجود' }, { status: 404 })
    }

    // حساب حصص PT الجديدة (الحالية + الإضافية)
    const currentFreePT = member.freePTSessions || 0
    const additionalFreePT = freePTSessions || 0
    const totalFreePT = currentFreePT + additionalFreePT

    // حساب InBody الجديد (الحالي + الإضافي)
    const currentInBody = member.inBodyScans || 0
    const additionalInBody = inBodyScans || 0
    const totalInBody = currentInBody + additionalInBody

    // حساب Invitations الجديد (الحالي + الإضافي)
    const currentInvitations = member.invitations || 0
    const additionalInvitations = invitations || 0
    const totalInvitations = currentInvitations + additionalInvitations

    console.log('💪 حصص PT: الحالية =', currentFreePT, '+ الإضافية =', additionalFreePT, '= الإجمالي =', totalFreePT)
    console.log('⚖️ InBody: الحالي =', currentInBody, '+ الإضافي =', additionalInBody, '= الإجمالي =', totalInBody)
    console.log('🎟️ Invitations: الحالية =', currentInvitations, '+ الإضافية =', additionalInvitations, '= الإجمالي =', totalInvitations)

    // تحديث بيانات العضو
    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: {
        subscriptionPrice,
        remainingAmount: remainingAmount || 0,
        freePTSessions: totalFreePT,
        inBodyScans: totalInBody,
        invitations: totalInvitations,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isActive: true,
        notes: notes || member.notes,
      },
    })

    console.log('✅ تم تحديث بيانات العضو - PT:', updatedMember.freePTSessions, 'InBody:', updatedMember.inBodyScans, 'Invitations:', updatedMember.invitations)

    // إنشاء إيصال التجديد
    try {
      let counter = await prisma.receiptCounter.findUnique({ where: { id: 1 } })
      
      if (!counter) {
        counter = await prisma.receiptCounter.create({
          data: { id: 1, current: 1000 }
        })
      }

      console.log('🧾 رقم الإيصال من العداد:', counter.current)

      // ✅ البحث عن رقم إيصال متاح
      const availableReceiptNumber = await getNextAvailableReceiptNumber(counter.current)
      
      console.log('✅ سيتم استخدام رقم الإيصال:', availableReceiptNumber)

      const paidAmount = subscriptionPrice - (remainingAmount || 0)

      // حساب مدة الاشتراك
      let subscriptionDays = null
      if (startDate && expiryDate) {
        const start = new Date(startDate)
        const end = new Date(expiryDate)
        subscriptionDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      }

      const receipt = await prisma.receipt.create({
        data: {
          receiptNumber: availableReceiptNumber, // ✅ استخدام الرقم المتاح
          type: 'تجديد عضويه',
          amount: paidAmount,
          paymentMethod: paymentMethod || 'cash',
          itemDetails: JSON.stringify({
            memberNumber: member.memberNumber,
            memberName: member.name,
            subscriptionPrice,
            paidAmount,
            remainingAmount: remainingAmount || 0,
            // حصص PT في الإيصال
            freePTSessions: additionalFreePT,
            previousFreePTSessions: currentFreePT,
            totalFreePTSessions: totalFreePT,
            // InBody في الإيصال
            inBodyScans: additionalInBody,
            previousInBodyScans: currentInBody,
            totalInBodyScans: totalInBody,
            // Invitations في الإيصال
            invitations: additionalInvitations,
            previousInvitations: currentInvitations,
            totalInvitations: totalInvitations,
            // التواريخ
            previousExpiryDate: member.expiryDate,
            newStartDate: startDate,
            newExpiryDate: expiryDate,
            subscriptionDays: subscriptionDays,
            isRenewal: true,
          }),
          memberId: member.id,
        },
      })

      console.log('✅ تم إنشاء إيصال التجديد:', receipt.receiptNumber)

      // ✅ تحديث العداد للرقم بعد الرقم المستخدم
      const newCounterValue = availableReceiptNumber + 1
      await prisma.receiptCounter.update({
        where: { id: 1 },
        data: { current: newCounterValue }
      })

      console.log('🔄 تم تحديث عداد الإيصالات إلى:', newCounterValue)

      return NextResponse.json({
        member: updatedMember,
        receipt: {
          receiptNumber: receipt.receiptNumber,
          amount: receipt.amount,
          paymentMethod: receipt.paymentMethod,
          itemDetails: JSON.parse(receipt.itemDetails),
          createdAt: receipt.createdAt
        }
      }, { status: 200 })

    } catch (receiptError) {
      console.error('❌ خطأ في إنشاء إيصال التجديد:', receiptError)
      return NextResponse.json({
        member: updatedMember,
        receipt: null,
        warning: 'تم التجديد لكن فشل إنشاء الإيصال'
      }, { status: 200 })
    }

  } catch (error) {
    console.error('❌ خطأ في تجديد الاشتراك:', error)
    return NextResponse.json({ 
      error: 'فشل تجديد الاشتراك' 
    }, { status: 500 })
  }
}