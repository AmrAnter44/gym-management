import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// جلب رقم PT التالي
export async function GET() {
  try {
    // جلب آخر رقم PT
    const lastPT = await prisma.pT.findFirst({
      orderBy: { ptNumber: 'desc' },
      select: { ptNumber: true }
    })

    // الرقم التالي
    const nextNumber = lastPT ? lastPT.ptNumber + 1 : 2001

    return NextResponse.json({ 
      nextNumber,
      message: 'تم جلب رقم PT التالي بنجاح'
    })
  } catch (error) {
    console.error('Error fetching next PT number:', error)
    return NextResponse.json({ 
      error: 'فشل جلب الرقم' 
    }, { status: 500 })
  }
}

// تحديث رقم البداية (للإعدادات)
export async function POST(request: Request) {
  try {
    const { startNumber } = await request.json()
    
    if (!startNumber || startNumber < 1) {
      return NextResponse.json({ 
        error: 'رقم البداية غير صحيح' 
      }, { status: 400 })
    }

    // التحقق من عدم وجود رقم PT بهذا الرقم
    const existingPT = await prisma.pT.findUnique({
      where: { ptNumber: parseInt(startNumber) }
    })

    if (existingPT) {
      return NextResponse.json({ 
        error: `رقم PT ${startNumber} مستخدم بالفعل` 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      newNumber: parseInt(startNumber),
      message: `تم تحديث رقم PT ليبدأ من ${startNumber}`
    })
  } catch (error) {
    console.error('Error updating PT counter:', error)
    return NextResponse.json({ 
      error: 'فشل تحديث رقم PT' 
    }, { status: 500 })
  }
}