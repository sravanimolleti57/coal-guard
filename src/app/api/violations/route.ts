import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mineId = searchParams.get('mineId');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');

    const where: any = {};
    if (mineId) where.mineId = mineId;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const violations = await prisma.violation.findMany({
      where,
      include: {
        mine: { select: { id: true, name: true, code: true } },
        zone: true,
        category: true,
        responsiblePerson: { select: { id: true, name: true, email: true } },
        correctiveActions: {
          include: {
            assignedTo: { select: { id: true, name: true } },
            timelines: { orderBy: { timestamp: 'desc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ violations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch violations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mineId, zoneId, categoryId, description, severity, responsiblePersonId, dueDate } = body;

    if (!mineId || !description || !severity) {
      return NextResponse.json({ error: 'Mine, description, and severity are required' }, { status: 400 });
    }

    const cat = categoryId ? categoryId : (await prisma.complianceCategory.findFirst())?.id;
    const violationNumber = `VIOL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const violation = await prisma.violation.create({
      data: {
        violationNumber,
        mineId,
        zoneId: zoneId || null,
        categoryId: cat!,
        description,
        severity,
        status: 'ASSIGNED',
        responsiblePersonId: responsiblePersonId || null,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    });

    // Auto create corrective action task
    await prisma.correctiveAction.create({
      data: {
        violationId: violation.id,
        title: `Rectification Plan for ${violationNumber}`,
        description: `Implement immediate corrective measures for: ${description}`,
        assignedToId: responsiblePersonId || authUser.id,
        deadline: violation.dueDate,
        status: 'ASSIGNED',
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        role: authUser.role,
        action: 'CREATE_VIOLATION',
        module: 'VIOLATION',
        recordId: violation.id,
        newValue: JSON.stringify(violation),
      },
    });

    return NextResponse.json({ violation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create violation' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, closureDate, evidenceUrl } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Violation ID and Status are required' }, { status: 400 });
    }

    const existing = await prisma.violation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Violation not found' }, { status: 404 });
    }

    const updated = await prisma.violation.update({
      where: { id },
      data: {
        status,
        closureDate: status === 'CLOSED' ? new Date() : existing.closureDate,
        evidenceUrl: evidenceUrl ?? existing.evidenceUrl,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        role: authUser.role,
        action: 'UPDATE_VIOLATION_STATUS',
        module: 'VIOLATION',
        recordId: id,
        previousValue: JSON.stringify(existing),
        newValue: JSON.stringify(updated),
      },
    });

    return NextResponse.json({ violation: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update violation' }, { status: 500 });
  }
}
