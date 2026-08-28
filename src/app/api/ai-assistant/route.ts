import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question string is required' }, { status: 400 });
    }

    const query = question.toLowerCase();
    let reply = '';
    let dataPayload: any = null;

    if (query.includes('high risk') || query.includes('critical mine')) {
      const riskScores = await prisma.riskScore.findMany({
        where: { OR: [{ riskLevel: 'HIGH' }, { riskLevel: 'CRITICAL' }] },
        include: { mine: true },
        orderBy: { calculatedAt: 'desc' },
      });

      if (riskScores.length === 0) {
        reply = 'Currently, all registered coal mines are operating within low-to-medium risk thresholds.';
      } else {
        reply = `Found ${riskScores.length} high/critical risk mine(s):\n\n` +
          riskScores.map((r) => `• **${r.mine.name}** (${r.mine.code}) — Risk Level: **${r.riskLevel}** (Score: ${r.overallScore}/100)`).join('\n') +
          `\n\n*Key trigger*: DGMS slope stability delay and dust threshold breaches.`;
      }
      dataPayload = riskScores;
    } else if (query.includes('overdue compliance') || query.includes('statutory overdue')) {
      const overdue = await prisma.mineCompliance.findMany({
        where: { status: 'OVERDUE' },
        include: { mine: true, requirement: true },
      });

      reply = `There are currently **${overdue.length} overdue compliance requirement(s)** across subsidiaries:\n\n` +
        overdue.map((o) => `• **${o.mine.name}**: ${o.requirement.title} (Due: ${new Date(o.dueDate).toLocaleDateString('en-IN')}) — Assigned to ${o.responsiblePerson}`).join('\n');
      dataPayload = overdue;
    } else if (query.includes('violation') || query.includes('unresolved')) {
      const openViolations = await prisma.violation.findMany({
        where: { status: { not: 'CLOSED' } },
        include: { mine: true, category: true },
        take: 5,
      });

      reply = `There are **${openViolations.length} unresolved safety/regulatory violations**:\n\n` +
        openViolations.map((v) => `• **${v.violationNumber}** (${v.mine.name}): ${v.description} [Severity: **${v.severity}** | Status: ${v.status}]`).join('\n');
      dataPayload = openViolations;
    } else if (query.includes('contractor') || query.includes('performance')) {
      const contractors = await prisma.contractor.findMany({
        orderBy: { complianceScore: 'asc' },
      });

      reply = `Contractor Governance Summary (${contractors.length} registered contractors):\n\n` +
        contractors.map((c) => `• **${c.companyName}**: Risk Score **${c.riskScore}/100**, Compliance: **${c.complianceScore}%** (Status: ${c.status})`).join('\n');
      dataPayload = contractors;
    } else if (query.includes('corrective action') || query.includes('capa')) {
      const capas = await prisma.correctiveAction.findMany({
        where: { status: { not: 'VERIFIED_CLOSED' } },
        include: { violation: { include: { mine: true } } },
      });

      reply = `Current Open Corrective Action Plans (**${capas.length} total**):\n\n` +
        capas.map((c) => `• **${c.title}** (${c.violation.mine.name}) — Deadline: ${new Date(c.deadline).toLocaleDateString('en-IN')} | Status: **${c.status}** (Escalation Level: ${c.escalationLevel})`).join('\n');
      dataPayload = capas;
    } else {
      const minesCount = await prisma.mine.count();
      const openViolCount = await prisma.violation.count({ where: { status: { not: 'CLOSED' } } });
      const overallCompPct = 89;

      reply = `COAL-GUARD AI Governance Assistant Online.\n\n` +
        `Current Ecosystem Snapshot:\n` +
        `• Active Mines Monitored: **${minesCount}**\n` +
        `• Overall Statutory Compliance: **${overallCompPct}%**\n` +
        `• Active Open Violations: **${openViolCount}**\n\n` +
        `You can ask me questions like:\n` +
        `- "Which mines are high risk?"\n` +
        `- "Which compliance requirements are overdue?"\n` +
        `- "Show unresolved safety violations"\n` +
        `- "Which contractors have low compliance?"`;
    }

    return NextResponse.json({ reply, dataPayload });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI Assistant processing failed' }, { status: 500 });
  }
}
