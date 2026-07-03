/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  FileSpreadsheet,
  Download,
  CheckCircle,
  HelpCircle,
  Calendar,
  Filter,
  Users,
  Compass,
  ArrowRight,
  BookOpen,
  CheckSquare,
  BarChart2,
  Lock
} from 'lucide-react';
import { CustomAreaLineChart } from '../Charts';
import { reportsAnalytics as fallbackAnalytics } from '../../data/mockData';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';
import { useAuth } from '../../lib/auth';

interface ReportsViewProps {
  selectedOrg?: string;
}

export default function ReportsView({ selectedOrg = 'All Organizations' }: ReportsViewProps) {
  const { currentUser } = useAuth();
  const [range, setRange] = useState<'30days' | 'ytd' | 'all'>('30days');
  const [showToast, setShowToast] = useState(false);
  const [studentGrowth, setStudentGrowth] = useState<any[]>(fallbackAnalytics.studentGrowth);

  useEffect(() => {
    if (!currentUser) return;
    async function loadData() {
      const orgToFilter = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
        : currentUser.organization;

      let query = supabase.from('report_student_growth').select('*');
      if (orgToFilter) {
        query = query.eq('organization', orgToFilter);
      }
      
      const { data, error } = await query.order('id', { ascending: true });
      if (!error && data) {
        setStudentGrowth(data);
      }
    }
    loadData();
  }, [currentUser, selectedOrg]);

  const handleExportData = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
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
            <span className="font-semibold font-sans">Full executive PDF report downloaded!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Executive Reports</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Track multi-tenant growth matrices, license pools, academic indices, and compliance audits</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-500" />
            <span>Export Sheets</span>
          </button>
          <button
            onClick={handleExportData}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4.5 h-4.5" />
            <span>Download Portfolio</span>
          </button>
        </div>
      </div>

      {/* Range filter selectors */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <span className="text-[10px] text-slate-400 uppercase font-black flex items-center gap-1">
          <Calendar className="w-4.5 h-4.5 text-blue-500" /> Date Horizon:
        </span>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
          {(['30days', 'ytd', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                range === r 
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {r === '30days' ? 'Last 30 Days' : r === 'ytd' ? 'Year To Date' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Growth Trend Graph (8 columns) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-700 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4.5 h-4.5 text-blue-500" />
                <span>Student Engagement & Registration Trends</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Growth progression indexed on month-to-month analytics</p>
            </div>
          </div>
          {/* Custom area engagement chart loaded */}
          <CustomAreaLineChart
            data={studentGrowth}
            xAxisKey="month"
            series={[
              { key: 'ActiveStudents', color: '#2563EB', label: 'Active Students' },
              { key: 'NewRegistrations', color: '#14B8A6', label: 'New Registrations' }
            ]}
          />
        </div>

        {/* Right Side: Cohort performance indicators (4 columns) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-700 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-teal-500" />
              <span>Multi-Tenant Performance Index</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Overall performance averages split by tenant groups</p>
          </div>

          <div className="space-y-4">
            
            {/* Index 1 */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-750/30 text-xs">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                <span>Valley Educational Trust</span>
                <span className="font-mono text-teal-600 font-extrabold">91.2%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: '91.2%' }} />
              </div>
            </div>

            {/* Index 2 */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-750/30 text-xs">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                <span>Iqbal Memorial Institute</span>
                <span className="font-mono text-blue-500 font-extrabold">86.4%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '86.4%' }} />
              </div>
            </div>

            {/* Index 3 */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-750/30 text-xs">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-bold mb-1.5">
                <span>DPS Srinagar Branch</span>
                <span className="font-mono text-indigo-600 font-extrabold">82.1%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '82.1%' }} />
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
