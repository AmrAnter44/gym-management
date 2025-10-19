import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  try {
    // جلب آخر رقم عضوية
    const lastMember = await prisma.member.findFirst({
      orderBy: { memberNumber: 'desc' },
      select: { memberNumber: true }
    })

    // الرقم التالي
    const nextNumber = lastMember ? lastMember.memberNumber + 1 : 1001

    return NextResponse.json({ nextNumber })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل جلب الرقم' }, { status: 500 })
  }
}