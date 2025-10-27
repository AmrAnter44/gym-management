import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET - جلب كل جلسات PT
export async function GET() {
  try {
    const ptSessions = await prisma.pT.findMany({
      orderBy: { createdAt: 'desc' },
      include: { receipts: true }
    })
    return NextResponse.json(ptSessions)
  } catch (error) {
    console.error('Error fetching PT sessions:', error)
    return NextResponse.json({ error: 'فشل جلب جلسات PT' }, { status: 500 })
  }
}

// POST - إضافة جلسة PT جديدة
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      ptNumber, 
      clientName, 
      phone, 
      sessionsPurchased, 
      coachName, 
      pricePerSession,
      startDate,
      expiryDate,
      paymentMethod
    } = body

    console.log('📝 إضافة جلسة PT جديدة:', { ptNumber, clientName, sessionsPurchased, startDate, expiryDate, paymentMethod })

    // التحقق من أن رقم PT غير مستخدم
    if (ptNumber) {
      const existingPT = await prisma.pT.findUnique({
        where: { ptNumber: parseInt(ptNumber) }
      })
      
      if (existingPT) {
        console.error('❌ رقم PT مستخدم:', ptNumber)
        return NextResponse.json(
          { error: `رقم PT ${ptNumber} مستخدم بالفعل` }, 
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

    // إنشاء جلسة PT
    const pt = await prisma.pT.create({
      data: {
        ptNumber: ptNumber ? parseInt(ptNumber) : undefined,
        clientName,
        phone,
        sessionsPurchased,
        sessionsRemaining: sessionsPurchased,
        coachName,
        pricePerSession,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    })

    console.log('✅ تم إنشاء جلسة PT:', pt.id)

    // إنشاء إيصال
    try {
      let counter = await prisma.receiptCounter.findUnique({ where: { id: 1 } })
      
      if (!counter) {
        console.log('📊 إنشاء عداد الإيصالات لأول مرة')
        counter = await prisma.receiptCounter.create({
          data: { id: 1, current: 1000 }
        })
      }

      console.log('🧾 رقم الإيصال التالي:', counter.current)

      const totalAmount = sessionsPurchased * pricePerSession

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
          type: 'PT',
          amount: totalAmount,
          paymentMethod: paymentMethod || 'cash',
          itemDetails: JSON.stringify({
            ptNumber: pt.ptNumber,
            clientName,
            sessionsPurchased,
            pricePerSession,
            totalAmount,
            coachName,
            startDate: startDate,
            expiryDate: expiryDate,
            subscriptionDays: subscriptionDays,
          }),
          ptId: pt.id,
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

    return NextResponse.json(pt, { status: 201 })
  } catch (error) {
    console.error('❌ خطأ في إضافة جلسة PT:', error)
    return NextResponse.json({ error: 'فشل إضافة جلسة PT' }, { status: 500 })
  }
}

// PUT - تحديث جلسة PT (مثلاً: استخدام جلسة)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, action, ...data } = body

    if (action === 'use_session') {
      // استخدام جلسة
      const pt = await prisma.pT.findUnique({ where: { id } })
      
      if (!pt) {
        return NextResponse.json({ error: 'جلسة PT غير موجودة' }, { status: 404 })
      }

      if (pt.sessionsRemaining <= 0) {
        return NextResponse.json({ error: 'لا توجد جلسات متبقية' }, { status: 400 })
      }

      const updatedPT = await prisma.pT.update({
        where: { id },
        data: { sessionsRemaining: pt.sessionsRemaining - 1 },
      })

      return NextResponse.json(updatedPT)
    } else {
      // تحديث عادي
      const updateData: any = { ...data }
      
      if (data.startDate) {
        updateData.startDate = new Date(data.startDate)
      }
      if (data.expiryDate) {
        updateData.expiryDate = new Date(data.expiryDate)
      }

      const pt = await prisma.pT.update({
        where: { id },
        data: updateData,
      })

      return NextResponse.json(pt)
    }
  } catch (error) {
    console.error('Error updating PT:', error)
    return NextResponse.json({ error: 'فشل تحديث جلسة PT' }, { status: 500 })
  }
}

// DELETE - حذف جلسة PT
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'رقم جلسة PT مطلوب' }, { status: 400 })
    }

    await prisma.pT.delete({ where: { id } })
    return NextResponse.json({ message: 'تم الحذف بنجاح' })
  } catch (error) {
    console.error('Error deleting PT:', error)
    return NextResponse.json({ error: 'فشل حذف جلسة PT' }, { status: 500 })
  }
}