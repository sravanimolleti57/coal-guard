import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const url = new URL(req.url);
    const documentId = url.searchParams.get('documentId');

    const whereClause: any = {};
    if (documentId) whereClause.documentId = documentId;

    const precautions = await prisma.precaution.findMany({
      where: whereClause,
      include: {
        document: { select: { id: true, title: true, mine: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ precautions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch corrective actions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const body = await req.json();
    const { documentId, description, responsiblePerson, dueDays, priority } = body;

    if (!documentId || !description) {
      return NextResponse.json({ error: 'documentId and description are required' }, { status: 400 });
    }

    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const formattedDesc = `[${priority || 'MEDIUM'} PRIORITY] ${description} ${
      responsiblePerson ? `(Assigned: ${responsiblePerson})` : ''
    } ${dueDays ? `(Due in ${dueDays} days)` : ''}`;

    const precaution = await prisma.precaution.create({
      data: {
        documentId,
        description: formattedDesc,
        status: 'In Progress',
      },
    });

    if (authUser) {
      await prisma.auditLog.create({
        data: {
          userId: authUser.id,
          userName: authUser.name,
          role: authUser.role,
          action: 'CREATE_CORRECTIVE_ACTION',
          module: 'DOCS',
          recordId: precaution.id,
          newValue: JSON.stringify({ documentId, description: formattedDesc }),
        },
      });
    }

    return NextResponse.json({ precaution, message: 'Corrective action created successfully' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create corrective action' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    const body = await req.json();
    const { precautionId, status } = body;

    if (!precautionId || !status) {
      return NextResponse.json({ error: 'precautionId and status are required' }, { status: 400 });
    }

    const updated = await prisma.precaution.update({
      where: { id: precautionId },
      data: {
        status,
        completedAt: status === 'Completed' || status === 'CLOSED' ? new Date() : null,
      },
    });

    return NextResponse.json({ precaution: updated, message: 'Status updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update status' }, { status: 500 });
  }
}
