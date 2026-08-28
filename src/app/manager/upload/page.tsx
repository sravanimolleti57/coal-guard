'use client';

import React from 'react';
import Shell from '@/components/layout/Shell';
import ManagerDocumentUpload from '@/components/manager/ManagerDocumentUpload';

export default function ManagerUploadPage() {
  return (
    <Shell activeTab="manager-upload">
      <ManagerDocumentUpload />
    </Shell>
  );
}
