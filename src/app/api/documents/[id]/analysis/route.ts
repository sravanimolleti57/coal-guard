import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const doc = await prisma.document.findUnique({
      where: { id },
      include: {
        mine: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { id: true, name: true, email: true, role: true } },
        riskFindings: {
          include: { requirement: true },
        },
        precautions: true,
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const passedFindings = doc.riskFindings.filter((rf) => rf.passed);
    const failedFindings = doc.riskFindings.filter((rf) => !rf.passed);

    return NextResponse.json({
      documentId: doc.id,
      documentName: doc.name || doc.title,
      docType: doc.docType || doc.fileType,
      status: doc.status,
      analysisStatus: doc.analysisStatus,
      riskLevel: doc.riskLevel || 'PENDING',
      riskScore: doc.riskScore ?? null,
      decision: doc.aiRecommendation || (doc.riskLevel === 'GOOD' ? 'PROCEED' : 'DO_NOT_PROCEED'),
      aiSummary: doc.aiSummary || 'Document pending AI analysis.',
      analyzedAt: doc.analyzedAt,
      uploadedBy: doc.uploadedBy,
      uploadedAt: doc.createdAt,
      mine: doc.mine,
      findings: {
        totalChecked: doc.riskFindings.length,
        passedCount: passedFindings.length,
        failedCount: failedFindings.length,
        passed: passedFindings,
        failed: failedFindings,
      },
      precautions: doc.precautions,
      recentAlerts: doc.alerts,
    });
  } catch (error: any) {
    console.error('GET /api/documents/[id]/analysis error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch analysis' }, { status: 500 });
  }
}
