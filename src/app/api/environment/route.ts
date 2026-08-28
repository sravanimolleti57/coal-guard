import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mineId = searchParams.get('mineId');

    const where: any = {};
    if (mineId) where.mineId = mineId;

    const readings = await prisma.environmentalReading.findMany({
      where,
      include: {
        mine: { select: { id: true, name: true, code: true } },
        zone: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    const normalCount = readings.filter((r) => r.status === 'NORMAL').length;
    const warningCount = readings.filter((r) => r.status === 'WARNING').length;
    const criticalCount = readings.filter((r) => r.status === 'CRITICAL').length;

    return NextResponse.json({
      readings,
      summary: {
        total: readings.length,
        normalCount,
        warningCount,
        criticalCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch environmental readings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mineId, zoneId, pm25, pm10, waterPh, waterTurbidity, noiseLevelDb, dustLevel } = body;

    if (!mineId || pm10 === undefined) {
      return NextResponse.json({ error: 'Mine ID and PM10 reading are required' }, { status: 400 });
    }

    const p10 = parseFloat(pm10);
    const p25 = parseFloat(pm25) || p10 * 0.5;
    const noise = parseFloat(noiseLevelDb) || 65.0;
    const ph = parseFloat(waterPh) || 7.2;

    let airStatus = 'NORMAL';
    if (p10 > 250 || p25 > 120) airStatus = 'CRITICAL';
    else if (p10 > 100 || p25 > 60) airStatus = 'WARNING';

    let waterStatus = 'NORMAL';
    if (ph < 6.0 || ph > 9.0) waterStatus = 'WARNING';

    let noiseStatus = 'NORMAL';
    if (noise > 85.0) noiseStatus = 'CRITICAL';

    const overallStatus = airStatus === 'CRITICAL' || noiseStatus === 'CRITICAL' ? 'CRITICAL' : airStatus === 'WARNING' || waterStatus === 'WARNING' ? 'WARNING' : 'NORMAL';

    const reading = await prisma.environmentalReading.create({
      data: {
        mineId,
        zoneId: zoneId || null,
        timestamp: new Date(),
        pm25: p25,
        pm10: p10,
        airQualityStatus: airStatus,
        waterPh: ph,
        waterTurbidity: parseFloat(waterTurbidity) || 5.0,
        waterQualityStatus: waterStatus,
        noiseLevelDb: noise,
        noiseStatus: noiseStatus,
        dustLevel: parseFloat(dustLevel) || 1.5,
        status: overallStatus,
      },
    });

    if (overallStatus === 'CRITICAL') {
      await prisma.alert.create({
        data: {
          mineId,
          title: `ENVIRONMENTAL CRITICAL BREACH: Air PM10 (${p10} ug/m3)`,
          message: `Sensor detected high dust/air pollution level exceeding CPCB statutory norms.`,
          alertType: 'ENVIRONMENTAL',
          severity: 'CRITICAL',
          entityType: 'ENVIRONMENTAL_READING',
          entityId: reading.id,
        },
      });
    }

    return NextResponse.json({ reading }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to submit environmental reading' }, { status: 500 });
  }
}
