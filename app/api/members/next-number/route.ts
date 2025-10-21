import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// جلب رقم العضوية التالي
export async function GET() {
  try {
    // جلب آخر رقم عضوية
    const lastMember = await prisma.member.findFirst({
      orderBy: { memberNumber: 'desc' },
      select: { memberNumber: true }
    })

    // الرقم التالي
    const nextNumber = lastMember ? lastMember.memberNumber + 1 : 1001

    return NextResponse.json({ 
      nextNumber,
      message: 'تم جلب رقم العضوية التالي بنجاح'
    })
  } catch (error) {
    console.error('Error fetching next member number:', error)
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

    // التحقق من عدم وجود رقم عضوية بهذا الرقم
    const existingMember = await prisma.member.findUnique({
      where: { memberNumber: parseInt(startNumber) }
    })

    if (existingMember) {
      return NextResponse.json({ 
        error: `رقم العضوية ${startNumber} مستخدم بالفعل` 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      newNumber: parseInt(startNumber),
      message: `تم تحديث رقم العضوية ليبدأ من ${startNumber}`
    })
  } catch (error) {
    console.error('Error updating member counter:', error)
    return NextResponse.json({ 
      error: 'فشل تحديث رقم العضوية' 
    }, { status: 500 })
  }
}