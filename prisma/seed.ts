import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting COAL-GUARD AI Synthetic Seed Population...');

  // Password Hash for all demo accounts: "CoalGuard@2026"
  const passwordHash = await bcrypt.hash('CoalGuard@2026', 10);

  // 1. Clean existing records
  await prisma.auditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.riskScore.deleteMany();
  await prisma.document.deleteMany();
  await prisma.environmentalReading.deleteMany();
  await prisma.productionRecord.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.actionTimeline.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.violation.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.inspectionChecklist.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.mineCompliance.deleteMany();
  await prisma.complianceRequirement.deleteMany();
  await prisma.complianceCategory.deleteMany();
  await prisma.mineZone.deleteMany();
  await prisma.user.deleteMany();
  await prisma.mine.deleteMany();
  await prisma.region.deleteMany();
  await prisma.subsidiary.deleteMany();

  // 2. Create Subsidiaries
  const ecl = await prisma.subsidiary.create({
    data: {
      name: 'Eastern Coalfields Limited (ECL)',
      code: 'ECL',
      state: 'West Bengal / Jharkhand',
      description: 'Major coal producer in Raniganj and Mugma coalfields under Coal India Ltd.'
    }
  });

  const bccl = await prisma.subsidiary.create({
    data: {
      name: 'Bharat Coking Coal Limited (BCCL)',
      code: 'BCCL',
      state: 'Jharkhand',
      description: 'Prime producer of prime coking coal operating in Jharia Coalfield.'
    }
  });

  const ccl = await prisma.subsidiary.create({
    data: {
      name: 'Central Coalfields Limited (CCL)',
      code: 'CCL',
      state: 'Jharkhand',
      description: 'Operates major opencast coalfields in Ramgarh, Bokaro & North Karanpura.'
    }
  });

  // 3. Create Regions
  const regRaniganj = await prisma.region.create({
    data: { name: 'Raniganj Coalfield Region', code: 'RAN-REG', subsidiaryId: ecl.id }
  });
  const regJharia = await prisma.region.create({
    data: { name: 'Jharia Coking Region', code: 'JHA-REG', subsidiaryId: bccl.id }
  });
  const regKaranpura = await prisma.region.create({
    data: { name: 'North Karanpura Region', code: 'NK-REG', subsidiaryId: ccl.id }
  });

  // 4. Create Mines
  const mine1 = await prisma.mine.create({
    data: {
      name: 'Sonepur Bazari OpenCast Project',
      code: 'SBN-OCP-01',
      subsidiaryId: ecl.id,
      regionId: regRaniganj.id,
      state: 'West Bengal',
      district: 'Paschim Bardhaman',
      latitude: 23.6934,
      longitude: 87.2185,
      mineType: 'OPENCAST',
      status: 'OPERATIONAL',
      productionTarget: 12.5,
      contactName: 'Rajesh Sharma (General Manager)',
      contactEmail: 'gm.sonepur@ecl.coalindia.in'
    }
  });

  const mine2 = await prisma.mine.create({
    data: {
      name: 'Rajrappa Opencast Mine',
      code: 'RJP-OCP-02',
      subsidiaryId: ccl.id,
      regionId: regKaranpura.id,
      state: 'Jharkhand',
      district: 'Ramgarh',
      latitude: 23.6189,
      longitude: 85.7032,
      mineType: 'OPENCAST',
      status: 'OPERATIONAL',
      productionTarget: 8.0,
      contactName: 'Anil Kumar (Mine Manager)',
      contactEmail: 'manager.rajrappa@ccl.gov.in'
    }
  });

  const mine3 = await prisma.mine.create({
    data: {
      name: 'Jharia Prime Coking Mine 4',
      code: 'JHA-PCM-04',
      subsidiaryId: bccl.id,
      regionId: regJharia.id,
      state: 'Jharkhand',
      district: 'Dhanbad',
      latitude: 23.7483,
      longitude: 86.4158,
      mineType: 'UNDERGROUND',
      status: 'OPERATIONAL',
      productionTarget: 4.5,
      contactName: 'Sunil Prasad (Safety Agent)',
      contactEmail: 'agent.jharia@bccl.gov.in'
    }
  });

  const mine4 = await prisma.mine.create({
    data: {
      name: 'Piparwar Opencast Project',
      code: 'PIP-OCP-05',
      subsidiaryId: ccl.id,
      regionId: regKaranpura.id,
      state: 'Jharkhand',
      district: 'Chatra',
      latitude: 23.7312,
      longitude: 85.0451,
      mineType: 'OPENCAST',
      status: 'OPERATIONAL',
      productionTarget: 10.0,
      contactName: 'Deepak Roy (Mine Manager)',
      contactEmail: 'manager.piparwar@ccl.gov.in'
    }
  });

  const mine5 = await prisma.mine.create({
    data: {
      name: 'Mugma Underground Colliery',
      code: 'MUG-UG-06',
      subsidiaryId: ecl.id,
      regionId: regRaniganj.id,
      state: 'Jharkhand',
      district: 'Dhanbad',
      latitude: 23.7661,
      longitude: 86.7289,
      mineType: 'UNDERGROUND',
      status: 'UNDER_MAINTENANCE',
      productionTarget: 2.2,
      contactName: 'A. K. Verma (Colliery Manager)',
      contactEmail: 'manager.mugma@ecl.gov.in'
    }
  });

  // Additional 3 mines to complete 8 mines
  const mine6 = await prisma.mine.create({
    data: {
      name: 'Kusmunda Super Opencast Mine',
      code: 'KUS-SOCP-07',
      subsidiaryId: ecl.id,
      regionId: regRaniganj.id,
      state: 'West Bengal',
      district: 'Purulia',
      latitude: 23.5123,
      longitude: 86.8456,
      mineType: 'OPENCAST',
      status: 'OPERATIONAL',
      productionTarget: 15.0,
      contactName: 'Subrata Das (GM Ops)',
      contactEmail: 'gm.kusmunda@ecl.gov.in'
    }
  });

  const mine7 = await prisma.mine.create({
    data: {
      name: 'Katas Opencast Project',
      code: 'KAT-OCP-08',
      subsidiaryId: bccl.id,
      regionId: regJharia.id,
      state: 'Jharkhand',
      district: 'Dhanbad',
      latitude: 23.8105,
      longitude: 86.3214,
      mineType: 'OPENCAST',
      status: 'OPERATIONAL',
      productionTarget: 6.2,
      contactName: 'Vikram Singh (Manager)',
      contactEmail: 'manager.katas@bccl.gov.in'
    }
  });

  const mine8 = await prisma.mine.create({
    data: {
      name: 'Kathara Coal Washery & Pit',
      code: 'KTH-CWP-09',
      subsidiaryId: ccl.id,
      regionId: regKaranpura.id,
      state: 'Jharkhand',
      district: 'Bokaro',
      latitude: 23.7541,
      longitude: 85.8723,
      mineType: 'MIXED',
      status: 'OPERATIONAL',
      productionTarget: 7.8,
      contactName: 'Praveen Mehta (Washery In-Charge)',
      contactEmail: 'incharge.kathara@ccl.gov.in'
    }
  });

  // 5. Create Mine Zones
  const zone1A = await prisma.mineZone.create({
    data: { mineId: mine1.id, name: 'Zone A - Main Extraction Pit', code: 'SBN-ZA', latitude: 23.6940, longitude: 87.2190, riskLevel: 'MEDIUM' }
  });
  const zone1B = await prisma.mineZone.create({
    data: { mineId: mine1.id, name: 'Zone B - Overburden Dump 2', code: 'SBN-ZB', latitude: 23.6920, longitude: 87.2170, riskLevel: 'HIGH' }
  });
  const zone2A = await prisma.mineZone.create({
    data: { mineId: mine2.id, name: 'Pit 1 - Seam VI Slope', code: 'RJP-P1', latitude: 23.6195, longitude: 85.7040, riskLevel: 'CRITICAL' }
  });
  const zone3A = await prisma.mineZone.create({
    data: { mineId: mine3.id, name: 'Underground Face 3B', code: 'JHA-F3B', latitude: 23.7480, longitude: 86.4160, riskLevel: 'HIGH' }
  });

  // 6. Create Users across all 5 Roles
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@coalguard.gov.in',
      passwordHash,
      name: 'Dr. Ramesh Narayan (Super Admin)',
      role: 'SUPER_ADMIN',
      designation: 'Director General of Mine Safety & Governance',
      phone: '+91 98300 11223'
    }
  });

  const mineOfficialUser = await prisma.user.create({
    data: {
      email: 'gm.sonepur@ecl.coalindia.in',
      passwordHash,
      name: 'Rajesh Sharma',
      role: 'MINE_OFFICIAL',
      designation: 'General Manager - Sonepur Bazari',
      subsidiaryId: ecl.id,
      mineId: mine1.id,
      phone: '+91 94340 55667'
    }
  });

  const inspectorUser = await prisma.user.create({
    data: {
      email: 'inspector.singh@dgms.gov.in',
      passwordHash,
      name: 'Amitabh Singh',
      role: 'FIELD_INSPECTOR',
      designation: 'Senior Statutory DGMS Inspector',
      phone: '+91 97110 44332'
    }
  });

  const regUser = await prisma.user.create({
    data: {
      email: 'regulatory.cpcb@gov.in',
      passwordHash,
      name: 'Priyanka Banerjee',
      role: 'REGULATORY_AUTHORITY',
      designation: 'CPCB State Environmental Officer',
      phone: '+91 98311 99001'
    }
  });

  const contractorUser = await prisma.user.create({
    data: {
      email: 'contact@bharatexcavators.com',
      passwordHash,
      name: 'Suresh Singhania',
      role: 'CONTRACTOR',
      designation: 'Managing Director - Bharat Excavators',
      phone: '+91 98301 77889'
    }
  });

  // 7. Create Compliance Categories & Requirements
  const catSafety = await prisma.complianceCategory.create({
    data: { name: 'Safety & DGMS Regulations', code: 'CAT-SAFETY', description: 'Statutory compliance under Coal Mines Regulations 2017 & Mines Act 1952.' }
  });
  const catEnv = await prisma.complianceCategory.create({
    data: { name: 'Environmental Clearances (CPCB/SPCB)', code: 'CAT-ENV', description: 'Air quality, mine water discharge, noise limits, and overburden afforestation.' }
  });
  const catProd = await prisma.complianceCategory.create({
    data: { name: 'Production & Heavy Machinery', code: 'CAT-PROD', description: 'HEMM maintenance, haul road gradient audit, conveyor safety switches.' }
  });
  const catLabour = await prisma.complianceCategory.create({
    data: { name: 'Labour Welfare & Biometric Attendance', code: 'CAT-LABOUR', description: 'Contractor worker insurance, PPE distribution, and Form D attendance registers.' }
  });

  const req1 = await prisma.complianceRequirement.create({
    data: {
      title: 'Quarterly Slope Stability & Highwall Audit (CMR 2017 Reg 106)',
      code: 'COMP-DGMS-001',
      categoryId: catSafety.id,
      frequency: 'QUARTERLY',
      riskLevel: 'CRITICAL',
      description: 'Geotechnical assessment of opencast pit slopes and overburden dumps to prevent landslides.'
    }
  });

  const req2 = await prisma.complianceRequirement.create({
    data: {
      title: 'Monthly Air Quality Monitoring & PM10/PM2.5 Certification',
      code: 'COMP-CPCB-002',
      categoryId: catEnv.id,
      frequency: 'MONTHLY',
      riskLevel: 'HIGH',
      description: 'Continuous ambient air quality monitoring (CAAQM) reports submitted to State Pollution Control Board.'
    }
  });

  const req3 = await prisma.complianceRequirement.create({
    data: {
      title: 'Underground Methane & Inflammable Gas Inspection Log',
      code: 'COMP-DGMS-003',
      categoryId: catSafety.id,
      frequency: 'DAILY',
      riskLevel: 'CRITICAL',
      description: 'Gas detector calibration and flame safety lamp checks before shift commencement.'
    }
  });

  const req4 = await prisma.complianceRequirement.create({
    data: {
      title: 'Contractor Worker Form D & Biometric Verification Audit',
      code: 'COMP-LAB-004',
      categoryId: catLabour.id,
      frequency: 'MONTHLY',
      riskLevel: 'MEDIUM',
      description: 'Cross-verification of contractor biometric check-ins against Form D attendance registers.'
    }
  });

  // 8. Create Mine Compliances
  await prisma.mineCompliance.create({
    data: {
      mineId: mine1.id,
      requirementId: req1.id,
      status: 'COMPLIANT',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      completionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      responsiblePerson: 'Rajesh Sharma',
      remarks: 'CMPDI Slope Audit team certified pit stability on 23rd August.'
    }
  });

  await prisma.mineCompliance.create({
    data: {
      mineId: mine2.id,
      requirementId: req1.id,
      status: 'OVERDUE',
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      responsiblePerson: 'Anil Kumar',
      remarks: 'Overdue due to delay in third-party radar survey report.'
    }
  });

  await prisma.mineCompliance.create({
    data: {
      mineId: mine1.id,
      requirementId: req2.id,
      status: 'COMPLIANT',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      completionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      responsiblePerson: 'Priyanka Banerjee',
      remarks: 'PM10 readings within 100 ug/m3 prescribed limit.'
    }
  });

  await prisma.mineCompliance.create({
    data: {
      mineId: mine3.id,
      requirementId: req3.id,
      status: 'DUE_SOON',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      responsiblePerson: 'Sunil Prasad',
      remarks: 'Daily methanometer log entry scheduled for morning shift.'
    }
  });

  // 9. Create Inspections, Checklist, Observations
  const insp1 = await prisma.inspection.create({
    data: {
      mineId: mine1.id,
      zoneId: zone1B.id,
      inspectorId: inspectorUser.id,
      type: 'Safety',
      scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      actualDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'COMPLETED',
      latitude: 23.6920,
      longitude: 87.2170,
      overallResult: 'ACTION_REQUIRED',
      summary: 'Haul road water spraying insufficient causing high dust visibility hazard near Pit Dump 2.'
    }
  });

  await prisma.inspectionChecklist.create({
    data: {
      inspectionId: insp1.id,
      category: 'Haul Road Safety',
      itemText: 'Water tanker deployment every 2 hours on active haul roads',
      status: 'FAILED',
      observation: 'Only 1 tanker active instead of 4 required tankers.'
    }
  });

  const obs1 = await prisma.observation.create({
    data: {
      inspectionId: insp1.id,
      description: 'Severe dust plume obscuring dumper operator line-of-sight at Bench 4 junction.',
      severity: 'HIGH',
      photoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=60',
      latitude: 23.6922,
      longitude: 87.2174,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  });

  // 10. Create Violations & Corrective Actions (CAPA)
  const viol1 = await prisma.violation.create({
    data: {
      violationNumber: 'VIOL-2026-0891',
      mineId: mine1.id,
      zoneId: zone1B.id,
      inspectionId: insp1.id,
      categoryId: catSafety.id,
      description: 'Failure to control ambient airborne dust on Haul Road Bench 4 posing collision risk for 240T Dumpers.',
      severity: 'HIGH',
      status: 'ASSIGNED',
      responsiblePersonId: mineOfficialUser.id,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
    }
  });

  const capa1 = await prisma.correctiveAction.create({
    data: {
      violationId: viol1.id,
      title: 'Deploy 3 Additional 28KL Water Sprinklers & Install Auto Mist Suppression Systems',
      description: 'Procure extra water browser shifts and fix mist nozzles at Bench 4 haul junction.',
      assignedToId: mineOfficialUser.id,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
      escalationLevel: 0
    }
  });

  await prisma.actionTimeline.create({
    data: {
      correctiveActionId: capa1.id,
      status: 'ASSIGNED',
      note: 'Violation created during DGMS Inspection by Amitabh Singh.',
      performedById: inspectorUser.id
    }
  });

  await prisma.actionTimeline.create({
    data: {
      correctiveActionId: capa1.id,
      status: 'IN_PROGRESS',
      note: 'Requisition sent to Equipment Yard for 3 Additional Water Sprinklers.',
      performedById: mineOfficialUser.id
    }
  });

  // 11. Create Contractors, Contracts, Workers & Attendance
  const contractor1 = await prisma.contractor.create({
    data: {
      companyName: 'Bharat Excavators & Haulage Ltd',
      registrationNumber: 'REG-CONTRACT-8812',
      contactPerson: 'Suresh Singhania',
      email: 'contact@bharatexcavators.com',
      phone: '+91 98301 77889',
      workerCount: 340,
      status: 'ACTIVE',
      riskScore: 18.5,
      complianceScore: 94.2
    }
  });

  const contractor2 = await prisma.contractor.create({
    data: {
      companyName: 'Eastern Mining & Earthmovers Pvt Ltd',
      registrationNumber: 'REG-CONTRACT-9904',
      contactPerson: 'Manoj Tripathy',
      email: 'manoj@easternearth.in',
      phone: '+91 94311 66554',
      workerCount: 180,
      status: 'UNDER_REVIEW',
      riskScore: 68.0,
      complianceScore: 62.5
    }
  });

  await prisma.contract.create({
    data: {
      contractorId: contractor1.id,
      mineId: mine1.id,
      title: 'Sonepur Bazari Overburden Removal & Dumper Fleet Contract 2026',
      contractNumber: 'CNT-ECL-2026-041',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2028-12-31'),
      status: 'ACTIVE',
      value: 4500.0
    }
  });

  const worker1 = await prisma.worker.create({
    data: {
      contractorId: contractor1.id,
      mineId: mine1.id,
      name: 'Rameshwar Mahato',
      workerCode: 'WRK-BE-1029',
      role: 'Heavy Equipment Operator (240T Dumper)',
      status: 'ACTIVE'
    }
  });

  await prisma.attendance.create({
    data: {
      workerId: worker1.id,
      mineId: mine1.id,
      contractorId: contractor1.id,
      date: new Date(),
      shift: 'SHIFT_A_MORNING',
      status: 'PRESENT',
      checkIn: new Date(Date.now() - 4 * 60 * 60 * 1000)
    }
  });

  // 12. Create Production Records
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    await prisma.productionRecord.create({
      data: {
        mineId: mine1.id,
        date: d,
        targetSeam: 'Seam IV - Raniganj High Grade Coal',
        targetTonnage: 35000.0,
        actualTonnage: 34200.0 - i * 400.0,
        dispatchTonnage: 33000.0 - i * 350.0,
        downtimeHours: i === 2 ? 3.5 : 0.5,
        downtimeReason: i === 2 ? 'Shovel 4 Hydraulics Hose Failure' : 'Routine Maintenance'
      }
    });
  }

  // 13. Create Environmental Readings
  await prisma.environmentalReading.create({
    data: {
      mineId: mine1.id,
      zoneId: zone1A.id,
      timestamp: new Date(),
      pm25: 48.5,
      pm10: 92.0,
      airQualityStatus: 'NORMAL',
      waterPh: 7.2,
      waterTurbidity: 4.8,
      waterQualityStatus: 'NORMAL',
      noiseLevelDb: 68.4,
      noiseStatus: 'NORMAL',
      dustLevel: 1.2,
      status: 'NORMAL'
    }
  });

  await prisma.environmentalReading.create({
    data: {
      mineId: mine2.id,
      zoneId: zone2A.id,
      timestamp: new Date(),
      pm25: 142.0,
      pm10: 285.0,
      airQualityStatus: 'CRITICAL',
      waterPh: 5.8,
      waterTurbidity: 18.5,
      waterQualityStatus: 'WARNING',
      noiseLevelDb: 92.0,
      noiseStatus: 'CRITICAL',
      dustLevel: 4.8,
      status: 'CRITICAL'
    }
  });

  // 14. Create Documents with OCR extracted text
  await prisma.document.create({
    data: {
      title: 'DGMS Statutory Mine Safety Clearance & Environmental Permit 2026',
      docType: 'LICENSE',
      docNumber: 'DGMS-EZ-PERMIT-2026-908',
      mineId: mine1.id,
      complianceRequirementId: req1.id,
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      issueDate: new Date('2026-01-10'),
      expiryDate: new Date('2027-01-09'),
      ocrExtractedData: JSON.stringify({
        documentType: 'Statutory Mining License',
        documentNumber: 'DGMS-EZ-PERMIT-2026-908',
        issuedTo: 'Sonepur Bazari Opencast Project (ECL)',
        issueDate: '2026-01-10',
        expiryDate: '2027-01-09',
        permittedDepthMeters: 280,
        complianceCategory: 'Safety & DGMS Regulations'
      }),
      status: 'ACTIVE'
    }
  });

  // 15. Create Risk Scores
  await prisma.riskScore.create({
    data: {
      mineId: mine1.id,
      overallScore: 24.5,
      riskLevel: 'LOW',
      complianceFactor: 92.0,
      violationFactor: 15.0,
      actionFactor: 10.0,
      contractorFactor: 12.0,
      envFactor: 18.0,
      detailsJson: JSON.stringify({
        summary: 'Mine operating safely within green thresholds.',
        strengths: ['High compliance completion (92%)', 'Strong contractor safety records'],
        actionsNeeded: ['Resolve Bench 4 dust suppression CAPA']
      })
    }
  });

  await prisma.riskScore.create({
    data: {
      mineId: mine2.id,
      overallScore: 84.0,
      riskLevel: 'CRITICAL',
      complianceFactor: 42.0,
      violationFactor: 88.0,
      actionFactor: 90.0,
      contractorFactor: 76.0,
      envFactor: 85.0,
      detailsJson: JSON.stringify({
        summary: 'Critical Slope instability & Air Quality alerts triggered.',
        criticalFactors: ['Overdue Slope Audit under DGMS CMR 106', 'PM10 air pollution exceeds statutory limit (285 ug/m3)']
      })
    }
  });

  // 16. Create Alerts & Notifications
  await prisma.alert.create({
    data: {
      mineId: mine2.id,
      title: 'CRITICAL: Slope Stability Audit Overdue by 10 Days',
      message: 'Rajrappa Opencast Pit 1 Seam VI slope stability audit is overdue under DGMS CMR 2017 Reg 106.',
      alertType: 'COMPLIANCE',
      severity: 'CRITICAL',
      status: 'UNREAD',
      entityType: 'MINE_COMPLIANCE',
      entityId: mine2.id
    }
  });

  await prisma.alert.create({
    data: {
      mineId: mine2.id,
      title: 'ENVIRONMENTAL ALERT: PM10 Threshold Breached (285 ug/m3)',
      message: 'Ambient dust sensor at Pit 1 slope recorded critical air quality breach.',
      alertType: 'ENVIRONMENTAL',
      severity: 'CRITICAL',
      status: 'UNREAD',
      entityType: 'ENVIRONMENTAL_READING',
      entityId: mine2.id
    }
  });

  // 17. Create Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      userName: 'Dr. Ramesh Narayan',
      role: 'SUPER_ADMIN',
      action: 'SYSTEM_INITIALIZATION',
      module: 'AUTH',
      previousValue: null,
      newValue: JSON.stringify({ status: 'COAL-GUARD AI System Online', timestamp: new Date() }),
      ipAddress: '127.0.0.1'
    }
  });

  console.log('✅ Synthetic seed population completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed population failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
