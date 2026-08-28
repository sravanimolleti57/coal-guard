import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'compliance';
    const subsidiaryId = searchParams.get('subsidiaryId');
    const mineId = searchParams.get('mineId');

    let reportData: any = null;

    if (reportType === 'compliance') {
      reportData = await prisma.mineCompliance.findMany({
        where: mineId ? { mineId } : subsidiaryId ? { mine: { subsidiaryId } } : {},
        include: { mine: true, requirement: { include: { category: true } } },
      });
    } else if (reportType === 'inspections') {
      reportData = await prisma.inspection.findMany({
        where: mineId ? { mineId } : subsidiaryId ? { mine: { subsidiaryId } } : {},
        include: { mine: true, inspector: true, observations: true, violations: true },
      });
    } else if (reportType === 'violations') {
      reportData = await prisma.violation.findMany({
        where: mineId ? { mineId } : subsidiaryId ? { mine: { subsidiaryId } } : {},
        include: { mine: true, category: true, correctiveActions: true },
      });
    } else if (reportType === 'contractors') {
      reportData = await prisma.contractor.findMany({
        include: { contracts: { include: { mine: true } }, workers: true },
      });
    } else if (reportType === 'production') {
      reportData = await prisma.productionRecord.findMany({
        where: mineId ? { mineId } : subsidiaryId ? { mine: { subsidiaryId } } : {},
        include: { mine: true },
      });
    } else if (reportType === 'environment') {
      reportData = await prisma.environmentalReading.findMany({
        where: mineId ? { mineId } : subsidiaryId ? { mine: { subsidiaryId } } : {},
        include: { mine: true, zone: true },
      });
    } else {
      reportData = await prisma.mine.findMany({
        include: { subsidiary: true, riskScores: { take: 1 } },
      });
    }

    return NextResponse.json({
      type: reportType,
      generatedAt: new Date().toISOString(),
      recordCount: Array.isArray(reportData) ? reportData.length : 0,
      data: reportData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}
