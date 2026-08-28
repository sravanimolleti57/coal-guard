import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = getAuthUser(req);
    const body = await req.json();
    const { status } = body;

    if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be one of: Pending, In Progress, Completed' },
        { status: 400 }
      );
    }

    const precaution = await prisma.precaution.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'Completed' ? new Date() : null,
      },
    });

    // Check if all precautions for document are completed
    const allPrecautions = await prisma.precaution.findMany({
      where: { documentId: precaution.documentId },
    });
    const allCompleted = allPrecautions.every((p) => p.status === 'Completed');

    if (allCompleted) {
      await prisma.document.update({
        where: { id: precaution.documentId },
        data: {
          status: 'RE_ANALYSIS_REQUESTED',
          analysisStatus: 'RE_ANALYSIS_REQUESTED',
        },
      });
    }

    // Audit Log
    if (authUser) {
      await prisma.auditLog.create({
        data: {
          userId: authUser.id,
          userName: authUser.name,
          role: authUser.role,
          action: 'UPDATE_PRECAUTION_STATUS',
          module: 'DOCS',
          recordId: precaution.id,
          newValue: JSON.stringify({ status, documentId: precaution.documentId }),
        },
      });
    }

    return NextResponse.json({
      precaution,
      allPrecautionsCompleted: allCompleted,
    });
  } catch (error: any) {
    console.error('PATCH precaution error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update precaution' }, { status: 500 });
  }
}
