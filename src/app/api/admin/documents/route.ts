import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    // Require Admin / Super Admin authority
    if (!authUser || !['SUPER_ADMIN', 'ADMIN', 'REGULATORY_AUTHORITY'].includes(authUser.role)) {
      return NextResponse.json({ error: '403 Forbidden: Access Denied. Admin authorization required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const documents = await prisma.document.findMany({
      where,
      include: {
        mine: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { id: true, name: true, email: true, role: true } },
        riskFindings: {
          include: { requirement: true },
        },
        precautions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingCount = documents.filter((d) => d.status === 'PENDING_ADMIN_REVIEW' || d.status === 'UNDER_REVIEW').length;
    const analyzingCount = documents.filter((d) => d.status === 'AI_ANALYZING').length;
    const completedCount = documents.filter((d) => d.status === 'AI_ANALYSIS_COMPLETED' || d.status === 'APPROVED' || d.status === 'REJECTED').length;
    const goodCount = documents.filter((d) => d.riskLevel === 'GOOD').length;
    const badCount = documents.filter((d) => d.riskLevel === 'BAD').length;

    return NextResponse.json({
      documents,
      stats: {
        total: documents.length,
        pendingCount,
        analyzingCount,
        completedCount,
        goodCount,
        badCount,
      },
    });
  } catch (error: any) {
    console.error('Admin documents error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch admin documents' }, { status: 500 });
  }
}
