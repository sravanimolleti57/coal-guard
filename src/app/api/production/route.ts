import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mineId = searchParams.get('mineId');

    const where: any = {};
    if (mineId) where.mineId = mineId;

    const records = await prisma.productionRecord.findMany({
      where,
      include: { mine: { select: { id: true, name: true, code: true } } },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const totalTarget = records.reduce((acc, r) => acc + r.targetTonnage, 0);
    const totalActual = records.reduce((acc, r) => acc + r.actualTonnage, 0);
    const totalDispatch = records.reduce((acc, r) => acc + r.dispatchTonnage, 0);
    const achievementPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

    // Anomaly detection
    const anomalies: string[] = [];
    records.forEach((r) => {
      const dev = ((r.actualTonnage - r.targetTonnage) / r.targetTonnage) * 100;
      if (dev < -15) {
        anomalies.push(`Mine ${r.mine.name} recorded ${Math.abs(Math.round(dev))}% production deficit on ${new Date(r.date).toLocaleDateString('en-IN')}. Downtime reason: ${r.downtimeReason || 'Unexplained slowdown'}`);
      }
    });

    return NextResponse.json({
      records,
      summary: {
        totalTarget,
        totalActual,
        totalDispatch,
        achievementPct,
      },
      anomalies,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch production logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mineId, targetSeam, targetTonnage, actualTonnage, dispatchTonnage, downtimeHours, downtimeReason } = body;

    if (!mineId || !targetTonnage || !actualTonnage) {
      return NextResponse.json({ error: 'Mine ID, target tonnage, and actual tonnage are required' }, { status: 400 });
    }

    const record = await prisma.productionRecord.create({
      data: {
        mineId,
        date: new Date(),
        targetSeam: targetSeam || 'Seam IV - Primary Open Pit',
        targetTonnage: parseFloat(targetTonnage),
        actualTonnage: parseFloat(actualTonnage),
        dispatchTonnage: parseFloat(dispatchTonnage) || parseFloat(actualTonnage) * 0.95,
        downtimeHours: parseFloat(downtimeHours) || 0.0,
        downtimeReason: downtimeReason || null,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        role: authUser.role,
        action: 'LOG_PRODUCTION',
        module: 'PRODUCTION',
        recordId: record.id,
        newValue: JSON.stringify(record),
      },
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to log production' }, { status: 500 });
  }
}
