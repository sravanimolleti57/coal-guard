import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mineId = searchParams.get('mineId');
    const status = searchParams.get('status');

    const where: any = {};
    if (mineId) where.mineId = mineId;
    if (status) where.status = status;

    const inspections = await prisma.inspection.findMany({
      where,
      include: {
        mine: { select: { id: true, name: true, code: true } },
        zone: true,
        inspector: { select: { id: true, name: true, email: true, designation: true } },
        checklists: true,
        observations: true,
        violations: true,
      },
      orderBy: { scheduledDate: 'desc' },
    });

    return NextResponse.json({ inspections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch inspections' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mineId, zoneId, type, scheduledDate, latitude, longitude, overallResult, summary, checklists, observation } = body;

    if (!mineId || !type) {
      return NextResponse.json({ error: 'Mine ID and Inspection Type are required' }, { status: 400 });
    }

    const inspection = await prisma.inspection.create({
      data: {
        mineId,
        zoneId: zoneId || null,
        inspectorId: authUser.id,
        type,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        actualDate: new Date(),
        status: 'COMPLETED',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        overallResult: overallResult || 'PASSED',
        summary: summary || 'Routine Statutory Field Inspection Completed.',
      },
    });

    // Save checklists if provided
    if (checklists && Array.isArray(checklists)) {
      for (const item of checklists) {
        await prisma.inspectionChecklist.create({
          data: {
            inspectionId: inspection.id,
            category: item.category || 'General',
            itemText: item.itemText || 'Statutory Item Check',
            status: item.status || 'PASSED',
            observation: item.observation || null,
          },
        });
      }
    }

    // Save observation & auto-create violation if observation is HIGH/CRITICAL severity
    if (observation && observation.description) {
      const obsRecord = await prisma.observation.create({
        data: {
          inspectionId: inspection.id,
          description: observation.description,
          severity: observation.severity || 'MEDIUM',
          photoUrl: observation.photoUrl || 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=60',
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          timestamp: new Date(),
        },
      });

      if (observation.severity === 'HIGH' || observation.severity === 'CRITICAL' || observation.createViolation) {
        const cat = await prisma.complianceCategory.findFirst();
        const categoryId = cat ? cat.id : 'default-cat-id';

        const violationNumber = `VIOL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const dueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

        const violation = await prisma.violation.create({
          data: {
            violationNumber,
            mineId,
            zoneId: zoneId || null,
            inspectionId: inspection.id,
            categoryId,
            description: observation.description,
            severity: observation.severity || 'HIGH',
            status: 'OPEN',
            dueDate,
          },
        });

        // Trigger Alert if Critical
        if (observation.severity === 'CRITICAL') {
          await prisma.alert.create({
            data: {
              mineId,
              title: `CRITICAL SAFETY VIOLATION: ${violationNumber}`,
              message: observation.description,
              alertType: 'CRITICAL_VIOLATION',
              severity: 'CRITICAL',
              entityType: 'VIOLATION',
              entityId: violation.id,
            },
          });
        }
      }
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        role: authUser.role,
        action: 'SUBMIT_INSPECTION',
        module: 'INSPECTION',
        recordId: inspection.id,
        newValue: JSON.stringify(inspection),
      },
    });

    return NextResponse.json({ inspection }, { status: 201 });
  } catch (error: any) {
    console.error('Create inspection error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit inspection' }, { status: 500 });
  }
}
