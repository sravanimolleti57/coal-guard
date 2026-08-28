'use client';

import React, { useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import Shell from '@/components/layout/Shell';
import CorporateDashboard from '@/components/dashboard/CorporateDashboard';
import MineManagement from '@/components/mines/MineManagement';
import ComplianceMatrix from '@/components/compliance/ComplianceMatrix';
import FieldInspectionApp from '@/components/inspections/FieldInspectionApp';
import ViolationTracker from '@/components/violations/ViolationTracker';
import ContractorHub from '@/components/contractors/ContractorHub';
import ProductionMonitor from '@/components/production/ProductionMonitor';
import EnvMonitor from '@/components/environment/EnvMonitor';
import DocumentVault from '@/components/documents/DocumentVault';
import GisMap from '@/components/gis/GisMap';
import AiRiskEngine from '@/components/ai/AiRiskEngine';
import AiAssistant from '@/components/ai/AiAssistant';
import NotificationCenter from '@/components/alerts/NotificationCenter';
import ReportGenerator from '@/components/reports/ReportGenerator';
import AuditLogViewer from '@/components/audit/AuditLogViewer';
import UserManager from '@/components/users/UserManager';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CorporateDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'mines':
        return <MineManagement />;
      case 'compliance':
        return <ComplianceMatrix />;
      case 'inspections':
        return <FieldInspectionApp />;
      case 'violations':
        return <ViolationTracker />;
      case 'contractors':
        return <ContractorHub />;
      case 'production':
        return <ProductionMonitor />;
      case 'environment':
        return <EnvMonitor />;
      case 'documents':
        return <DocumentVault />;
      case 'gis':
        return <GisMap />;
      case 'risk':
        return <AiRiskEngine />;
      case 'ai-assistant':
        return <AiAssistant />;
      case 'alerts':
        return <NotificationCenter />;
      case 'reports':
        return <ReportGenerator />;
      case 'audit':
        return <AuditLogViewer />;
      case 'users':
        return <UserManager />;
      default:
        return <CorporateDashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <AuthProvider>
      <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderTabContent()}
      </Shell>
    </AuthProvider>
  );
}
