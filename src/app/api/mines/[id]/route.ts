import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const mine = await prisma.mine.findUnique({
      where: { id },
      include: {
        subsidiary: true,
        region: true,
        zones: true,
        users: { select: { id: true, name: true, email: true, role: true, designation: true } },
        compliances: { include: { requirement: true } },
        violations: {
          include: { category: true, correctiveActions: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        riskScores: { orderBy: { calculatedAt: 'desc' }, take: 1 },
        environmentalReadings: { orderBy: { timestamp: 'desc' }, take: 5 },
        productionRecords: { orderBy: { date: 'desc' }, take: 10 },
      },
    });

    if (!mine) {
      return NextResponse.json({ error: 'Mine not found' }, { status: 404 });
    }

    return NextResponse.json({ mine });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch mine details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.mine.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Mine not found' }, { status: 404 });
    }

    const updated = await prisma.mine.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        status: body.status ?? existing.status,
        productionTarget: body.productionTarget !== undefined ? parseFloat(body.productionTarget) : existing.productionTarget,
        contactName: body.contactName ?? existing.contactName,
        contactEmail: body.contactEmail ?? existing.contactEmail,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        role: authUser.role,
        action: 'UPDATE',
        module: 'MINES',
        recordId: id,
        previousValue: JSON.stringify(existing),
        newValue: JSON.stringify(updated),
      },
    });

    return NextResponse.json({ mine: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update mine' }, { status: 500 });
  }
}
