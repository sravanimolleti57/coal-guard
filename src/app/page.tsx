'use client';

import React, { useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import Shell from '@/components/layout/Shell';
import CorporateDashboard from '@/components/dashboard/CorporateDashboard';
import MineManagement from '@/components/mines/MineManagement';
import ComplianceMatrix from '@/components/compliance/ComplianceMatrix';
import ContractorHub from '@/components/contractors/ContractorHub';
import ProductionMonitor from '@/components/production/ProductionMonitor';
import AdminDocumentDashboard from '@/components/admin/AdminDocumentDashboard';
import GisMap from '@/components/gis/GisMap';
import AiAssistant from '@/components/ai/AiAssistant';
import NotificationCenter from '@/components/alerts/NotificationCenter';
import ReportGenerator from '@/components/reports/ReportGenerator';
import AuditLogViewer from '@/components/audit/AuditLogViewer';
import UserManager from '@/components/users/UserManager';
import ManagerDocumentUpload from '@/components/manager/ManagerDocumentUpload';
import ManagerReviewAnalysis from '@/components/manager/ManagerReviewAnalysis';
import AdminAiAnalysis from '@/components/admin/AdminAiAnalysis';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) setActiveTab(tab);
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'manager-upload':
        return <ManagerDocumentUpload onNavigateToReview={() => setActiveTab('manager-review')} />;
      case 'manager-review':
        return <ManagerReviewAnalysis />;
      case 'admin-ai-analysis':
        return <AdminAiAnalysis />;
      case 'dashboard':
        return <CorporateDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'mines':
        return <MineManagement />;
      case 'compliance':
        return <ComplianceMatrix />;
      case 'contractors':
        return <ContractorHub />;
      case 'production':
        return <ProductionMonitor />;
      case 'admin-documents':
        return <AdminDocumentDashboard />;
      case 'gis':
        return <GisMap />;
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
