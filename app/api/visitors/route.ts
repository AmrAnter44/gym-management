import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET
export async function GET() {
  try {
    const visitors = await prisma.visitor.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(visitors)
  } catch (error) {
    return NextResponse.json({ error: 'فشل جلب الزوار' }, { status: 500 })
  }
}

// POST
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, notes } = body

    const visitor = await prisma.visitor.create({
      data: { name, phone, notes },
    })

    return NextResponse.json(visitor, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'فشل إضافة الزائر' }, { status: 500 })
  }
}

// PUT
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    const visitor = await prisma.visitor.update({
      where: { id },
      data,
    })

    return NextResponse.json(visitor)
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
      return NextResponse.json({ error: 'الرقم مطلوب' }, { status: 400 })
    }

    await prisma.visitor.delete({ where: { id } })
    return NextResponse.json({ message: 'تم الحذف بنجاح' })
  } catch (error) {
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 })
  }
}