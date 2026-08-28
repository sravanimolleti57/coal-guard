import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Manager requests re-analysis -> Document status set to RE_ANALYSIS_REQUESTED -> Sent to Admin Queue
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = getAuthUser(req);

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { uploadedBy: true, mine: true },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Set document status to RE_ANALYSIS_REQUESTED (Pending Admin Approval)
    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        status: 'RE_ANALYSIS_REQUESTED',
        analysisStatus: 'RE_ANALYSIS_REQUESTED',
      },
    });

    // Notify Admin of Manager's Re-Analysis Request
    await prisma.alert.create({
      data: {
        documentId: id,
        mineId: doc.mineId,
        title: '📩 MANAGER RE-ANALYSIS REQUEST',
        message: `Manager ${authUser?.name || doc.uploadedBy?.name || 'Mine Manager'} requested re-analysis for document "${doc.title || doc.name}". Awaiting Admin approval.`,
        alertType: 'SAFETY_ANALYSIS',
        type: 'SAFETY_ANALYSIS',
        severity: 'INFO',
        status: 'UNREAD',
        isRead: false,
      },
    });

    // Audit Log
    if (authUser) {
      await prisma.auditLog.create({
        data: {
          userId: authUser.id,
          userName: authUser.name,
          role: authUser.role,
          action: 'SUBMIT_RE_ANALYSIS_REQUEST',
          module: 'DOCS',
          recordId: id,
          newValue: JSON.stringify({ status: 'RE_ANALYSIS_REQUESTED' }),
        },
      });
    }

    return NextResponse.json({
      message: 'Re-analysis request submitted successfully! Pending Admin review & approval.',
      document: updatedDoc,
    });
  } catch (error: any) {
    console.error('Request re-analysis error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit re-analysis request' }, { status: 500 });
  }
}
