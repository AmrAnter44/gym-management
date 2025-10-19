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
    return NextResponse.json({ error: 'فشل جلب الأعضاء' }, { status: 500 })
  }
}

// POST - إضافة عضو جديد
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { memberNumber, name, phone, inBodyScans, invitations, subscriptionPrice, remainingAmount, notes, expiryDate } = body

    // التحقق من أن رقم العضوية غير مستخدم
    if (memberNumber) {
      const existingMember = await prisma.member.findUnique({
        where: { memberNumber: parseInt(memberNumber) }
      })
      
      if (existingMember) {
        return NextResponse.json(
          { error: `رقم العضوية ${memberNumber} مستخدم بالفعل` }, 
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
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    })

    // إنشاء إيصال تلقائياً إذا كان هناك دفع
    if (subscriptionPrice > 0) {
      // جلب رقم الإيصال الحالي
      let counter = await prisma.receiptCounter.findUnique({ where: { id: 1 } })
      
      if (!counter) {
        counter = await prisma.receiptCounter.create({
          data: { id: 1, current: 1000 }
        })
      }

      // إنشاء الإيصال
      await prisma.receipt.create({
        data: {
          receiptNumber: counter.current,
          type: 'Member',
          amount: subscriptionPrice - remainingAmount,
          itemDetails: JSON.stringify({
            memberNumber: member.memberNumber,
            memberName: name,
            subscriptionPrice,
            paidAmount: subscriptionPrice - remainingAmount,
            remainingAmount,
          }),
          memberId: member.id,
        },
      })

      // تحديث العداد
      await prisma.receiptCounter.update({
        where: { id: 1 },
        data: { current: counter.current + 1 }
      })
    }

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل إضافة العضو' }, { status: 500 })
  }
}

// PUT - تحديث عضو
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...data,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null
      },
    })

    return NextResponse.json(member)
  } catch (error) {
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
    return NextResponse.json({ error: 'فشل حذف العضو' }, { status: 500 })
  }
}