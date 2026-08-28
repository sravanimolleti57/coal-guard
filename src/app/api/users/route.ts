import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      include: {
        subsidiary: { select: { id: true, name: true, code: true } },
        mine: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, name, role, designation, phone, subsidiaryId, mineId } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Email, password, name, and role are required' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role,
        designation: designation || null,
        phone: phone || null,
        subsidiaryId: subsidiaryId || null,
        mineId: mineId || null,
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: authUser.id,
        userName: authUser.name,
        role: authUser.role,
        action: 'CREATE_USER',
        module: 'USERS',
        recordId: user.id,
        newValue: JSON.stringify({ email: user.email, name: user.name, role: user.role }),
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
