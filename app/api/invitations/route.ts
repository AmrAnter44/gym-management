import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET: جلب جميع الدعوات أو دعوات عضو معين
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    const invitations = await prisma.invitation.findMany({
      where: memberId ? { memberId } : undefined,
      include: {
        member: {
          select: {
            memberNumber: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}

// POST: إضافة دعوة جديدة
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { memberId, guestName, guestPhone, notes } = body

    // التحقق من البيانات المطلوبة
    if (!memberId || !guestName || !guestPhone) {
      return NextResponse.json(
        { error: 'Member ID, guest name, and guest phone are required' },
        { status: 400 }
      )
    }

    // التحقق من وجود العضو وأن لديه دعوات متبقية
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (member.invitations <= 0) {
      return NextResponse.json({ error: 'No invitations remaining' }, { status: 400 })
    }

    // إنشاء سجل الدعوة وتحديث عدد الدعوات في معاملة واحدة
    const [invitation, updatedMember] = await prisma.$transaction([
      prisma.invitation.create({
        data: {
          guestName,
          guestPhone,
          notes,
          memberId,
        },
        include: {
          member: {
            select: {
              memberNumber: true,
              name: true,
            },
          },
        },
      }),
      prisma.member.update({
        where: { id: memberId },
        data: {
          invitations: {
            decrement: 1,
          },
        },
      }),
    ])

    return NextResponse.json({ invitation, updatedMember })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
  }
}

// DELETE: حذف دعوة
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 })
    }

    await prisma.invitation.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 })
  }
}