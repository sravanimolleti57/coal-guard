import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mineId = searchParams.get('mineId');
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('riskLevel');

    const authUser = getAuthUser(req);

    const where: any = {};
    if (mineId) where.mineId = mineId;
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;

    // Filter documents by manager identity if role is MANAGER or MINE_OFFICIAL
    if (authUser && (authUser.role === 'MANAGER' || authUser.role === 'MINE_OFFICIAL')) {
      where.OR = [
        { uploadedById: authUser.id },
        ...(authUser.mineId ? [{ mineId: authUser.mineId }] : []),
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        mine: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { id: true, name: true, email: true, role: true } },
        complianceRequirement: true,
        riskFindings: {
          include: { requirement: true },
        },
        precautions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error('GET /api/documents error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch documents' }, { status: 500 });
  }
}
