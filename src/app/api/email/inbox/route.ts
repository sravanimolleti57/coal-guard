import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'EMAIL_DISPATCH_SENT' },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    const emails = logs.map((log) => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(log.newValue || '{}');
      } catch (e) {
        parsed = {};
      }

      return {
        id: log.id,
        recipient: parsed.to || 'manager@coalguard.demo',
        recipientName: log.userName,
        role: log.role,
        subject: parsed.subject || 'Safety Analysis Report',
        riskLevel: parsed.riskLevel || 'GOOD',
        score: parsed.score || 85,
        timestamp: log.timestamp,
        htmlBody: parsed.htmlBody || '',
      };
    });

    return NextResponse.json({ emails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch email inbox' }, { status: 500 });
  }
}
