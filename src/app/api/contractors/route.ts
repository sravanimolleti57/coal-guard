import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const contractors = await prisma.contractor.findMany({
      include: {
        contracts: { include: { mine: true } },
        workers: true,
        _count: { select: { workers: true, contracts: true } },
      },
      orderBy: { companyName: 'asc' },
    });

    const activeContractors = contractors.filter((c) => c.status === 'ACTIVE').length;
    const highRiskContractors = contractors.filter((c) => c.riskScore > 50).length;

    return NextResponse.json({
      contractors,
      summary: {
        total: contractors.length,
        activeContractors,
        highRiskContractors,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch contractors' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { companyName, registrationNumber, contactPerson, email, phone, workerCount } = body;

    if (!companyName || !registrationNumber || !contactPerson) {
      return NextResponse.json({ error: 'Company Name, Reg Number, and Contact Person are required' }, { status: 400 });
    }

    const contractor = await prisma.contractor.create({
      data: {
        companyName,
        registrationNumber,
        contactPerson,
        email: email || 'contractor@coalindia.in',
        phone: phone || '+91 98000 00000',
        workerCount: parseInt(workerCount) || 50,
        status: 'ACTIVE',
        riskScore: 15.0,
        complianceScore: 90.0,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        role: authUser.role,
        action: 'CREATE_CONTRACTOR',
        module: 'CONTRACTOR',
        recordId: contractor.id,
        newValue: JSON.stringify(contractor),
      },
    });

    return NextResponse.json({ contractor }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to register contractor' }, { status: 500 });
  }
}
