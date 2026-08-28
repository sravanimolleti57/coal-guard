import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { status, isRead } = body;

    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: status || 'READ',
        isRead: isRead !== undefined ? isRead : true,
      },
    });

    return NextResponse.json({ alert });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update alert' }, { status: 500 });
  }
}
