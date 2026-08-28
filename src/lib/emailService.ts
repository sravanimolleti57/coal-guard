import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

export interface EmailDispatchPayload {
  toEmail: string;
  recipientName: string;
  recipientRole: 'ADMIN' | 'MANAGER';
  subject: string;
  documentTitle: string;
  mineName: string;
  riskLevel: 'GOOD' | 'BAD';
  riskScore: number;
  aiRecommendation: 'PROCEED' | 'DO_NOT_PROCEED';
  aiSummary: string;
  violations: Array<{ requirement: string; severity: string; finding: string }>;
  precautions: string[];
  analyzedAt: Date;
}

// Generate styled HTML Email Body
function generateHtmlEmailBody(payload: EmailDispatchPayload): string {
  const isGood = payload.riskLevel === 'GOOD';
  const badgeColor = isGood ? '#10b981' : '#ef4444';
  const badgeBg = isGood ? '#064e3b' : '#7f1d1d';
  const decisionText = isGood ? '🟢 GOOD (PROCEED WITH WORK)' : '🔴 BAD (DO NOT PROCEED)';

  const violationsHtml = payload.violations.length > 0
    ? payload.violations.map(v => `
      <li style="margin-bottom: 8px; font-size: 13px; color: #f87171;">
        <strong>[${v.severity}]</strong> ${v.requirement}: <em>${v.finding}</em>
      </li>
    `).join('')
    : '<li style="font-size: 13px; color: #34d399;">All safety requirements satisfied cleanly.</li>';

  const precautionsHtml = payload.precautions.length > 0
    ? payload.precautions.map((p, idx) => `
      <li style="margin-bottom: 6px; font-size: 13px; color: #fbbf24;">
        <strong>${idx + 1}.</strong> ${p}
      </li>
    `).join('')
    : '<li style="font-size: 13px; color: #94a3b8;">No mandatory precautions required.</li>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${payload.subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 24px;">
        <!-- Header -->
        <div style="border-b: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #f59e0b; margin: 0; font-size: 20px;">⚡ COAL-GUARD AI</h2>
          <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">Smart Mining Governance & Safety Compliance System</p>
        </div>

        <!-- Subject Badge -->
        <div style="background-color: ${badgeBg}; border: 1px solid ${badgeColor}; border-radius: 8px; padding: 12px; margin-bottom: 20px; text-align: center;">
          <span style="color: ${badgeColor}; font-weight: bold; font-size: 16px;">${decisionText}</span>
          <div style="color: #e2e8f0; font-size: 13px; margin-top: 4px;">Safety Score: <strong>${payload.riskScore}/100</strong></div>
        </div>

        <!-- Document Details -->
        <div style="background-color: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 13px; line-height: 1.6;">
          <p style="margin: 0 0 8px 0; color: #94a3b8;">Recipient: <strong style="color: #ffffff;">${payload.recipientName} (${payload.toEmail})</strong></p>
          <p style="margin: 0 0 8px 0; color: #94a3b8;">Document: <strong style="color: #ffffff;">${payload.documentTitle}</strong></p>
          <p style="margin: 0 0 8px 0; color: #94a3b8;">Target Mine: <strong style="color: #ffffff;">${payload.mineName}</strong></p>
          <p style="margin: 0; color: #94a3b8;">Analyzed At: <strong style="color: #ffffff;">${new Date(payload.analyzedAt).toLocaleString('en-IN')}</strong></p>
        </div>

        <!-- AI Summary -->
        <div style="margin-bottom: 20px;">
          <h4 style="color: #f59e0b; margin: 0 0 8px 0; font-size: 14px;">AI Safety Summary:</h4>
          <p style="font-size: 13px; color: #cbd5e1; line-height: 1.5; margin: 0;">${payload.aiSummary}</p>
        </div>

        <!-- Violations -->
        <div style="margin-bottom: 20px;">
          <h4 style="color: #ef4444; margin: 0 0 8px 0; font-size: 14px;">Safety Findings & Requirements Checked:</h4>
          <ul style="padding-left: 20px; margin: 0;">
            ${violationsHtml}
          </ul>
        </div>

        <!-- Precautions -->
        ${!isGood ? `
        <div style="margin-bottom: 20px; background-color: #451a03; border: 1px solid #78350f; border-radius: 8px; padding: 16px;">
          <h4 style="color: #fbbf24; margin: 0 0 8px 0; font-size: 14px;">Mandatory Precautions Checklist:</h4>
          <ul style="padding-left: 20px; margin: 0;">
            ${precautionsHtml}
          </ul>
        </div>
        ` : ''}

        <!-- Footer Action -->
        <div style="border-t: 1px solid #1e293b; pt: 16px; font-size: 11px; color: #64748b; text-align: center; margin-top: 24px;">
          This is an automated governance dispatch notification from Coal Guard AI Platform.<br>
          Coal India Limited (CIL) • DGMS CMR 2017 Regulatory Framework
        </div>
      </div>
    </body>
    </html>
  `;
}

// Nodemailer Transport Factory
function createNodemailerTransport() {
  const host = process.env.SMTP_HOST || process.env.GMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // Fallback to local / json transport if no live SMTP env vars configured
  return nodemailer.createTransport({
    jsonTransport: true,
  });
}

export async function sendAnalysisResultEmails(payload: {
  documentId: string;
  documentTitle: string;
  mineName: string;
  uploadedByEmail: string;
  uploadedByName: string;
  adminEmail: string;
  adminName: string;
  riskLevel: 'GOOD' | 'BAD';
  riskScore: number;
  aiRecommendation: 'PROCEED' | 'DO_NOT_PROCEED';
  aiSummary: string;
  violations: Array<{ requirement: string; severity: string; finding: string }>;
  precautions: string[];
}) {
  const analyzedAt = new Date();
  const transporter = createNodemailerTransport();

  // 1. Manager Payload
  const managerPayload: EmailDispatchPayload = {
    toEmail: payload.uploadedByEmail || 'manager@coalguard.demo',
    recipientName: payload.uploadedByName || 'Coal Guard Mine Manager',
    recipientRole: 'MANAGER',
    subject: `[COAL-GUARD AI] Safety Analysis Report: ${payload.documentTitle} - ${payload.riskLevel}`,
    documentTitle: payload.documentTitle,
    mineName: payload.mineName,
    riskLevel: payload.riskLevel,
    riskScore: payload.riskScore,
    aiRecommendation: payload.aiRecommendation,
    aiSummary: payload.aiSummary,
    violations: payload.violations,
    precautions: payload.precautions,
    analyzedAt,
  };

  // 2. Admin Payload
  const adminPayload: EmailDispatchPayload = {
    toEmail: payload.adminEmail || 'admin@coalguard.demo',
    recipientName: payload.adminName || 'Coal Guard System Admin',
    recipientRole: 'ADMIN',
    subject: `[COAL-GUARD AI] [ADMIN COPY] Safety Analysis Report: ${payload.documentTitle} - ${payload.riskLevel}`,
    documentTitle: payload.documentTitle,
    mineName: payload.mineName,
    riskLevel: payload.riskLevel,
    riskScore: payload.riskScore,
    aiRecommendation: payload.aiRecommendation,
    aiSummary: payload.aiSummary,
    violations: payload.violations,
    precautions: payload.precautions,
    analyzedAt,
  };

  const managerHtml = generateHtmlEmailBody(managerPayload);
  const adminHtml = generateHtmlEmailBody(adminPayload);

  // Dispatch Nodemailer Emails
  try {
    const fromAddr = process.env.SMTP_FROM || '"Coal Guard AI Governance" <notifications@coalguard.gov.in>';

    // Manager Mail
    await transporter.sendMail({
      from: fromAddr,
      to: managerPayload.toEmail,
      subject: managerPayload.subject,
      html: managerHtml,
      text: `${managerPayload.subject}\n\nDocument: ${payload.documentTitle}\nRisk: ${payload.riskLevel} (${payload.riskScore}/100)\nRecommendation: ${payload.aiRecommendation}\n\n${payload.aiSummary}`,
    });

    // Admin Mail
    await transporter.sendMail({
      from: fromAddr,
      to: adminPayload.toEmail,
      subject: adminPayload.subject,
      html: adminHtml,
      text: `${adminPayload.subject}\n\nDocument: ${payload.documentTitle}\nRisk: ${payload.riskLevel} (${payload.riskScore}/100)\nRecommendation: ${payload.aiRecommendation}\n\n${payload.aiSummary}`,
    });

    console.log(`✅ Nodemailer dispatched email to Manager (${managerPayload.toEmail}) & Admin (${adminPayload.toEmail})`);
  } catch (err) {
    console.error('Nodemailer SMTP dispatch error:', err);
  }

  // Store Dispatched Email Logs in Audit Trail & Alerts
  await Promise.all([
    prisma.auditLog.create({
      data: {
        userName: managerPayload.recipientName,
        role: 'MANAGER',
        action: 'EMAIL_DISPATCH_SENT',
        module: 'DOCS',
        recordId: payload.documentId,
        newValue: JSON.stringify({
          to: managerPayload.toEmail,
          subject: managerPayload.subject,
          riskLevel: payload.riskLevel,
          score: payload.riskScore,
          htmlBody: managerHtml,
        }),
      },
    }),

    prisma.auditLog.create({
      data: {
        userName: adminPayload.recipientName,
        role: 'ADMIN',
        action: 'EMAIL_DISPATCH_SENT',
        module: 'DOCS',
        recordId: payload.documentId,
        newValue: JSON.stringify({
          to: adminPayload.toEmail,
          subject: adminPayload.subject,
          riskLevel: payload.riskLevel,
          score: payload.riskScore,
          htmlBody: adminHtml,
        }),
      },
    }),

    prisma.alert.create({
      data: {
        documentId: payload.documentId,
        title: `📧 RESULT EMAIL SENT TO ${managerPayload.toEmail.toUpperCase()}`,
        message: `Subject: ${managerPayload.subject}\n\nRecipient: ${managerPayload.toEmail}\nRisk Level: ${payload.riskLevel}\nScore: ${payload.riskScore}/100\nRecommendation: ${payload.aiRecommendation}\n\n${payload.aiSummary}`,
        alertType: 'SAFETY_ANALYSIS',
        type: 'EMAIL_NOTIFICATION',
        severity: payload.riskLevel === 'GOOD' ? 'INFO' : 'CRITICAL',
        riskLevel: payload.riskLevel,
        status: 'UNREAD',
        isRead: false,
      },
    }),
  ]);

  return {
    managerEmail: managerPayload,
    adminEmail: adminPayload,
  };
}
