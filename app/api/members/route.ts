import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET - جلب كل الأعضاء
export async function GET() {
  try {
    const members = await prisma.member.findMany({
      orderBy: { createdAt: 'desc' },
      include: { receipts: true }
    })
    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'فشل جلب الأعضاء' }, { status: 500 })
  }
}

// POST - إضافة عضو جديد
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { memberNumber, name, phone, inBodyScans, invitations, subscriptionPrice, remainingAmount, notes, startDate, expiryDate } = body

    console.log('📝 إضافة عضو جديد:', { memberNumber, name, subscriptionPrice, startDate, expiryDate })

    // التحقق من أن رقم العضوية غير مستخدم
    if (memberNumber) {
      const existingMember = await prisma.member.findUnique({
        where: { memberNumber: parseInt(memberNumber) }
      })
      
      if (existingMember) {
        console.error('❌ رقم العضوية مستخدم:', memberNumber)
        return NextResponse.json(
          { error: `رقم العضوية ${memberNumber} مستخدم بالفعل` }, 
          { status: 400 }
        )
      }
    }

    // التحقق من التواريخ
    if (startDate && expiryDate) {
      const start = new Date(startDate)
      const end = new Date(expiryDate)
      
      if (end <= start) {
        return NextResponse.json(
          { error: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية' },
          { status: 400 }
        )
      }
    }

    // إنشاء العضو
    const member = await prisma.member.create({
      data: {
        memberNumber: memberNumber ? parseInt(memberNumber) : undefined,
        name,
        phone,
        inBodyScans: inBodyScans || 0,
        invitations: invitations || 0,
        subscriptionPrice,
        remainingAmount: remainingAmount || 0,
        notes,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    })

    console.log('✅ تم إنشاء العضو:', member.id)

    // إنشاء إيصال دائماً
    try {
      let counter = await prisma.receiptCounter.findUnique({ where: { id: 1 } })
      
      if (!counter) {
        console.log('📊 إنشاء عداد الإيصالات لأول مرة')
        counter = await prisma.receiptCounter.create({
          data: { id: 1, current: 1000 }
        })
      }

      console.log('🧾 رقم الإيصال التالي:', counter.current)

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
          receiptNumber: counter.current,
          type: 'Member',
          amount: paidAmount,
          itemDetails: JSON.stringify({
            memberNumber: member.memberNumber,
            memberName: name,
            subscriptionPrice,
            paidAmount,
            remainingAmount: remainingAmount || 0,
            startDate: startDate,
            expiryDate: expiryDate,
            subscriptionDays: subscriptionDays,
          }),
          memberId: member.id,
        },
      })

      console.log('✅ تم إنشاء الإيصال:', receipt.receiptNumber)

      await prisma.receiptCounter.update({
        where: { id: 1 },
        data: { current: counter.current + 1 }
      })

      console.log('🔄 تم تحديث عداد الإيصالات إلى:', counter.current + 1)
    } catch (receiptError) {
      console.error('❌ خطأ في إنشاء الإيصال:', receiptError)
    }

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('❌ خطأ في إضافة العضو:', error)
    return NextResponse.json({ error: 'فشل إضافة العضو' }, { status: 500 })
  }
}

// PUT - تحديث عضو
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    const updateData: any = { ...data }
    
    if (data.startDate) {
      updateData.startDate = new Date(data.startDate)
    }
    if (data.expiryDate) {
      updateData.expiryDate = new Date(data.expiryDate)
    }

    const member = await prisma.member.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json({ error: 'فشل تحديث العضو' }, { status: 500 })
  }
}

// DELETE - حذف عضو
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'رقم العضو مطلوب' }, { status: 400 })
    }

    await prisma.member.delete({ where: { id } })
    return NextResponse.json({ message: 'تم الحذف بنجاح' })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json({ error: 'فشل حذف العضو' }, { status: 500 })
  }
}