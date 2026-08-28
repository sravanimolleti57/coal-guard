import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mineId = searchParams.get('mineId');
    const status = searchParams.get('status');

    const where: any = {};
    if (mineId) where.mineId = mineId;
    if (status) where.status = status;

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        mine: { select: { id: true, name: true, code: true } },
        document: { select: { id: true, title: true, name: true, status: true, riskLevel: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.alert.count({
      where: {
        OR: [{ status: 'UNREAD' }, { isRead: false }],
        ...(mineId ? { mineId } : {}),
      },
    });

    return NextResponse.json({ alerts, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);

    const body = await req.json();
    const { id, status, markAllRead } = body;

    if (markAllRead) {
      await prisma.alert.updateMany({
        where: { OR: [{ status: 'UNREAD' }, { isRead: false }] },
        data: { status: 'READ', isRead: true },
      });
      return NextResponse.json({ success: true, message: 'All alerts marked read' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: status || 'READ',
        isRead: true,
      },
    });

    return NextResponse.json({ alert });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update alert' }, { status: 500 });
  }
}
