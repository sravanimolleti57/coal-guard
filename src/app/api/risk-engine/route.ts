import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mineId = searchParams.get('mineId');

    const mines = await prisma.mine.findMany({
      where: mineId ? { id: mineId } : {},
      include: {
        subsidiary: true,
        compliances: true,
        violations: { where: { status: { not: 'CLOSED' } } },
        environmentalReadings: { orderBy: { timestamp: 'desc' }, take: 1 },
        riskScores: { orderBy: { calculatedAt: 'desc' }, take: 1 },
      },
    });

    const evaluations = [];

    for (const m of mines) {
      // 1. Compliance factor
      const totalComp = m.compliances.length;
      const compCompleted = m.compliances.filter((c) => c.status === 'COMPLIANT').length;
      const compPct = totalComp > 0 ? (compCompleted / totalComp) * 100 : 100;
      const compRiskFactor = 100 - compPct;

      // 2. Violation factor
      const highViolCount = m.violations.filter((v) => v.severity === 'HIGH' || v.severity === 'CRITICAL').length;
      const violRiskFactor = Math.min(highViolCount * 25, 100);

      // 3. Environmental factor
      const latestEnv = m.environmentalReadings[0];
      let envRiskFactor = 10;
      if (latestEnv?.status === 'CRITICAL') envRiskFactor = 90;
      else if (latestEnv?.status === 'WARNING') envRiskFactor = 50;

      // 4. Overdue CAPA factor
      const overdueCapas = await prisma.correctiveAction.count({
        where: {
          violation: { mineId: m.id },
          status: { not: 'VERIFIED_CLOSED' },
          deadline: { lt: new Date() },
        },
      });
      const actionRiskFactor = Math.min(overdueCapas * 30, 100);

      // Composite Weighted Score (0 - 100)
      const overallScore = Math.round(
        compRiskFactor * 0.3 + violRiskFactor * 0.3 + envRiskFactor * 0.2 + actionRiskFactor * 0.2
      );

      let riskLevel = 'LOW';
      if (overallScore > 80) riskLevel = 'CRITICAL';
      else if (overallScore > 60) riskLevel = 'HIGH';
      else if (overallScore > 30) riskLevel = 'MEDIUM';

      const contributingFactors: string[] = [];
      const recommendations: string[] = [];

      if (compRiskFactor > 40) {
        contributingFactors.push(`Low compliance completion (${Math.round(compPct)}%)`);
        recommendations.push('Accelerate statutory DGMS & CPCB filing completions.');
      }
      if (highViolCount > 0) {
        contributingFactors.push(`${highViolCount} active high/critical safety violations`);
        recommendations.push('Issue immediate site-halt warning and assign senior safety officer.');
      }
      if (latestEnv?.status === 'CRITICAL') {
        contributingFactors.push(`Critical ambient dust breach (PM10: ${latestEnv.pm10} ug/m3)`);
        recommendations.push('Deploy automated mist cannons & increase water tanker frequency.');
      }
      if (overdueCapas > 0) {
        contributingFactors.push(`${overdueCapas} overdue corrective action plans`);
        recommendations.push('Escalate overdue CAPAs to Corporate Governance Board.');
      }

      evaluations.push({
        mineId: m.id,
        mineName: m.name,
        mineCode: m.code,
        subsidiary: m.subsidiary.code,
        overallScore,
        riskLevel,
        compPct: Math.round(compPct),
        highViolCount,
        envStatus: latestEnv?.status || 'NORMAL',
        overdueCapas,
        contributingFactors,
        recommendations,
      });
    }

    return NextResponse.json({ evaluations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to execute AI risk engine' }, { status: 500 });
  }
}
