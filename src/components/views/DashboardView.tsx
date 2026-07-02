/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import {
  Users,
  GraduationCap,
  Building2,
  CalendarDays,
  Clock,
  IndianRupee,
  ClipboardList,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
  PlayCircle,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { CustomAreaLineChart, CustomBarChart } from '../Charts';
import { reportsAnalytics, sessions } from '../../data/mockData';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  selectedOrg: string;
}

export default function DashboardView({ onNavigate, selectedOrg }: DashboardViewProps) {
  // Executive Statistics Cards Data
  const stats = [
    { id: 1, label: 'Total Organizations', value: '42', change: '+8% vs prev. qtr', icon: Building2, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30', route: 'organizations' },
    { id: 2, label: 'Active Students', value: '3,482', change: '+240 this month', icon: Users, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30', route: 'students' },
    { id: 3, label: 'Active Mentors', value: '186', change: '8 on boarding', icon: GraduationCap, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30', route: 'mentors' },
    { id: 4, label: 'Sessions Today', value: '124', change: '92 Completed', icon: CalendarDays, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30', route: 'calendar' },
    { id: 5, label: 'Upcoming Sessions', value: '51', change: 'Across all batches', icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30', route: 'calendar' },
    { id: 6, label: 'Revenue This Month', value: '₹12,84,000', change: '+14% growth rate', icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30', route: 'payments' },
    { id: 7, label: 'Pending Evaluations', value: '39', change: '12 high priority', icon: ClipboardList, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30', route: 'evaluations' },
    { id: 8, label: 'Unread Messages', value: '18', change: 'From Zoya Khan, Aadil', icon: MessageSquare, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/30', route: 'messaging' }
  ];

  // Activities logs list
  const recentActivities = [
    { id: 1, user: 'Aadil Bhat', action: 'completed physics session with Zoya Khan', time: '12 mins ago', details: 'Notes, homework rubric uploaded' },
    { id: 2, user: 'Mahin Bhat', action: 'approved custom branding for Smart Minds', time: '40 mins ago', details: 'Added Srinagar J&K vector logo' },
    { id: 3, user: 'Sarah Johnson', action: 'submitted mid-term student evaluation', time: '1 hour ago', details: 'Rohan Das graded - Excellent progress' },
    { id: 4, user: 'LearnHub admin', action: 'triggered batch database backup', time: '3 hours ago', details: 'Scheduled full replication schema' }
  ];

  // Upcoming sessions today
  const todaySessions = sessions
    .filter((s) => s.status === 'Upcoming' || s.date === new Date().toISOString().split('T')[0])
    .slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-md">Live Platform</span>
            <span className="text-xs text-slate-400 font-medium">Syncing with active database</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1.5">
            Welcome back, Mahin Bhat
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Viewing metrics for <strong className="text-teal-400">{selectedOrg}</strong>. There are 3 urgent evaluation requests pending approval.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          <button
            onClick={() => onNavigate('sessions')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <PlayCircle className="w-4 h-4 text-teal-400" />
            <span>Launch Classnotes</span>
          </button>
          <button
            onClick={() => onNavigate('assignments')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Assign Mentor</span>
          </button>
        </div>
      </div>

      {/* Grid of 8 statistics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              onClick={() => onNavigate(stat.route)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.04 }}
              className="group bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 tracking-wide uppercase">
                  {stat.label}
                </span>
                <div className={`p-2 rounded-xl shrink-0 ${stat.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                  {stat.value}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span>{stat.change}</span>
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Student Growth (Area/Line) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Active Student Enrollment</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Tracking daily active and new registrations</p>
            </div>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Area Analytics
            </span>
          </div>
          <CustomAreaLineChart
            data={reportsAnalytics.studentGrowth}
            xAxisKey="month"
            series={[
              { key: 'ActiveStudents', color: '#2563EB', label: 'Active Students' },
              { key: 'NewRegistrations', color: '#14B8A6', label: 'New Registrations' }
            ]}
          />
        </div>

        {/* Mentor Productivity (Bar) */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Mentor Activity Index</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Total sessions conducted this month</p>
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
              <FileCheck2 className="w-3 h-3" /> Productivity Reports
            </span>
          </div>
          <CustomBarChart
            data={reportsAnalytics.mentorActivity}
            xAxisKey="name"
            series={[
              { key: 'Sessions', color: '#14B8A6', label: 'Completed Sessions' },
              { key: 'Hours', color: '#2563EB', label: 'Teaching Hours' }
            ]}
          />
        </div>

      </div>

      {/* Grid: Upcoming Sessions Today & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today scheduled list */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-3.5 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Upcoming Scheduled Classes</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Schedules synced with Google Workspace</p>
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todaySessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3 bg-slate-50 dark:bg-slate-750/50 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between border border-slate-100 dark:border-slate-850"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">July</span>
                    <span className="text-xs font-black text-slate-700 dark:text-white mt-0.5">{sess.date.split('-')[2] || '03'}</span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <span>{sess.student}</span>
                      <span className="text-[9px] font-medium bg-teal-500/10 text-teal-600 px-1.5 py-0.25 rounded">
                        {sess.category}
                      </span>
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Mentor: {sess.mentor} • {sess.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-blue-500 font-semibold bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md hover:underline cursor-pointer">
                    Join Meet
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-3.5 mb-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Real-time Platform Activity</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Platform updates and connection events</p>
            </div>
          </div>

          <div className="space-y-4">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex gap-3 relative group">
                <div className="relative shrink-0 flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950/40 z-10" />
                  {act.id < recentActivities.length && (
                    <div className="absolute top-2 w-0.5 h-full bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 transition-colors" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                      {act.user} <span className="font-normal text-slate-500">{act.action}</span>
                    </h5>
                    <span className="text-[9px] text-slate-400 font-mono font-medium shrink-0">{act.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 bg-slate-50 dark:bg-slate-750/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    {act.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
