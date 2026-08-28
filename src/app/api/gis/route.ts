import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const mines = await prisma.mine.findMany({
      include: {
        subsidiary: true,
        zones: true,
        riskScores: { orderBy: { calculatedAt: 'desc' }, take: 1 },
        violations: { where: { status: { not: 'CLOSED' } } },
        environmentalReadings: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });

    const mapPoints = mines.map((m) => {
      const latestRisk = m.riskScores[0]?.riskLevel || 'LOW';
      const score = m.riskScores[0]?.overallScore || 20;
      const criticalViols = m.violations.filter((v) => v.severity === 'CRITICAL' || v.severity === 'HIGH').length;

      let statusColor = '#10b981'; // LOW = Green
      if (latestRisk === 'MEDIUM') statusColor = '#f59e0b'; // Yellow
      if (latestRisk === 'HIGH') statusColor = '#f97316'; // Orange
      if (latestRisk === 'CRITICAL') statusColor = '#ef4444'; // Red

      return {
        id: m.id,
        name: m.name,
        code: m.code,
        subsidiary: m.subsidiary.name,
        state: m.state,
        district: m.district,
        latitude: m.latitude,
        longitude: m.longitude,
        mineType: m.mineType,
        status: m.status,
        riskLevel: latestRisk,
        riskScore: score,
        criticalViolations: criticalViols,
        statusColor,
        zones: m.zones.map((z) => ({
          id: z.id,
          name: z.name,
          riskLevel: z.riskLevel,
          latitude: z.latitude,
          longitude: z.longitude,
        })),
        latestReading: m.environmentalReadings[0] || null,
      };
    });

    return NextResponse.json({ points: mapPoints });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch GIS map data' }, { status: 500 });
  }
}
