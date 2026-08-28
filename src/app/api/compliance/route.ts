import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mineId = searchParams.get('mineId');
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');

    const where: any = {};
    if (mineId) where.mineId = mineId;
    if (status) where.status = status;
    if (categoryId) {
      where.requirement = { categoryId };
    }

    const mineCompliances = await prisma.mineCompliance.findMany({
      where,
      include: {
        mine: { select: { id: true, name: true, code: true } },
        requirement: { include: { category: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const categories = await prisma.complianceCategory.findMany();
    const requirements = await prisma.complianceRequirement.findMany({
      include: { category: true },
    });

    // Automatically recalculate stats & compliance score
    const total = mineCompliances.length;
    const completed = mineCompliances.filter((c) => c.status === 'COMPLIANT').length;
    const overdue = mineCompliances.filter((c) => c.status === 'OVERDUE').length;
    const dueSoon = mineCompliances.filter((c) => c.status === 'DUE_SOON').length;
    const underReview = mineCompliances.filter((c) => c.status === 'UNDER_REVIEW').length;
    const complianceScore = total > 0 ? Math.round((completed / total) * 100) : 100;

    return NextResponse.json({
      compliances: mineCompliances,
      categories,
      requirements,
      summary: {
        total,
        completed,
        overdue,
        dueSoon,
        underReview,
        complianceScore,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch compliance items' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, remarks, evidenceUrl } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const existing = await prisma.mineCompliance.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Compliance record not found' }, { status: 404 });
    }

    const completionDate = status === 'COMPLIANT' ? new Date() : existing.completionDate;

    const updated = await prisma.mineCompliance.update({
      where: { id },
      data: {
        status,
        remarks: remarks ?? existing.remarks,
        evidenceUrl: evidenceUrl ?? existing.evidenceUrl,
        completionDate,
      },
      include: {
        requirement: true,
        mine: true,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        role: authUser.role,
        action: 'UPDATE_COMPLIANCE_STATUS',
        module: 'COMPLIANCE',
        recordId: id,
        previousValue: JSON.stringify(existing),
        newValue: JSON.stringify(updated),
      },
    });

    return NextResponse.json({ compliance: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update compliance' }, { status: 500 });
  }
}
