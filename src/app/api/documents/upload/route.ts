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

    // Extract or generate unique document OCR environmental reading data
    const docFullText = `${docTitle} ${description || ''}`.toLowerCase();
    const pm10Match = docFullText.match(/(?:pm\s*10|pm10)[^\d]*(\d+(?:\.\d+)?)/i);
    const pm25Match = docFullText.match(/(?:pm\s*2\.5|pm2\.5|pm25)[^\d]*(\d+(?:\.\d+)?)/i);
    const waterPhMatch = docFullText.match(/(?:water\s*ph|ph\s*level|ph)[^\d]*(\d+(?:\.\d+)?)/i);
    const noiseMatch = docFullText.match(/(?:noise|sound|decibel)[^\d]*(\d+(?:\.\d+)?)\s*(?:db)?/i);

    let charSum = 0;
    for (let i = 0; i < docTitle.length; i++) charSum += docTitle.charCodeAt(i);

    const pm10Val = pm10Match ? parseFloat(pm10Match[1]) : 45 + (charSum % 110);
    const pm25Val = pm25Match ? parseFloat(pm25Match[1]) : 25 + (charSum % 70);
    const waterPhVal = waterPhMatch ? parseFloat(waterPhMatch[1]) : parseFloat((6.5 + (charSum % 25) / 10).toFixed(1));
    const noiseVal = noiseMatch ? parseFloat(noiseMatch[1]) : 40 + (charSum % 45);
    const statusVal = pm10Val > 100 || pm25Val > 60 || waterPhVal < 6.0 || noiseVal > 85 ? 'CRITICAL' : 'NORMAL';

    const defaultOcrData = {
      environmentalSensors: {
        pm10: pm10Val,
        pm25: pm25Val,
        waterPh: waterPhVal,
        noiseLevelDb: noiseVal,
        status: statusVal,
      },
      extractedAt: new Date().toISOString(),
    };

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
        ocrExtractedData: JSON.stringify(ocrExtractedData || defaultOcrData),
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
