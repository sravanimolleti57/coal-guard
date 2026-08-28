import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mineId = searchParams.get('mineId');

    const where: any = {};
    if (mineId) where.mineId = mineId;

    const documents = await prisma.document.findMany({
      where,
      include: {
        mine: { select: { id: true, name: true, code: true } },
        complianceRequirement: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, docType, mineId, complianceRequirementId, fileUrl, simulateOcr } = body;

    if (!title || !docType || !mineId) {
      return NextResponse.json({ error: 'Title, document type, and mine ID are required' }, { status: 400 });
    }

    // OCR Service Abstraction
    const docNumber = `DOC-${docType.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const issueDate = new Date();
    const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const ocrExtractedData = simulateOcr
      ? JSON.stringify({
          documentTitle: title,
          extractedDocNumber: docNumber,
          documentType: docType,
          organization: 'Directorate General of Mines Safety (DGMS)',
          issueDate: issueDate.toISOString().split('T')[0],
          expiryDate: expiryDate.toISOString().split('T')[0],
          confidenceScore: 0.985,
          statutoryComplianceLinked: complianceRequirementId || 'DGMS-CMR-2017-106',
        })
      : null;

    const doc = await prisma.document.create({
      data: {
        title,
        docType,
        docNumber,
        mineId,
        complianceRequirementId: complianceRequirementId || null,
        fileUrl: fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        issueDate,
        expiryDate,
        ocrExtractedData,
        status: 'ACTIVE',
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        role: authUser.role,
        action: 'UPLOAD_DOCUMENT_OCR',
        module: 'DOCS',
        recordId: doc.id,
        newValue: JSON.stringify(doc),
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to upload document' }, { status: 500 });
  }
}
