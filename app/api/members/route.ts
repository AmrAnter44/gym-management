// app/api/members/route.ts - النسخة المُصلحة
import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

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

// GET - جلب كل الأعضاء
export async function GET() {
  try {
    console.log('🔍 بدء جلب الأعضاء...')
    
    const members = await prisma.member.findMany({
      orderBy: { createdAt: 'desc' },
      include: { receipts: true }
    })
    
    console.log('✅ تم جلب', members.length, 'عضو')
    
    if (!Array.isArray(members)) {
      console.error('❌ Prisma لم يرجع array:', typeof members)
      return NextResponse.json([], { status: 200 })
    }
    
    return NextResponse.json(members, { status: 200 })
  } catch (error) {
    console.error('❌ Error fetching members:', error)
    
    return NextResponse.json([], { 
      status: 200,
      headers: {
        'X-Error': 'Failed to fetch members'
      }
    })
  }
}

// POST - إضافة عضو جديد
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      memberNumber, 
      name, 
      phone, 
      profileImage,
      inBodyScans, 
      invitations, 
      freePTSessions, 
      subscriptionPrice, 
      remainingAmount, 
      notes, 
      startDate, 
      expiryDate, 
      paymentMethod 
    } = body

    console.log('📝 إضافة عضو جديد:', { memberNumber, name, profileImage })

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
        profileImage,
        inBodyScans: inBodyScans || 0,
        invitations: invitations || 0,
        freePTSessions: freePTSessions || 0,
        subscriptionPrice,
        remainingAmount: remainingAmount || 0,
        notes,
        startDate: startDate ? new Date(startDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    })

    console.log('✅ تم إنشاء العضو:', member.id, 'صورة:', member.profileImage)

    // إنشاء إيصال دائماً
    let receiptData = null
    try {
      let counter = await prisma.receiptCounter.findUnique({ where: { id: 1 } })
      
      if (!counter) {
        console.log('📊 إنشاء عداد الإيصالات لأول مرة')
        counter = await prisma.receiptCounter.create({
          data: { id: 1, current: 1000 }
        })
      }

      console.log('🧾 رقم الإيصال من العداد:', counter.current)

      // ✅ البحث عن رقم إيصال متاح
      const availableReceiptNumber = await getNextAvailableReceiptNumber(counter.current)
      
      console.log('✅ سيتم استخدام رقم الإيصال:', availableReceiptNumber)

      const paidAmount = subscriptionPrice - (remainingAmount || 0)

      let subscriptionDays = null
      if (startDate && expiryDate) {
        const start = new Date(startDate)
        const end = new Date(expiryDate)
        subscriptionDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      }

      const receipt = await prisma.receipt.create({
        data: {
          receiptNumber: availableReceiptNumber, // ✅ استخدام الرقم المتاح
          type: 'Member',
          amount: paidAmount,
          paymentMethod: paymentMethod || 'cash',
          itemDetails: JSON.stringify({
            memberNumber: member.memberNumber,
            memberName: name,
            subscriptionPrice,
            paidAmount,
            remainingAmount: remainingAmount || 0,
            freePTSessions: freePTSessions || 0,
            inBodyScans: inBodyScans || 0,
            invitations: invitations || 0,
            startDate: startDate,
            expiryDate: expiryDate,
            subscriptionDays: subscriptionDays,
          }),
          memberId: member.id,
        },
      })

      console.log('✅ تم إنشاء الإيصال:', receipt.receiptNumber)

      // ✅ تحديث العداد للرقم بعد الرقم المستخدم
      const newCounterValue = availableReceiptNumber + 1
      await prisma.receiptCounter.update({
        where: { id: 1 },
        data: { current: newCounterValue }
      })

      console.log('🔄 تم تحديث عداد الإيصالات إلى:', newCounterValue)

      // ✅ تجهيز بيانات الإيصال للإرجاع
      receiptData = {
        receiptNumber: receipt.receiptNumber,
        amount: receipt.amount,
        paymentMethod: receipt.paymentMethod,
        createdAt: receipt.createdAt,
        itemDetails: JSON.parse(receipt.itemDetails)
      }

    } catch (receiptError) {
      console.error('❌ خطأ في إنشاء الإيصال:', receiptError)
      // إذا كانت المشكلة في رقم الإيصال المكرر
      if (receiptError instanceof Error && receiptError.message.includes('Unique constraint')) {
        console.error('❌ رقم الإيصال مكرر! المحاولة مرة أخرى...')
      }
    }

    // ✅ إرجاع بيانات العضو + الإيصال
    return NextResponse.json({
      success: true,
      member: member,
      receipt: receiptData
    }, { status: 201 })

  } catch (error) {
    console.error('❌ خطأ في إضافة العضو:', error)
    return NextResponse.json({ error: 'فشل إضافة العضو' }, { status: 500 })
  }
}

// PUT - تحديث عضو
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, profileImage, ...data } = body

    const updateData: any = { ...data }
    
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage
    }
    
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