import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = getAuthUser(req);

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.riskLevel === 'BAD' || doc.aiRecommendation === 'DO_NOT_PROCEED') {
      return NextResponse.json(
        {
          error: 'ACTION BLOCKED: Cannot proceed with a BAD safety document. Complete all mandatory precautions and request re-analysis.',
          riskLevel: doc.riskLevel,
          aiRecommendation: doc.aiRecommendation,
        },
        { status: 400 }
      );
    }

    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        status: 'APPROVED',
        aiRecommendation: 'PROCEED',
      },
    });

    // Audit Log
    if (authUser) {
      await prisma.auditLog.create({
        data: {
          userId: authUser.id,
          userName: authUser.name,
          role: authUser.role,
          action: 'PROCEED_DOCUMENT_APPROVED',
          module: 'DOCS',
          recordId: doc.id,
          newValue: JSON.stringify({ status: 'APPROVED', riskLevel: doc.riskLevel }),
        },
      });
    }

    return NextResponse.json({
      message: 'Document proceed action approved successfully.',
      document: updatedDoc,
    });
  } catch (error: any) {
    console.error('Proceed document error:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute proceed action' }, { status: 500 });
  }
}
