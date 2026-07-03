/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  HelpCircle,
  CheckCircle,
  Save,
  Plus,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';
import { UserRole } from '../../types';

interface RolePermissions {
  role: UserRole;
  manageOrgs: boolean;
  manageUsers: boolean;
  manageMentors: boolean;
  manageStudents: boolean;
  manageSessions: boolean;
  viewBilling: boolean;
  viewLogs: boolean;
  modifySettings: boolean;
}

const initialRolePermissions: RolePermissions[] = [
  {
    role: 'Super Admin',
    manageOrgs: true,
    manageUsers: true,
    manageMentors: true,
    manageStudents: true,
    manageSessions: true,
    viewBilling: true,
    viewLogs: true,
    modifySettings: true,
  },
  {
    role: 'Organization Admin',
    manageOrgs: false,
    manageUsers: true,
    manageMentors: true,
    manageStudents: true,
    manageSessions: true,
    viewBilling: true,
    viewLogs: false,
    modifySettings: false,
  },
  {
    role: 'Mentor',
    manageOrgs: false,
    manageUsers: false,
    manageMentors: false,
    manageStudents: true,
    manageSessions: true,
    viewBilling: false,
    viewLogs: false,
    modifySettings: false,
  },
  {
    role: 'Assistant',
    manageOrgs: false,
    manageUsers: true,
    manageMentors: false,
    manageStudents: true,
    manageSessions: true,
    viewBilling: false,
    viewLogs: false,
    modifySettings: false,
  },
  {
    role: 'Student',
    manageOrgs: false,
    manageUsers: false,
    manageMentors: false,
    manageStudents: false,
    manageSessions: false,
    viewBilling: false,
    viewLogs: false,
    modifySettings: false,
  }
];

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

export default function PermissionsView() {
  const { currentUser, logSecurityAudit } = useAuth();
  const [matrix, setMatrix] = useState<RolePermissions[]>(initialRolePermissions);

  const canRead = currentUser?.role === 'Super Admin' || currentUser?.role === 'Organization Admin';

  useEffect(() => {
    if (!currentUser || !canRead) return;

    async function loadData() {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('module', 'RolePermissions')
        .or(`organization.eq.Global,organization.eq."${currentUser.organization}"`);

      if (!error && data && data.length > 0) {
        const target = data.find((p: any) => p.organization === currentUser.organization) || data.find((p: any) => p.organization === 'Global');
        if (target && target.roles) {
          setMatrix(target.roles as RolePermissions[]);
        }
      }
    }
    loadData();
  }, [currentUser, canRead]);

  const [showToast, setShowToast] = useState(false);

  // List of all keys in permissions object
  const permissionKeys: Array<keyof Omit<RolePermissions, 'role'>> = [
    'manageOrgs',
    'manageUsers',
    'manageMentors',
    'manageStudents',
    'manageSessions',
    'viewBilling',
    'viewLogs',
    'modifySettings'
  ];

  // Readable labels for the keys
  const permissionLabels: Record<keyof Omit<RolePermissions, 'role'>, string> = {
    manageOrgs: 'Manage Tenant Organizations',
    manageUsers: 'Add/Suspend Users',
    manageMentors: 'Hire/Assign Faculty Mentors',
    manageStudents: 'Admit/Graduate Students',
    manageSessions: 'Schedule Class Lessons',
    viewBilling: 'Access Invoices & Ledgers',
    viewLogs: 'View Security Audit Logs',
    modifySettings: 'Configure System Integrations'
  };

  const handleTogglePermission = (role: UserRole, key: keyof Omit<RolePermissions, 'role'>) => {
    if (currentUser?.role === 'Organization Admin' && role === 'Super Admin') return;
    setMatrix((prev) =>
      prev.map((r) => {
        if (r.role === role) {
          return { ...r, [key]: !r[key] };
        }
        return r;
      })
    );
  };

  const handleCommitPermissions = async () => {
    if (!currentUser || !canRead) return;

    const resolvedOrg = currentUser.role === 'Super Admin' ? 'Global' : currentUser.organization;

    const { error } = await supabase
      .from('permissions')
      .upsert({
        module: 'RolePermissions',
        organization: resolvedOrg,
        roles: matrix
      });

    if (error) {
      console.error(error);
      alert('Error saving permissions policy: ' + error.message);
      return;
    }

    await logSecurityAudit(
      'Modify Permissions Matrix',
      'High',
      `Modified role-based permissions matrix overrides for organization "${resolvedOrg}".`
    );

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center font-sans">
        <ShieldAlert className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Security Access Violation</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          You do not hold the required authorization credentials to view or configure platform role matrices.
        </p>
      </div>
    );
  }

    const visibleMatrix = currentUser?.role === 'Organization Admin'
      ? matrix.filter((r) => r.role !== 'Super Admin')
      : matrix;

    const visiblePermissionKeys = currentUser?.role === 'Organization Admin'
      ? permissionKeys.filter((key) => key !== 'manageOrgs' && key !== 'viewLogs' && key !== 'modifySettings')
      : permissionKeys;

    return (
      <div className="space-y-6 font-sans">
        
        {/* Toast Alert */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs"
            >
              <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
              <span className="font-semibold">Security policy updated and synced globally!</span>
            </motion.div>
          )}
        </AnimatePresence>
  
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Access Control (RBAC)</h1>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Define fine-grained security policies, align platform credentials, and inspect role parameters</p>
          </div>
          <button
            onClick={handleCommitPermissions}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Save Policy Matrix</span>
          </button>
        </div>
  
        {/* Warning Alert Banner */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-850/60 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">Policy Authorization Precaution</h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium leading-normal">
              Modifying authorization scopes instantly modifies navigation menus and API route limits for all active user tokens. Please execute adjustments only under strict corporate security oversight.
            </p>
          </div>
        </div>
  
        {/* Matrix Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4 w-60">Security Permission Scopes</th>
                  {visibleMatrix.map((r) => (
                    <th key={r.role} className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-black text-slate-800 dark:text-white leading-tight font-sans">{r.role}</span>
                        <span className="text-[9px] text-slate-400 font-medium lowercase tracking-normal mt-0.5">Role level</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visiblePermissionKeys.map((key) => (
                  <tr key={key} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-all">
                    <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span>{permissionLabels[key]}</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-help shrink-0" title={`Grants authorization to execute ${permissionLabels[key].toLowerCase()}`} />
                      </div>
                    </td>
                    {visibleMatrix.map((row) => {
                      const isGranted = row[key];
                      return (
                        <td key={row.role} className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleTogglePermission(row.role, key)}
                            className="mx-auto block text-slate-400 hover:text-blue-500 cursor-pointer transition-colors"
                          >
                            {isGranted ? (
                              <CheckSquare className="w-5.2 h-5.2 text-blue-600" />
                            ) : (
                              <Square className="w-5.2 h-5.2 text-slate-200 dark:text-slate-700" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

    </div>
  );
}
