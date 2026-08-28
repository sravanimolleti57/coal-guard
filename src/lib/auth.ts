import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'coal-guard-super-secret-key-2026';

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  subsidiaryId?: string | null;
  mineId?: string | null;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function getAuthUser(req: NextRequest): TokenPayload | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }

  const cookieToken = req.cookies.get('cg_token')?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Role permission mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'manage_subsidiaries',
    'manage_mines',
    'manage_users',
    'configure_compliance',
    'view_corporate_dashboard',
    'view_audit_logs',
    'system_settings',
    'manage_violations',
    'manage_contractors',
    'perform_inspection'
  ],
  MINE_OFFICIAL: [
    'manage_mine_operations',
    'view_compliance',
    'manage_inspections',
    'manage_violations',
    'manage_corrective_actions',
    'manage_contractors',
    'manage_attendance',
    'manage_production',
    'manage_environment',
    'upload_documents',
    'view_mine_dashboard'
  ],
  FIELD_INSPECTOR: [
    'perform_inspection',
    'capture_observation',
    'create_violation',
    'assign_corrective_action',
    'verify_closure',
    'view_inspections'
  ],
  REGULATORY_AUTHORITY: [
    'view_assigned_mines',
    'view_compliance',
    'view_inspections',
    'view_violations',
    'monitor_corrective_actions',
    'view_regulatory_reports',
    'view_audit_trail'
  ],
  CONTRACTOR: [
    'view_contractor_profile',
    'view_assigned_contracts',
    'view_workers',
    'upload_contractor_documents',
    'view_compliance_status',
    'respond_corrective_action'
  ]
};

export function hasPermission(role: string, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission) || role === 'SUPER_ADMIN';
}
