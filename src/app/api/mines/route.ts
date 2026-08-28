import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subsidiaryId = searchParams.get('subsidiaryId');
    const search = searchParams.get('search');

    const where: any = {};
    if (subsidiaryId) where.subsidiaryId = subsidiaryId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { district: { contains: search } },
        { state: { contains: search } },
      ];
    }

    const mines = await prisma.mine.findMany({
      where,
      include: {
        subsidiary: true,
        region: true,
        zones: true,
        riskScores: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            violations: true,
            compliances: true,
            inspections: true,
            workers: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ mines });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch mines' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, subsidiaryId, regionId, state, district, latitude, longitude, mineType, productionTarget, contactName, contactEmail } = body;

    if (!name || !code || !subsidiaryId || !state || !district) {
      return NextResponse.json({ error: 'Required mine fields missing' }, { status: 400 });
    }

    const mine = await prisma.mine.create({
      data: {
        name,
        code,
        subsidiaryId,
        regionId,
        state,
        district,
        latitude: parseFloat(latitude) || 23.6,
        longitude: parseFloat(longitude) || 86.4,
        mineType: mineType || 'OPENCAST',
        productionTarget: parseFloat(productionTarget) || 5.0,
        contactName,
        contactEmail,
      },
    });

    // Create default zone
    await prisma.mineZone.create({
      data: {
        mineId: mine.id,
        name: `${mine.name} - Primary Zone A`,
        code: `${mine.code}-ZA`,
        latitude: mine.latitude,
        longitude: mine.longitude,
        riskLevel: 'LOW',
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        role: authUser.role,
        action: 'CREATE',
        module: 'MINES',
        recordId: mine.id,
        newValue: JSON.stringify(mine),
      },
    });

    return NextResponse.json({ mine }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create mine' }, { status: 500 });
  }
}
