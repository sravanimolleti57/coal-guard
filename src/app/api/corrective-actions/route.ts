import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const violationId = searchParams.get('violationId');

    const where: any = {};
    if (violationId) where.violationId = violationId;

    const correctiveActions = await prisma.correctiveAction.findMany({
      where,
      include: {
        violation: {
          include: {
            mine: { select: { id: true, name: true, code: true } },
            category: true,
          },
        },
        assignedTo: { select: { id: true, name: true, email: true } },
        timelines: {
          include: { performedBy: { select: { id: true, name: true, role: true } } },
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { deadline: 'asc' },
    });

    return NextResponse.json({ correctiveActions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch corrective actions' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, note, evidenceUrl, escalationLevel } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Corrective Action ID and status required' }, { status: 400 });
    }

    const existing = await prisma.correctiveAction.findUnique({
      where: { id },
      include: { violation: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Corrective action not found' }, { status: 404 });
    }

    const updated = await prisma.correctiveAction.update({
      where: { id },
      data: {
        status,
        evidenceUrl: evidenceUrl ?? existing.evidenceUrl,
        escalationLevel: escalationLevel !== undefined ? escalationLevel : existing.escalationLevel,
        verifiedAt: status === 'VERIFIED_CLOSED' ? new Date() : existing.verifiedAt,
        verifiedById: status === 'VERIFIED_CLOSED' ? authUser.id : existing.verifiedById,
      },
    });

    // Add activity timeline record
    await prisma.actionTimeline.create({
      data: {
        correctiveActionId: id,
        status,
        note: note || `Action status updated to ${status} by ${authUser.name}`,
        performedById: authUser.id,
      },
    });

    // If verified closed, close the underlying violation as well
    if (status === 'VERIFIED_CLOSED') {
      await prisma.violation.update({
        where: { id: existing.violationId },
        data: {
          status: 'CLOSED',
          closureDate: new Date(),
        },
      });
    } else if (status === 'ESCALATED') {
      await prisma.violation.update({
        where: { id: existing.violationId },
        data: { status: 'ESCALATED' },
      });

      // Dispatch alert
      await prisma.alert.create({
        data: {
          mineId: existing.violation.mineId,
          title: `ESCALATION: Overdue CAPA for Violation ${existing.violation.violationNumber}`,
          message: `Corrective action escalated to Level ${updated.escalationLevel}. Immediate GM action required.`,
          alertType: 'CRITICAL_VIOLATION',
          severity: 'CRITICAL',
          entityType: 'CORRECTIVE_ACTION',
          entityId: id,
        },
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        role: authUser.role,
        action: 'UPDATE_CORRECTIVE_ACTION',
        module: 'CAPA',
        recordId: id,
        previousValue: JSON.stringify(existing),
        newValue: JSON.stringify(updated),
      },
    });

    return NextResponse.json({ correctiveAction: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update corrective action' }, { status: 500 });
  }
}
