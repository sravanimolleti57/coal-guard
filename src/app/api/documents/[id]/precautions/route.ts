import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const precautions = await prisma.precaution.findMany({
      where: { documentId: id },
      include: {
        riskFinding: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const pendingCount = precautions.filter((p) => p.status === 'Pending').length;
    const inProgressCount = precautions.filter((p) => p.status === 'In Progress').length;
    const completedCount = precautions.filter((p) => p.status === 'Completed').length;
    const isAllCompleted = precautions.length > 0 && precautions.every((p) => p.status === 'Completed');

    return NextResponse.json({
      documentId: id,
      precautions,
      stats: {
        total: precautions.length,
        pendingCount,
        inProgressCount,
        completedCount,
        isAllCompleted,
      },
    });
  } catch (error: any) {
    console.error('GET precautions error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch precautions' }, { status: 500 });
  }
}
