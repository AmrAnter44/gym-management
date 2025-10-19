import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const ptId = searchParams.get('ptId')
    const dayUseId = searchParams.get('dayUseId')

    let receipts

    if (memberId) {
      receipts = await prisma.receipt.findMany({
        where: { memberId },
        orderBy: { createdAt: 'desc' }
      })
    } else if (ptId) {
      receipts = await prisma.receipt.findMany({
        where: { ptId },
        orderBy: { createdAt: 'desc' }
      })
    } else if (dayUseId) {
      receipts = await prisma.receipt.findMany({
        where: { dayUseId },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      receipts = await prisma.receipt.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    }

    return NextResponse.json(receipts)
  } catch (error) {
    return NextResponse.json({ error: 'فشل جلب الإيصالات' }, { status: 500 })
  }
}