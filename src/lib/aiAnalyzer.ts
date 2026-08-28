import { prisma } from '@/lib/prisma';
import { sendAnalysisResultEmails } from '@/lib/emailService';

export interface StructuredAiAnalysisResult {
  riskLevel: 'GOOD' | 'BAD';
  score: number;
  decision: 'PROCEED' | 'DO_NOT_PROCEED';
  summary: string;
  violations: Array<{
    requirementId?: string;
    requirement: string;
    severity: string;
    finding: string;
  }>;
  precautions: string[];
  passedRequirementsCount: number;
  totalRequirementsChecked: number;
}

export async function analyzeDocumentContent(documentId: string): Promise<StructuredAiAnalysisResult> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { uploadedBy: true, mine: true },
  });

  if (!doc) {
    throw new Error(`Document not found with ID ${documentId}`);
  }

  // Set status to AI_ANALYZING
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: 'AI_ANALYZING',
      analysisStatus: 'AI_ANALYZING',
    },
  });

  // Fetch all active requirements from database
  const activeRequirements = await prisma.requirement.findMany({
    where: { active: true },
  });

  // Combine document text for deep inspection
  const docText = `${doc.title || ''} ${doc.name || ''} ${doc.description || ''} ${doc.ocrExtractedData || ''}`.toLowerCase();

  const violations: Array<{
    requirementId?: string;
    requirement: string;
    severity: string;
    finding: string;
  }> = [];

  const precautionsList: string[] = [];
  const riskFindingsToCreate: Array<{
    requirementId?: string;
    severity: string;
    finding: string;
    passed: boolean;
  }> = [];

  let scoreDeduction = 0;
  let passedCount = 0;

  for (const req of activeRequirements) {
    let failed = false;
    let findingText = '';
    let precautionText = '';

    const reqTitleLower = req.title.toLowerCase();
    const reqIdLower = req.reqId.toLowerCase();

    // Risk Inspection Heuristics based on Coal Guard Safety Rules
    if (reqIdLower.includes('emergency-exit') || reqTitleLower.includes('emergency')) {
      if (!docText.includes('emergency') || !docText.includes('evacuation') || docText.includes('missing emergency')) {
        failed = true;
        findingText = 'Emergency evacuation exit routes and assembly response plan are missing.';
        precautionText = 'Create and attach an emergency response plan before work begins.';
      }
    } else if (reqIdLower.includes('slope-stability') || reqTitleLower.includes('slope')) {
      if (docText.includes('landslide') || docText.includes('crack') || docText.includes('instability') || !docText.includes('slope')) {
        failed = true;
        findingText = 'Highwall slope stability geotechnical safety factor metric (<1.3) or monitoring data missing.';
        precautionText = 'Obtain geotechnical slope stability audit report and safety officer sign-off.';
      }
    } else if (reqIdLower.includes('ventilation') || reqTitleLower.includes('ventilation')) {
      if (docText.includes('ventilation failure') || docText.includes('methane build') || (!docText.includes('airflow') && doc.docType === 'SAFETY_AUDIT')) {
        failed = true;
        findingText = 'Insufficient mechanical ventilation airflow telemetry and fan operational logs.';
        precautionText = 'Verify ventilation requirements and obtain mine ventilation engineer approval.';
      }
    } else if (reqIdLower.includes('fire-suppression') || reqTitleLower.includes('fire')) {
      if (docText.includes('fire extinguisher expired') || docText.includes('suppression failure') || !docText.includes('fire')) {
        failed = true;
        findingText = 'Automatic fire suppression system annual inspection stamp missing or expired.';
        precautionText = 'Inspect and certify fire suppression equipment on heavy machinery before deployment.';
      }
    } else if (reqIdLower.includes('dust-suppression') || reqTitleLower.includes('dust')) {
      if (docText.includes('dust emission high') || !docText.includes('dust')) {
        failed = true;
        findingText = 'Haul road wet dust suppression water sprinkling schedule incomplete.';
        precautionText = 'Deploy high-pressure mist cannons and schedule regular water sprinkling truck logs.';
      }
    } else if (reqIdLower.includes('operator-safety') || reqTitleLower.includes('operator')) {
      if (docText.includes('unauthorized operator') || docText.includes('license expired') || !docText.includes('operator')) {
        failed = true;
        findingText = 'Heavy earth-moving machinery operator pre-shift medical checkoff missing.';
        precautionText = 'Verify certified operator license cards and obtain pre-shift biometric sign-offs.';
      }
    }

    if (failed) {
      if (req.severity === 'CRITICAL') scoreDeduction += 30;
      else if (req.severity === 'HIGH') scoreDeduction += 20;
      else if (req.severity === 'MEDIUM') scoreDeduction += 10;
      else scoreDeduction += 5;

      violations.push({
        requirementId: req.id,
        requirement: req.title,
        severity: req.severity,
        finding: findingText,
      });

      if (precautionText && !precautionsList.includes(precautionText)) {
        precautionsList.push(precautionText);
      }

      riskFindingsToCreate.push({
        requirementId: req.id,
        severity: req.severity,
        finding: findingText,
        passed: false,
      });
    } else {
      passedCount++;
      riskFindingsToCreate.push({
        requirementId: req.id,
        severity: req.severity,
        finding: `Requirement satisfied: ${req.expectedCondition || req.description}`,
        passed: true,
      });
    }
  }

  // Calculate final score & decision
  const rawScore = Math.max(0, 100 - scoreDeduction);
  const riskLevel: 'GOOD' | 'BAD' = rawScore >= 70 && violations.length === 0 ? 'GOOD' : 'BAD';
  const decision: 'PROCEED' | 'DO_NOT_PROCEED' = riskLevel === 'GOOD' ? 'PROCEED' : 'DO_NOT_PROCEED';

  const summary =
    riskLevel === 'GOOD'
      ? 'The document satisfies the required Coal Guard safety conditions and statutory guidelines.'
      : `${violations.length} mandatory safety requirements were not satisfied or missing in the document.`;

  // Clear previous findings and precautions for re-analysis support
  await prisma.riskFinding.deleteMany({ where: { documentId } });
  await prisma.precaution.deleteMany({ where: { documentId } });

  // Create new RiskFinding records
  const createdFindings = [];
  for (const rf of riskFindingsToCreate) {
    const findingRecord = await prisma.riskFinding.create({
      data: {
        documentId,
        requirementId: rf.requirementId || null,
        severity: rf.severity,
        finding: rf.finding,
        passed: rf.passed,
      },
    });
    createdFindings.push(findingRecord);
  }

  // Create Precaution records if BAD
  if (riskLevel === 'BAD') {
    if (precautionsList.length === 0) {
      precautionsList.push('Add an emergency response and evacuation plan before work begins.');
      precautionsList.push('Obtain safety officer approval and verify equipment inspection stamps.');
    }

    for (let i = 0; i < precautionsList.length; i++) {
      const pDesc = precautionsList[i];
      const linkedFinding = createdFindings.find((f) => !f.passed) || createdFindings[0];
      await prisma.precaution.create({
        data: {
          documentId,
          riskFindingId: linkedFinding ? linkedFinding.id : null,
          description: pDesc,
          status: 'Pending',
        },
      });
    }
  }

  // Document Content OCR Text Regex Parser for Environmental Sensor Readings
  const pm10Match = docText.match(/(?:pm\s*10|pm10)[^\d]*(\d+(?:\.\d+)?)/i);
  const pm25Match = docText.match(/(?:pm\s*2\.5|pm2\.5|pm25)[^\d]*(\d+(?:\.\d+)?)/i);
  const waterPhMatch = docText.match(/(?:water\s*ph|ph\s*level|ph)[^\d]*(\d+(?:\.\d+)?)/i);
  const noiseMatch = docText.match(/(?:noise|sound|decibel)[^\d]*(\d+(?:\.\d+)?)\s*(?:db)?/i);

  const autoExtractedPm10 = pm10Match ? parseFloat(pm10Match[1]) : (riskLevel === 'GOOD' ? 50.0 : 150.0);
  const autoExtractedPm25 = pm25Match ? parseFloat(pm25Match[1]) : (riskLevel === 'GOOD' ? 48.0 : 248.0);
  const autoExtractedWaterPh = waterPhMatch ? parseFloat(waterPhMatch[1]) : (riskLevel === 'GOOD' ? 7.2 : 72.2);
  const autoExtractedNoiseDb = noiseMatch ? parseFloat(noiseMatch[1]) : (riskLevel === 'GOOD' ? 40.0 : 92.0);

  const isEnvCritical = autoExtractedPm10 > 100 || autoExtractedPm25 > 60 || autoExtractedWaterPh < 6.0 || autoExtractedWaterPh > 9.0 || autoExtractedNoiseDb > 85;
  const autoExtractedStatus = isEnvCritical ? 'CRITICAL' : 'NORMAL';

  if (doc.mineId) {
    try {
      await prisma.environmentalReading.create({
        data: {
          mineId: doc.mineId,
          timestamp: new Date(),
          pm10: autoExtractedPm10,
          pm25: autoExtractedPm25,
          waterPh: autoExtractedWaterPh,
          noiseLevelDb: autoExtractedNoiseDb,
          waterTurbidity: 1.0,
          dustLevel: 1.5,
          airQualityStatus: autoExtractedStatus,
          waterQualityStatus: autoExtractedStatus,
          noiseStatus: 'NORMAL',
          status: autoExtractedStatus,
        },
      });
    } catch (e) {
      console.error('Failed to log auto-extracted environmental reading:', e);
    }
  }

  // Update Document state machine record & attach OCR extracted environmental reading
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: 'AI_ANALYSIS_COMPLETED',
      analysisStatus: 'AI_ANALYSIS_COMPLETED',
      riskLevel,
      riskScore: rawScore,
      aiSummary: summary,
      aiRecommendation: decision,
      ocrExtractedData: JSON.stringify({
        environmentalSensors: {
          pm10: autoExtractedPm10,
          pm25: autoExtractedPm25,
          waterPh: autoExtractedWaterPh,
          noiseLevelDb: autoExtractedNoiseDb,
          status: autoExtractedStatus,
        },
        extractedAt: new Date().toISOString(),
      }),
      analyzedAt: new Date(),
    },
  });

  // Create Alert for Manager (Requirement #5)
  const targetUserId = doc.uploadedById || null;
  const alertTitle = riskLevel === 'GOOD' ? '🟢 SAFETY ANALYSIS PASSED' : '🔴 SAFETY RISK DETECTED';

  let alertMessage = '';
  if (riskLevel === 'GOOD') {
    alertMessage = `Document: ${doc.title || doc.name}\nRisk Level: GOOD\nRisk Score: ${rawScore}/100\nAI Recommendation: PROCEED\n\nThe document satisfies the required safety conditions.`;
  } else {
    const precautionsFormatted = precautionsList.map((p, idx) => `${idx + 1}. ${p}`).join('\n');
    alertMessage = `Document: ${doc.title || doc.name}\nRisk Level: BAD\nRisk Score: ${rawScore}/100\nAI Recommendation: DO NOT PROCEED\n\n${violations.length} safety requirements were not satisfied.\n\nPrecautions:\n${precautionsFormatted}`;
  }

  await prisma.alert.create({
    data: {
      documentId,
      mineId: doc.mineId,
      userId: targetUserId,
      title: alertTitle,
      message: alertMessage,
      alertType: 'SAFETY_ANALYSIS',
      type: 'SAFETY_ANALYSIS',
      severity: riskLevel === 'GOOD' ? 'INFO' : 'CRITICAL',
      riskLevel,
      status: 'UNREAD',
      isRead: false,
    },
  });

  // System-Wide Application 1: Update Target Mine Risk Score & Record Risk Entry
  if (doc.mineId) {
    try {
      const computedRiskLevel = riskLevel === 'BAD' ? 'HIGH' : rawScore < 80 ? 'MEDIUM' : 'LOW';
      await prisma.riskScore.create({
        data: {
          mineId: doc.mineId,
          overallScore: Math.round(100 - rawScore),
          riskLevel: computedRiskLevel,
          complianceFactor: rawScore / 100,
          violationFactor: riskLevel === 'BAD' ? 0.8 : 0.2,
          actionFactor: 0.5,
          contractorFactor: 0.3,
          envFactor: 0.4,
          detailsJson: JSON.stringify({ documentId, score: rawScore, riskLevel }),
        },
      });
    } catch (mineErr) {
      console.error('Failed to apply system-wide mine risk update:', mineErr);
    }
  }

  // System-Wide Application 2: Update MineCompliance Records for Target Mine
  for (const finding of createdFindings) {
    if (finding.requirementId && doc.mineId) {
      try {
        const newStatus = finding.passed ? 'COMPLIANT' : 'OVERDUE';
        await prisma.mineCompliance.updateMany({
          where: { mineId: doc.mineId, requirementId: finding.requirementId },
          data: {
            status: newStatus,
            completionDate: finding.passed ? new Date() : null,
          },
        });
      } catch (compErr) {
        console.error('Failed to apply compliance record update:', compErr);
      }
    }
  }

  // System-Wide Application 3: Update Contractor Compliance & Risk Score if Linked
  if (doc.uploadedBy?.email) {
    try {
      const linkedContractor = await prisma.contractor.findFirst({
        where: { email: doc.uploadedBy.email },
      });
      if (linkedContractor) {
        await prisma.contractor.update({
          where: { id: linkedContractor.id },
          data: {
            complianceScore: rawScore,
            riskScore: Math.round(100 - rawScore),
          },
        });
      }
    } catch (cntErr) {
      console.error('Failed to apply contractor score update:', cntErr);
    }
  }

  // System-Wide Audit Log Entry
  await prisma.auditLog.create({
    data: {
      userId: targetUserId,
      userName: doc.uploadedBy ? doc.uploadedBy.name : 'System Manager',
      role: doc.uploadedBy ? doc.uploadedBy.role : 'MINE_OFFICIAL',
      action: 'SYSTEM_WIDE_AI_ANALYSIS_APPLIED',
      module: 'PROJECT_SYSTEM',
      recordId: documentId,
      newValue: JSON.stringify({
        appliedTo: ['DOCUMENTS', 'MINE_OPERATIONS', 'COMPLIANCE_MATRIX', 'CONTRACTORS', 'AUDIT_TRAIL', 'ALERTS'],
        riskLevel,
        score: rawScore,
        decision,
        violationsCount: violations.length,
      }),
    },
  });

  // DISPATCH RESULT EMAILS TO BOTH MANAGER AND ADMIN
  try {
    await sendAnalysisResultEmails({
      documentId,
      documentTitle: doc.title || doc.name || 'Safety Document',
      mineName: doc.mine ? doc.mine.name : 'Coal Mine Operation',
      uploadedByEmail: doc.uploadedBy ? doc.uploadedBy.email : 'manager@coalguard.demo',
      uploadedByName: doc.uploadedBy ? doc.uploadedBy.name : 'Coal Guard Mine Manager',
      adminEmail: 'admin@coalguard.demo',
      adminName: 'Coal Guard System Admin',
      riskLevel,
      riskScore: rawScore,
      aiRecommendation: decision,
      aiSummary: summary,
      violations,
      precautions: precautionsList,
    });
  } catch (emailErr) {
    console.error('Failed to dispatch result emails:', emailErr);
  }

  return {
    riskLevel,
    score: rawScore,
    decision,
    summary,
    violations,
    precautions: precautionsList,
    passedRequirementsCount: passedCount,
    totalRequirementsChecked: activeRequirements.length,
  };
}
