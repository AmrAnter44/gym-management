import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET - جلب كل الموظفين
export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        expenses: {
          where: { type: 'staff_loan', isPaid: false }
        }
      }
    })
    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'فشل جلب الموظفين' }, { status: 500 })
  }
}

// POST - إضافة موظف جديد
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone, position, salary, notes } = body

    const staff = await prisma.staff.create({
      data: {
        name,
        phone,
        position,
        salary,
        notes,
      },
    })

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Error creating staff:', error)
    return NextResponse.json({ error: 'فشل إضافة الموظف' }, { status: 500 })
  }
}

// PUT - تحديث موظف
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    const staff = await prisma.staff.update({
      where: { id },
      data,
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error updating staff:', error)
    return NextResponse.json({ error: 'فشل تحديث الموظف' }, { status: 500 })
  }
}

// DELETE - حذف موظف
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'رقم الموظف مطلوب' }, { status: 400 })
    }

    await prisma.staff.delete({ where: { id } })
    return NextResponse.json({ message: 'تم الحذف بنجاح' })
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json({ error: 'فشل حذف الموظف' }, { status: 500 })
  }
}