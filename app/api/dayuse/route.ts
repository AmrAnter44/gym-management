import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET
export async function GET() {
  try {
    const entries = await prisma.dayUseInBody.findMany({
      orderBy: { createdAt: 'desc' },
      include: { receipts: true }
    })
    return NextResponse.json(entries)
  } catch (error) {
    return NextResponse.json({ error: 'فشل جلب البيانات' }, { status: 500 })
  }
}

// POST
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, serviceType, price, staffName } = body

    // إنشاء الإدخال
    const entry = await prisma.dayUseInBody.create({
      data: {
        name,
        phone,
        serviceType,
        price,
        staffName,
      },
    })

    // إنشاء إيصال
    let counter = await prisma.receiptCounter.findUnique({ where: { id: 1 } })
    
    if (!counter) {
      counter = await prisma.receiptCounter.create({
        data: { id: 1, current: 1000 }
      })
    }

    await prisma.receipt.create({
      data: {
        receiptNumber: counter.current,
        type: serviceType,
        amount: price,
        itemDetails: JSON.stringify({
          name,
          serviceType,
          price,
          staffName,
        }),
        dayUseId: entry.id,
      },
    })

    await prisma.receiptCounter.update({
      where: { id: 1 },
      data: { current: counter.current + 1 }
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل إضافة الإدخال' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'الرقم مطلوب' }, { status: 400 })
    }

    await prisma.dayUseInBody.delete({ where: { id } })
    return NextResponse.json({ message: 'تم الحذف بنجاح' })
  } catch (error) {
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 })
  }
}