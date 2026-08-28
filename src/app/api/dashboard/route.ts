import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subsidiaryId = searchParams.get('subsidiaryId');
    const mineId = searchParams.get('mineId');

    const mineWhere: any = {};
    if (subsidiaryId) mineWhere.subsidiaryId = subsidiaryId;
    if (mineId) mineWhere.id = mineId;

    // Counts
    const totalSubsidiaries = await prisma.subsidiary.count();
    const totalMines = await prisma.mine.count({ where: mineWhere });
    const totalUsers = await prisma.user.count();

    // Compliance Score
    const totalCompliances = await prisma.mineCompliance.count({
      where: mineId ? { mineId } : subsidiaryId ? { mine: { subsidiaryId } } : {},
    });
    const compliantCount = await prisma.mineCompliance.count({
      where: {
        status: 'COMPLIANT',
        ...(mineId ? { mineId } : subsidiaryId ? { mine: { subsidiaryId } } : {}),
      },
    });
    const overdueComplianceCount = await prisma.mineCompliance.count({
      where: {
        status: 'OVERDUE',
        ...(mineId ? { mineId } : subsidiaryId ? { mine: { subsidiaryId } } : {}),
      },
    });
    const overallCompliancePct = totalCompliances > 0 ? Math.round((compliantCount / totalCompliances) * 100) : 0;

    // Risk Mines
    const riskScores = await prisma.riskScore.findMany({
      include: { mine: true },
      orderBy: { calculatedAt: 'desc' },
      take: 20,
    });
    const highRiskMinesCount = riskScores.filter((r) => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL').length;

    // Violations & CAPA
    const totalViolations = await prisma.violation.count({
      where: mineId ? { mineId } : subsidiaryId ? { mine: { subsidiaryId } } : {},
    });
    const criticalViolationsCount = await prisma.violation.count({
      where: {
        severity: 'CRITICAL',
        status: { not: 'CLOSED' },
        ...(mineId ? { mineId } : subsidiaryId ? { mine: { subsidiaryId } } : {}),
      },
    });
    const openCapas = await prisma.correctiveAction.count({
      where: { status: { not: 'VERIFIED_CLOSED' } },
    });
    const overdueCapas = await prisma.correctiveAction.count({
      where: {
        status: { not: 'VERIFIED_CLOSED' },
        deadline: { lt: new Date() },
      },
    });

    // Alerts
    const envAlerts = await prisma.alert.count({
      where: { alertType: 'ENVIRONMENTAL', status: 'UNREAD' },
    });
    const safetyAlerts = await prisma.alert.count({
      where: { alertType: 'CRITICAL_VIOLATION', status: 'UNREAD' },
    });

    // Contractors
    const contractors = await prisma.contractor.findMany();
    const highRiskContractorsCount = contractors.filter((c) => c.riskScore > 50).length;

    // Production Performance
    const productionRecords = await prisma.productionRecord.findMany({
      take: 30,
      orderBy: { date: 'desc' },
    });
    const totalTargetTonnage = productionRecords.reduce((acc, r) => acc + r.targetTonnage, 0);
    const totalActualTonnage = productionRecords.reduce((acc, r) => acc + r.actualTonnage, 0);
    const productionAchievedPct = totalTargetTonnage > 0 ? Math.round((totalActualTonnage / totalTargetTonnage) * 100) : 0;

    // Violations by Category
    const violations = await prisma.violation.findMany({
      include: { category: true },
    });
    const categoryMap: Record<string, number> = {};
    violations.forEach((v) => {
      const name = v.category?.name || 'General Safety';
      categoryMap[name] = (categoryMap[name] || 0) + 1;
    });
    const violationsByCategory = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      count: categoryMap[cat],
    }));

    // Risk Distribution
    const riskDistMap: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    riskScores.forEach((r) => {
      riskDistMap[r.riskLevel] = (riskDistMap[r.riskLevel] || 0) + 1;
    });
    const riskDistribution = Object.keys(riskDistMap).map((level) => ({
      level,
      count: riskDistMap[level],
    }));

    // Corrective Action Status Distribution
    const capas = await prisma.correctiveAction.findMany();
    const capaStatusMap: Record<string, number> = {};
    capas.forEach((c) => {
      capaStatusMap[c.status] = (capaStatusMap[c.status] || 0) + 1;
    });
    const capaStatusDistribution = Object.keys(capaStatusMap).map((st) => ({
      status: st,
      count: capaStatusMap[st],
    }));

    // Recent Alerts
    const recentAlerts = await prisma.alert.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { mine: true },
    });

    return NextResponse.json({
      metrics: {
        totalSubsidiaries,
        totalMines,
        totalUsers,
        overallCompliancePct,
        overdueComplianceCount,
        highRiskMinesCount,
        totalViolations,
        criticalViolationsCount,
        openCapas,
        overdueCapas,
        envAlerts,
        safetyAlerts,
        highRiskContractorsCount,
        totalTargetTonnage,
        totalActualTonnage,
        productionAchievedPct,
      },
      charts: {
        violationsByCategory,
        riskDistribution,
        capaStatusDistribution,
        productionRecords: productionRecords.slice(0, 10).reverse().map((r) => ({
          date: new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          target: r.targetTonnage,
          actual: r.actualTonnage,
          dispatch: r.dispatchTonnage,
        })),
      },
      recentAlerts,
    });
  } catch (error: any) {
    console.error('Dashboard endpoint error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
