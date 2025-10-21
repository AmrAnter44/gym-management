import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// POST - تجديد اشتراك عضو
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { memberId, subscriptionPrice, remainingAmount, months, notes } = body

    console.log('🔄 تجديد اشتراك عضو:', { memberId, subscriptionPrice, months })

    // جلب بيانات العضو
    const member = await prisma.member.findUnique({
      where: { id: memberId }
    })

    if (!member) {
      return NextResponse.json({ error: 'العضو غير موجود' }, { status: 404 })
    }

    // حساب تاريخ الانتهاء الجديد
    const today = new Date()
    const newExpiryDate = new Date(today)
    newExpiryDate.setMonth(newExpiryDate.getMonth() + parseInt(months))

    // تحديث بيانات العضو
    const updatedMember = await prisma.member.update({
      where: { id: memberId },
      data: {
        subscriptionPrice,
        remainingAmount: remainingAmount || 0,
        expiryDate: newExpiryDate,
        isActive: true,
        notes: notes || member.notes,
      },
    })

    console.log('✅ تم تحديث بيانات العضو')

    // إنشاء إيصال التجديد
    try {
      let counter = await prisma.receiptCounter.findUnique({ where: { id: 1 } })
      
      if (!counter) {
        counter = await prisma.receiptCounter.create({
          data: { id: 1, current: 1000 }
        })
      }

      console.log('🧾 رقم الإيصال التالي:', counter.current)

      const paidAmount = subscriptionPrice - (remainingAmount || 0)

      const receipt = await prisma.receipt.create({
        data: {
          receiptNumber: counter.current,
          type: 'Member',
          amount: paidAmount,
          itemDetails: JSON.stringify({
            memberNumber: member.memberNumber,
            memberName: member.name,
            subscriptionPrice,
            paidAmount,
            remainingAmount: remainingAmount || 0,
            renewalMonths: months,
            previousExpiryDate: member.expiryDate,
            newExpiryDate: newExpiryDate,
            isRenewal: true,
          }),
          memberId: member.id,
        },
      })

      console.log('✅ تم إنشاء إيصال التجديد:', receipt.receiptNumber)

      await prisma.receiptCounter.update({
        where: { id: 1 },
        data: { current: counter.current + 1 }
      })

      console.log('🔄 تم تحديث عداد الإيصالات')

      return NextResponse.json({
        member: updatedMember,
        receipt: {
          receiptNumber: receipt.receiptNumber,
          amount: receipt.amount,
          itemDetails: JSON.parse(receipt.itemDetails),
          createdAt: receipt.createdAt
        }
      }, { status: 200 })

    } catch (receiptError) {
      console.error('❌ خطأ في إنشاء إيصال التجديد:', receiptError)
      // العضو تم تحديثه بنجاح، لكن الإيصال فشل
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