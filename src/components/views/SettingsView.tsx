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

export default function SettingsView() {
  const [systemName, setSystemName] = useState('EdValley Admin Core');
  const [domain, setDomain] = useState('https://portal.edvalley.com');
  const [smtpHost, setSmtpHost] = useState('smtp.postmarkapp.com');
  const [smtpUser, setSmtpUser] = useState('postmark_smtp_edvalley_main');
  const [webhookUrl, setWebhookUrl] = useState('https://api.edvalley.com/v1/webhooks/billing');

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [backupSchedule, setBackupSchedule] = useState('Daily');
  const [showToast, setShowToast] = useState(false);

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

    </div>
  );
}
