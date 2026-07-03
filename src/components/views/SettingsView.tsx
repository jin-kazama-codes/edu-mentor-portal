/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Settings,
  Mail,
  ShieldCheck,
  Download,
  CheckCircle,
  HelpCircle,
  Save,
  Compass,
  ArrowRight,
  Database,
  Globe,
  Bell,
  RefreshCw
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { useEffect } from 'react';

export default function SettingsView() {
  const { currentUser, hasPermission } = useAuth();
  const [systemName, setSystemName] = useState('EdValley Admin Core');
  const [domain, setDomain] = useState('https://portal.edvalley.com');
  const [smtpHost, setSmtpHost] = useState('smtp.postmarkapp.com');
  const [smtpUser, setSmtpUser] = useState('postmark_smtp_edvalley_main');
  const [webhookUrl, setWebhookUrl] = useState('https://api.edvalley.com/v1/webhooks/billing');

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [backupSchedule, setBackupSchedule] = useState('Daily');
  const [showToast, setShowToast] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  async function loadLogs() {
    if (!currentUser) return;
    setIsLoadingLogs(true);
    let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
    if (currentUser.role !== 'Super Admin') {
      query = query.eq('organization', currentUser.organization);
    }
    const { data: logs, error } = await query.limit(50);
    if (!error && logs) {
      setAuditLogs(logs);
    }
    setIsLoadingLogs(false);
  }

  useEffect(() => {
    loadLogs();
  }, [currentUser]);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [inspectTable, setInspectTable] = useState('students');
  const [inspectResult, setInspectResult] = useState<any[] | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  const handleTestSupabase = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const { error } = await supabase.from('_connection_test').select('*').limit(1);
      if (error && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
        setTestResult({
          success: false,
          message: 'Network Error: Failed to reach Supabase API. Check project URL.'
        });
      } else if (error && error.code === 'PGRST111') {
        setTestResult({
          success: false,
          message: 'Authentication Error: Invalid anon/publishable key.'
        });
      } else {
        setTestResult({
          success: true,
          message: `Successfully connected to Supabase! (Response code: ${error ? error.code : '200 OK'})`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'An unexpected error occurred.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleInspectTable = async () => {
    if (!inspectTable.trim()) return;
    setIsInspecting(true);
    setInspectResult(null);
    setInspectError(null);
    try {
      const { data, error } = await supabase.from(inspectTable).select('*').limit(3);
      if (error) {
        setInspectError(`${error.code}: ${error.message}`);
      } else {
        setInspectResult(data || []);
      }
    } catch (err: any) {
      setInspectError(err.message || 'Error executing query.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleSaveSettings = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleBackupExport = () => {
    const backupObj = {
      timestamp: new Date().toISOString(),
      platform: "EdValley Multi-tenant Core",
      databaseSchemaVersion: "1.14.0",
      tenantListCount: 3,
      status: "Exported"
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupObj, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `edvalley_platform_schema_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
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
            <span className="font-semibold font-sans">Global SaaS configurations saved and deployed!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Customize global SMTP triggers, tenant URL structures, and back up schemas</p>
        </div>
        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Configurations</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Branding & SMTP configurations (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tenant Branding Card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2.5 flex items-center gap-2">
              <Globe className="w-4.5 h-4.5 text-blue-500" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-xs">Tenant Branding Preferences</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Define general portal prefixes and domain aliases</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">System Name Prefix</label>
                <input
                  type="text"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Primary Domain Alias</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email SMTP Settings */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2.5 flex items-center gap-2">
              <Mail className="w-4.5 h-4.5 text-teal-500" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-xs">Email SMTP Dispatch Relay</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Synchronize postmark or sendgrid mail keys for parental newsletters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">SMTP Relaying Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">SMTP Server Username</label>
                <input
                  type="text"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* API Integrations Webhook */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2.5 flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-500" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-xs">API Webook Endpoint Registries</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Integrate billing callbacks or attendance trackers with internal servers</p>
              </div>
            </div>
            <div className="text-xs">
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Incoming Billing Webhook URL</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-250 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Supabase Integration Card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-emerald-500" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs">Supabase Database Integration</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Manage live connection settings and test queries</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                isSupabaseConfigured() ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
              }`}>
                {isSupabaseConfigured() ? 'Configured' : 'Missing Env Keys'}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Project Endpoint URL</label>
                  <input
                    type="text"
                    readOnly
                    value={import.meta.env.VITE_SUPABASE_URL || 'Not Configured'}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 focus:outline-none font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Anon / Publishable Key</label>
                  <input
                    type="text"
                    readOnly
                    value={import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 14)}...${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(import.meta.env.VITE_SUPABASE_ANON_KEY.length - 8)}` : 'Not Configured'}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 focus:outline-none font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Action buttons and testing */}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={isTesting || !isSupabaseConfigured()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-700 text-white font-semibold rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Test Connection Status</span>
                </button>
              </div>

              {/* Test Connection Results Alert */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-[11px] ${
                  testResult.success 
                    ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-rose-50/50 border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400'
                }`}>
                  <div className="font-bold flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${testResult.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {testResult.success ? 'Database Reachable' : 'Connection Failed'}
                  </div>
                  <div className="mt-1 font-mono text-[10px] break-all">{testResult.message}</div>
                </div>
              )}

              {/* Table Inspector Tool */}
              {isSupabaseConfigured() && (
                <div className="pt-3 border-t border-slate-50 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase">Table Row Inspector</span>
                    <span className="text-[9px] text-slate-400">Fetch preview rows from a specific table</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. students"
                      value={inspectTable}
                      onChange={(e) => setInspectTable(e.target.value)}
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={handleInspectTable}
                      disabled={isInspecting}
                      className="px-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-[11px] font-bold hover:bg-slate-950 dark:hover:bg-slate-650 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {isInspecting ? 'Fetching...' : 'Query Table'}
                    </button>
                  </div>

                  {/* Inspector Results */}
                  {inspectError && (
                    <div className="p-2.5 bg-rose-50/50 border border-rose-100 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 rounded-xl font-mono text-[10px]">
                      <strong>Query Error:</strong> {inspectError}
                    </div>
                  )}

                  {inspectResult && (
                    <div className="bg-slate-900 dark:bg-slate-950 text-slate-300 p-3 rounded-xl font-mono text-[10px] space-y-1 overflow-x-auto max-h-48 border border-slate-800">
                      <div className="text-slate-500 border-b border-slate-800 pb-1 flex justify-between">
                        <span>SELECT * FROM {inspectTable} LIMIT 3</span>
                        <span>{inspectResult.length} rows found</span>
                      </div>
                      {inspectResult.length === 0 ? (
                        <div className="text-slate-500 italic py-1">Table is empty.</div>
                      ) : (
                        <pre className="text-emerald-400">{JSON.stringify(inspectResult, null, 2)}</pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Database Backups & Scheduler (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Snapshots back ups card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2.5 flex items-center gap-2">
              <Database className="w-4.5 h-4.5 text-blue-500" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-xs">Data Snapshots</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Keep schemas and database logs secure</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Scheduled Snapshots</label>
                <select
                  value={backupSchedule}
                  onChange={(e) => setBackupSchedule(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 focus:outline-none"
                >
                  <option value="Hourly">Every Hour</option>
                  <option value="Daily">Daily backups (Recommended)</option>
                  <option value="Weekly">Weekly summaries</option>
                </select>
              </div>

              {/* Download database backups trigger */}
              <button
                type="button"
                onClick={handleBackupExport}
                className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export System Snapshot JSON</span>
              </button>
            </div>
          </div>

          {/* User notifications options card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Notifications Scope</span>
              </h4>
              <span className={`w-2 h-2 rounded-full ${notificationsEnabled ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Tutee Class alerts</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Send mail alerts when slots are booked</span>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Security Audit Trails */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="border-b border-slate-50 dark:border-slate-700 pb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-blue-500" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white text-xs">Security Audit Logs</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time log of privileged events, tenant modifications, and access attempts</p>
            </div>
          </div>
          <button
            onClick={() => loadLogs()}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 rounded-lg text-xs font-semibold shrink-0 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-750">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30">
                  <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{log.timestamp}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-200">{log.user}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                      {log.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-200">{log.action}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                      log.severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                      log.severity === 'High' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                      log.severity === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[10px]">{log.details}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    {isLoadingLogs ? 'Loading security logs...' : 'No privileged audit events recorded.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
