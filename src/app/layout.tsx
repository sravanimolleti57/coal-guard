import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'COAL-GUARD AI — Smart Governance, Compliance & Risk Monitoring Platform',
  description: 'AI-Powered Governance, Statutory DGMS & CPCB Compliance, Inspection, Environmental Telemetry & Risk Monitoring Platform for the Indian Coal Mining Ecosystem.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased bg-slate-950 text-slate-100">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
