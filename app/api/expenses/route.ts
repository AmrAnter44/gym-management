import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET - جلب كل المصروفات
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const staffId = searchParams.get('staffId')

    let where: any = {}
    if (type) where.type = type
    if (staffId) where.staffId = staffId

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        staff: true
      }
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'فشل جلب المصروفات' }, { status: 500 })
  }
}

// POST - إضافة مصروف جديد
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, amount, description, notes, staffId } = body

    if (!type || !amount || !description) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة ناقصة' },
        { status: 400 }
      )
    }

    const expense = await prisma.expense.create({
      data: {
        type,
        amount,
        description,
        notes,
        staffId: staffId || null,
      },
      include: {
        staff: true
      }
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'فشل إضافة المصروف' }, { status: 500 })
  }
}

// PUT - تحديث مصروف (مثلاً تحديد سلفة كمدفوعة)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    const expense = await prisma.expense.update({
      where: { id },
      data,
      include: {
        staff: true
      }
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'فشل تحديث المصروف' }, { status: 500 })
  }
}

// DELETE - حذف مصروف
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'رقم المصروف مطلوب' }, { status: 400 })
    }

    await prisma.expense.delete({ where: { id } })
    return NextResponse.json({ message: 'تم الحذف بنجاح' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'فشل حذف المصروف' }, { status: 500 })
  }
}