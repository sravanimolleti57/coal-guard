'use client';

import React from 'react';
import Shell from '@/components/layout/Shell';
import ManagerReviewAnalysis from '@/components/manager/ManagerReviewAnalysis';

export default function ManagerReviewAnalysisPage() {
  return (
    <Shell activeTab="manager-review">
      <ManagerReviewAnalysis />
    </Shell>
  );
}
