import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const body = await req.json();
    const { name, title, docType, fileType, mineId, description, fileUrl, ocrExtractedData } = body;

    const docTitle = name || title;
    const documentType = fileType || docType || 'SAFETY_PLAN';

    if (!docTitle || !mineId) {
      return NextResponse.json({ error: 'Document name/title and mine ID are required' }, { status: 400 });
    }

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const docNumber = `DOC-SAFETY-${new Date().getFullYear()}-${randomSuffix}`;

    const doc = await prisma.document.create({
      data: {
        title: docTitle,
        name: docTitle,
        docType: documentType,
        fileType: documentType,
        docNumber,
        mineId,
        description: description || null,
        fileUrl: fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploadedById: authUser ? authUser.id : null,
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        ocrExtractedData: ocrExtractedData ? JSON.stringify(ocrExtractedData) : null,
        status: 'PENDING_ADMIN_REVIEW',
        analysisStatus: 'PENDING_ADMIN_REVIEW',
      },
      include: {
        mine: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Audit Log
    if (authUser) {
      await prisma.auditLog.create({
        data: {
          userId: authUser.id,
          userName: authUser.name,
          role: authUser.role,
          action: 'UPLOAD_DOCUMENT',
          module: 'DOCS',
          recordId: doc.id,
          newValue: JSON.stringify({ name: doc.name, status: doc.status }),
        },
      });
    }

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error: any) {
    console.error('Upload document error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload document' }, { status: 500 });
  }
}
