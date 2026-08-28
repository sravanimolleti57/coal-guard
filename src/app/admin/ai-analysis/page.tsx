'use client';

import React from 'react';
import Shell from '@/components/layout/Shell';
import AdminAiAnalysis from '@/components/admin/AdminAiAnalysis';

export default function AdminAiAnalysisPage() {
  return (
    <Shell activeTab="admin-ai-analysis">
      <AdminAiAnalysis />
    </Shell>
  );
}
