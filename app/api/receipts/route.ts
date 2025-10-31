import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const ptNumber = searchParams.get('ptNumber') // ✅ تم التغيير
    const dayUseId = searchParams.get('dayUseId')
    const limit = searchParams.get('limit')

    let receipts

    if (memberId) {
      receipts = await prisma.receipt.findMany({
        where: { memberId },
        orderBy: { createdAt: 'desc' }
      })
    } else if (ptNumber) { // ✅ تم التغيير
      receipts = await prisma.receipt.findMany({
        where: { ptNumber: parseInt(ptNumber) }, // ✅ تم التغيير
        orderBy: { createdAt: 'desc' }
      })
    } else if (dayUseId) {
      receipts = await prisma.receipt.findMany({
        where: { dayUseId },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // جلب كل الإيصالات أو عدد محدد
      receipts = await prisma.receipt.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit ? parseInt(limit) : undefined
      })
    }

    return NextResponse.json(receipts)
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json({ error: 'فشل جلب الإيصالات' }, { status: 500 })
  }
}