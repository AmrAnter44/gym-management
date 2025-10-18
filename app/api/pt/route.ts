import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - جلب جميع جلسات PT
export async function GET() {
  try {
    const ptSessions = await prisma.pT.findMany({
      orderBy: { createdAt: 'desc' },
      include: { receipts: true }
    })
    return NextResponse.json(ptSessions)
  } catch (error) {
    return NextResponse.json({ error: 'فشل جلب البيانات' }, { status: 500 })
  }
}

// POST - إضافة جلسة PT جديدة
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientName, phone, sessionsPurchased, coachName, pricePerSession } = body

    // إنشاء جلسة PT
    const pt = await prisma.pT.create({
      data: {
        clientName,
        phone,
        sessionsPurchased,
        sessionsRemaining: sessionsPurchased,
        coachName,
        pricePerSession,
      },
    })

    // إنشاء إيصال
    const totalAmount = sessionsPurchased * pricePerSession

    let counter = await prisma.receiptCounter.findUnique({ where: { id: 1 } })
    
    if (!counter) {
      counter = await prisma.receiptCounter.create({
        data: { id: 1, current: 1000 }
      })
    }

    await prisma.receipt.create({
      data: {
        receiptNumber: counter.current,
        type: 'PT',
        amount: totalAmount,
        itemDetails: JSON.stringify({
          clientName,
          sessionsPurchased,
          pricePerSession,
          coachName,
          totalAmount,
        }),
        ptId: pt.id,
      },
    })

    await prisma.receiptCounter.update({
      where: { id: 1 },
      data: { current: counter.current + 1 }
    })

    return NextResponse.json(pt, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل إضافة الجلسة' }, { status: 500 })
  }
}

// PUT - تحديث جلسة (مثل تسجيل حضور جلسة)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, action } = body

    if (action === 'use_session') {
      const pt = await prisma.pT.findUnique({ where: { id } })
      
      if (!pt || pt.sessionsRemaining <= 0) {
        return NextResponse.json({ error: 'لا يوجد جلسات متبقية' }, { status: 400 })
      }

      const updated = await prisma.pT.update({
        where: { id },
        data: { sessionsRemaining: pt.sessionsRemaining - 1 },
      })

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'إجراء غير صحيح' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'رقم الجلسة مطلوب' }, { status: 400 })
    }

    await prisma.pT.delete({ where: { id } })
    return NextResponse.json({ message: 'تم الحذف بنجاح' })
  } catch (error) {
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 })
  }
}