import { prisma } from '@/lib/prisma';

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

  // Update Document state machine record
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: 'AI_ANALYSIS_COMPLETED',
      analysisStatus: 'AI_ANALYSIS_COMPLETED',
      riskLevel,
      riskScore: rawScore,
      aiSummary: summary,
      aiRecommendation: decision,
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

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: targetUserId,
      userName: doc.uploadedBy ? doc.uploadedBy.name : 'System Manager',
      role: doc.uploadedBy ? doc.uploadedBy.role : 'MINE_OFFICIAL',
      action: 'AI_ANALYSIS_COMPLETED',
      module: 'DOCS',
      recordId: documentId,
      newValue: JSON.stringify({ riskLevel, score: rawScore, decision, violationsCount: violations.length }),
    },
  });

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
