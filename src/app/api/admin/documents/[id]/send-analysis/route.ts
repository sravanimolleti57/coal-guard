import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Admin clicks "Send Analysis to Manager" -> Status becomes ANALYSIS_COMPLETED -> Visible to Manager
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

    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        status: 'ANALYSIS_COMPLETED',
        analysisStatus: 'ANALYSIS_COMPLETED',
        analyzedAt: new Date(),
      },
    });

    // Create Notification Alert for Manager
    if (doc.uploadedById) {
      await prisma.alert.create({
        data: {
          documentId: id,
          mineId: doc.mineId,
          title: '🟢 AI RISK ANALYSIS COMPLETED',
          message: `Admin ${authUser?.name || 'Officer'} has completed the AI risk analysis for document "${doc.title || doc.name}". Result is now available in your Review & Analysis page.`,
          alertType: 'SAFETY_ANALYSIS',
          type: 'SAFETY_ANALYSIS',
          severity: doc.riskLevel === 'GOOD' ? 'INFO' : 'HIGH',
          status: 'UNREAD',
          isRead: false,
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
          action: 'SEND_ANALYSIS_TO_MANAGER',
          module: 'DOCS',
          recordId: id,
          newValue: JSON.stringify({ status: 'ANALYSIS_COMPLETED', analyzedAt: new Date() }),
        },
      });
    }

    return NextResponse.json({
      message: 'Analysis sent to Manager successfully!',
      document: updatedDoc,
    });
  } catch (error: any) {
    console.error('Send analysis error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send analysis to Manager' }, { status: 500 });
  }
}
