'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AdminDocumentDashboard from '@/components/admin/AdminDocumentDashboard';
import Shell from '@/components/layout/Shell';
import { ShieldAlert, LogIn } from 'lucide-react';
import Link from 'next/link';

function AdminDocumentsContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-950 p-8 text-center text-xs text-slate-400">Verifying Admin Access...</div>;
  }

  // Frontend Route Protection: Only allow ADMIN / SUPER_ADMIN / REGULATORY_AUTHORITY
  const isAuthorized = user && ['ADMIN', 'SUPER_ADMIN', 'REGULATORY_AUTHORITY'].includes(user.role);

  return (
    <Shell activeTab="admin-documents" setActiveTab={() => {}}>
      {isAuthorized ? (
        <AdminDocumentDashboard />
      ) : (
        <div className="bg-slate-900 border border-red-800/60 p-8 rounded-3xl text-center max-w-lg mx-auto space-y-4 my-12 shadow-2xl">
          <div className="w-16 h-16 bg-red-950/80 border border-red-800 text-red-400 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">403 Forbidden / Access Denied</h2>
          <p className="text-xs text-slate-300">
            You do not have permission to access the Admin Document Review Dashboard. Manager accounts cannot view admin review tools.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
            >
              <LogIn className="w-4 h-4" /> Switch to Admin Login
            </Link>
          </div>
        </div>
      )}
    </Shell>
  );
}

export default function AdminDocumentsPage() {
  return (
    <AuthProvider>
      <AdminDocumentsContent />
    </AuthProvider>
  );
}
