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
import { reportsAnalytics as fallbackAnalytics, sessions as fallbackSessions } from '../../data/mockData';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  selectedOrg: string;
}

export default function DashboardView({ onNavigate, selectedOrg }: DashboardViewProps) {
  const { currentUser } = useAuth();
  const [counts, setCounts] = useState({
    orgs: 0,
    students: 0,
    mentors: 0,
    sessionsToday: 0,
    upcomingSessions: 0,
    revenue: 0,
    pendingEvals: 0,
    unreadMsgs: 0,
    studentsGrowthText: '0 this month',
    mentorsGrowthText: '0 onboarding',
    revenueGrowthText: '0% growth rate',
    evalsGrowthText: '0 awaiting signature'
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [todaySessions, setTodaySessions] = useState<any[]>([]);
  const [studentGrowth, setStudentGrowth] = useState<any[]>([]);
  const [mentorActivity, setMentorActivity] = useState<any[]>([]);
  const [studentMentor, setStudentMentor] = useState<any>(null);

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentUser) return;

      const orgToFilter = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
        : currentUser.organization;

      // 1. Fetch counts
      let orgQuery = supabase.from('organizations').select('*', { count: 'exact', head: true });
      if (orgToFilter) {
        orgQuery = orgQuery.eq('name', orgToFilter);
      }
      const { count: orgCount } = await orgQuery;

      let studQuery = supabase.from('students').select('*', { count: 'exact', head: true });
      if (orgToFilter) {
        studQuery = studQuery.eq('organization', orgToFilter);
      }
      if (currentUser.role === 'Mentor') {
        studQuery = studQuery.eq('mentor', currentUser.name);
      } else if (currentUser.role === 'Assistant' && currentUser.mentorName) {
        // Filter by linked mentor's students; if no mentor linked, org filter already scopes
        studQuery = studQuery.eq('mentor', currentUser.mentorName);
      } else if (currentUser.role === 'Student') {
        studQuery = studQuery.eq('email', currentUser.email);
      }
      const { count: studCount } = await studQuery;

      let mentQuery = supabase.from('mentors').select('*', { count: 'exact', head: true });
      if (orgToFilter) {
        mentQuery = mentQuery.eq('organization', orgToFilter);
      }
      if (currentUser.role === 'Mentor') {
        mentQuery = mentQuery.eq('email', currentUser.email);
      } else if (currentUser.role === 'Assistant' && currentUser.mentorName) {
        mentQuery = mentQuery.eq('name', currentUser.mentorName);
      }
      const { count: mentCount } = await mentQuery;

      const todayStr = new Date().toISOString().split('T')[0];
      
      let sessTodayQuery = supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('date', todayStr);
      let sessUpcomingQuery = supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'Upcoming');
      
      if (orgToFilter) {
        sessTodayQuery = sessTodayQuery.eq('organization', orgToFilter);
        sessUpcomingQuery = sessUpcomingQuery.eq('organization', orgToFilter);
      }
      if (currentUser.role === 'Mentor') {
        sessTodayQuery = sessTodayQuery.eq('mentor', currentUser.name);
        sessUpcomingQuery = sessUpcomingQuery.eq('mentor', currentUser.name);
      } else if (currentUser.role === 'Assistant' && currentUser.mentorName) {
        // Filter by linked mentor; if no mentor linked, org filter already scopes sessions
        sessTodayQuery = sessTodayQuery.eq('mentor', currentUser.mentorName);
        sessUpcomingQuery = sessUpcomingQuery.eq('mentor', currentUser.mentorName);
      } else if (currentUser.role === 'Student') {
        sessTodayQuery = sessTodayQuery.eq('student', currentUser.name);
        sessUpcomingQuery = sessUpcomingQuery.eq('student', currentUser.name);
      }
      const { count: sessToday } = await sessTodayQuery;
      const { count: upcomingSess } = await sessUpcomingQuery;

      let payQuery = supabase.from('payments').select('amount').eq('status', 'Paid');
      if (orgToFilter) {
        payQuery = payQuery.eq('organization', orgToFilter);
      }
      if (currentUser.role === 'Student') {
        payQuery = payQuery.eq('student', currentUser.name);
      }
      const { data: payData } = await payQuery;
      const totalRevenue = payData ? payData.reduce((sum, p) => sum + Number(p.amount), 0) : 0;

      let evalsQuery = supabase.from('evaluations').select('*', { count: 'exact', head: true }).eq('isSigned', false);
      if (orgToFilter) {
        evalsQuery = evalsQuery.eq('organization', orgToFilter);
      }
      if (currentUser.role === 'Mentor') {
        const { data: mInfo } = await supabase.from('mentors').select('studentsAssigned').eq('email', currentUser.email).maybeSingle();
        const { data: sInfo } = await supabase.from('students').select('name').eq('mentor', currentUser.name);
        
        const assignedSet = new Set<string>();
        if (mInfo?.studentsAssigned) {
          mInfo.studentsAssigned.forEach((name: string) => assignedSet.add(name));
        }
        if (sInfo) {
          sInfo.forEach((s: any) => assignedSet.add(s.name));
        }
        
        const assigned = Array.from(assignedSet);
        if (assigned.length > 0) {
          evalsQuery = evalsQuery.in('studentName', assigned);
        } else {
          evalsQuery = evalsQuery.eq('studentName', 'NONE_ASSIGNED');
        }
      } else if (currentUser.role === 'Assistant' && currentUser.mentorName) {
        const { data: mInfo } = await supabase.from('mentors').select('studentsAssigned').eq('name', currentUser.mentorName).maybeSingle();
        const { data: sInfo } = await supabase.from('students').select('name').eq('mentor', currentUser.mentorName);
        
        const assignedSet = new Set<string>();
        if (mInfo?.studentsAssigned) {
          mInfo.studentsAssigned.forEach((name: string) => assignedSet.add(name));
        }
        if (sInfo) {
          sInfo.forEach((s: any) => assignedSet.add(s.name));
        }
        
        const assigned = Array.from(assignedSet);
        if (assigned.length > 0) {
          evalsQuery = evalsQuery.in('studentName', assigned);
        } else {
          evalsQuery = evalsQuery.eq('studentName', 'NONE_ASSIGNED');
        }
      } else if (currentUser.role === 'Student') {
        evalsQuery = evalsQuery.eq('studentName', currentUser.name);
      }
      const { count: pendingEvalCount } = await evalsQuery;

      let channelsQuery = supabase.from('chat_channels').select('unreadCount');
      if (orgToFilter) {
        channelsQuery = channelsQuery.eq('organization', orgToFilter);
      }
      const { data: channels } = await channelsQuery;
      const totalUnread = channels ? channels.reduce((sum, c) => sum + (c.unreadCount || 0), 0) : 0;

      // Calculate start of current month and start of previous month
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

      // 1. Students created this month
      let studThisMonthQuery = supabase.from('students').select('*', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth);
      if (orgToFilter) {
        studThisMonthQuery = studThisMonthQuery.eq('organization', orgToFilter);
      }
      if (currentUser.role === 'Mentor') {
        studThisMonthQuery = studThisMonthQuery.eq('mentor', currentUser.name);
      } else if (currentUser.role === 'Assistant' && currentUser.mentorName) {
        // Filter by linked mentor; if no mentor linked, org filter already scopes
        studThisMonthQuery = studThisMonthQuery.eq('mentor', currentUser.mentorName);
      }
      const { count: studThisMonth } = await studThisMonthQuery;

      // 2. Mentors created this month (onboarding)
      let mentThisMonthQuery = supabase.from('mentors').select('*', { count: 'exact', head: true }).gte('created_at', startOfCurrentMonth);
      if (orgToFilter) {
        mentThisMonthQuery = mentThisMonthQuery.eq('organization', orgToFilter);
      }
      const { count: mentThisMonth } = await mentThisMonthQuery;

      // 3. Revenue calculations for current vs previous month
      let currentMonthRevenueQuery = supabase.from('payments').select('amount').eq('status', 'Paid').gte('created_at', startOfCurrentMonth);
      let prevMonthRevenueQuery = supabase.from('payments').select('amount').eq('status', 'Paid').gte('created_at', startOfPrevMonth).lt('created_at', startOfCurrentMonth);
      if (orgToFilter) {
        currentMonthRevenueQuery = currentMonthRevenueQuery.eq('organization', orgToFilter);
        prevMonthRevenueQuery = prevMonthRevenueQuery.eq('organization', orgToFilter);
      }
      const { data: curRevData } = await currentMonthRevenueQuery;
      const { data: prevRevData } = await prevMonthRevenueQuery;

      const currentRev = curRevData ? curRevData.reduce((sum, p) => sum + Number(p.amount), 0) : 0;
      const prevRev = prevRevData ? prevRevData.reduce((sum, p) => sum + Number(p.amount), 0) : 0;

      let revGrowthPercent = 0;
      if (prevRev > 0) {
        revGrowthPercent = Math.round(((currentRev - prevRev) / prevRev) * 100);
      } else if (currentRev > 0) {
        revGrowthPercent = 100;
      }

      const revGrowthSign = revGrowthPercent >= 0 ? '+' : '';

      setCounts({
        orgs: orgCount || 0,
        students: studCount || 0,
        mentors: mentCount || 0,
        sessionsToday: sessToday || 0,
        upcomingSessions: upcomingSess || 0,
        revenue: totalRevenue || 0,
        pendingEvals: pendingEvalCount || 0,
        unreadMsgs: totalUnread || 0,
        studentsGrowthText: `+${studThisMonth || 0} this month`,
        mentorsGrowthText: `${mentThisMonth || 0} onboarding`,
        revenueGrowthText: `${revGrowthSign}${revGrowthPercent}% growth rate`,
        evalsGrowthText: `${pendingEvalCount || 0} awaiting signature`
      });

      // 2. Fetch recent activities from audit logs
      let logsQuery = supabase.from('audit_logs').select('*');
      if (orgToFilter) {
        logsQuery = logsQuery.eq('organization', orgToFilter);
      }
      const { data: logs } = await logsQuery.order('created_at', { ascending: false }).limit(4);
      if (logs) {
        setRecentActivities(logs.map(l => ({
          id: l.id,
          user: l.user,
          action: l.action,
          time: 'Active',
          details: l.details
        })));
      }

      // 3. Fetch today's upcoming sessions
      let upcomingSessQuery = supabase.from('sessions').select('*');
      if (orgToFilter) {
        upcomingSessQuery = upcomingSessQuery.eq('organization', orgToFilter);
      }
      if (currentUser.role === 'Mentor') {
        upcomingSessQuery = upcomingSessQuery.eq('mentor', currentUser.name);
      } else if (currentUser.role === 'Assistant' && currentUser.mentorName) {
        // Filter by linked mentor; if no mentor linked, org filter already scopes sessions
        upcomingSessQuery = upcomingSessQuery.eq('mentor', currentUser.mentorName);
      } else if (currentUser.role === 'Student') {
        upcomingSessQuery = upcomingSessQuery.eq('student', currentUser.name);
      }
      const { data: todaySess } = await upcomingSessQuery.order('date', { ascending: false }).limit(4);
      if (todaySess) {
        setTodaySessions(todaySess);
      }

      // 4. Fetch reports analytics
      let sgQuery = supabase.from('report_student_growth').select('*');
      if (orgToFilter) {
        sgQuery = sgQuery.eq('organization', orgToFilter);
      }
      const { data: sg } = await sgQuery.order('id');
      if (sg) setStudentGrowth(sg);

      let maQuery = supabase.from('report_mentor_activity').select('*');
      if (orgToFilter) {
        maQuery = maQuery.eq('organization', orgToFilter);
      }
      const { data: ma } = await maQuery.order('id');
      if (ma) setMentorActivity(ma);

      // 5. Fetch student mentor details if student
      if (currentUser.role === 'Student') {
        const { data: studentProfile } = await supabase
          .from('students')
          .select('mentor')
          .eq('email', currentUser.email)
          .maybeSingle();
        if (studentProfile && studentProfile.mentor) {
          const { data: mentorRec } = await supabase
            .from('mentors')
            .select('*')
            .eq('name', studentProfile.mentor)
            .maybeSingle();
          if (mentorRec) {
            setStudentMentor(mentorRec);
          }
        }
      }
    }

    loadDashboardData();
  }, [selectedOrg, currentUser]);

  // Executive Statistics Cards Data
  const stats = [
    { id: 1, label: 'Total Organizations', value: String(counts.orgs), change: `${counts.orgs} active`, icon: Building2, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30', route: 'organizations', permission: () => currentUser?.role === 'Super Admin' },
    { id: 2, label: currentUser?.role === 'Mentor' || currentUser?.role === 'Assistant' ? 'My Students' : 'Active Students', value: counts.students.toLocaleString(), change: counts.studentsGrowthText, icon: Users, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/30', route: 'students', permission: () => currentUser?.role !== 'Student' },
    { id: 3, label: 'Active Mentors', value: String(counts.mentors), change: counts.mentorsGrowthText, icon: GraduationCap, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30', route: 'mentors', permission: () => currentUser?.role === 'Super Admin' || currentUser?.role === 'Organization Admin' },
    { id: 4, label: 'Sessions Today', value: String(counts.sessionsToday), change: 'Syncing live', icon: CalendarDays, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30', route: 'calendar' },
    { id: 5, label: 'Upcoming Sessions', value: String(counts.upcomingSessions), change: 'Across all batches', icon: Clock, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30', route: 'calendar' },
    { id: 6, label: 'Revenue This Month', value: `₹${counts.revenue.toLocaleString()}`, change: counts.revenueGrowthText, icon: IndianRupee, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30', route: 'payments', permission: () => currentUser?.role === 'Super Admin' || currentUser?.role === 'Organization Admin' },
    { id: 7, label: 'Pending Evaluations', value: String(counts.pendingEvals), change: counts.evalsGrowthText, icon: ClipboardList, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30', route: 'evaluations', permission: () => currentUser?.role !== 'Student' && currentUser?.role !== 'Assistant' },
    { id: 8, label: 'Unread Messages', value: String(counts.unreadMsgs), change: 'From channels', icon: MessageSquare, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/30', route: 'messaging' }
  ].filter(stat => !stat.permission || stat.permission());

  // Render unique layout if current user is Student
  if (currentUser?.role === 'Student') {
    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-800 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-md">Student Dashboard</span>
              <span className="text-xs text-slate-400 font-medium">Syncing with learning node</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-1.5 font-sans">
              Welcome back, {currentUser.name}
            </h1>
            <p className="text-xs text-slate-350 mt-1">
              Your assigned mentor is <strong className="text-teal-400">{studentMentor?.name || 'Awaiting Allocation'}</strong>. Check your calendar for upcoming tutoring sessions.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 relative z-10">
            <button
              onClick={() => onNavigate('calendar')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-750 transition-colors cursor-pointer"
            >
              <CalendarDays className="w-4 h-4 text-teal-400" />
              <span>Schedules & Bookings</span>
            </button>
            <button
              onClick={() => onNavigate('messaging')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message Tutors</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Assigned Mentor */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 tracking-wide uppercase">Assigned Mentor</span>
              <div className="p-2 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white truncate leading-tight">
                {studentMentor?.name || 'Awaiting Allocation'}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1 truncate">
                {studentMentor?.subjects?.slice(0, 2).join(', ') || 'General Studies'}
              </p>
            </div>
          </div>

          {/* Stat 2: Upcoming Sessions */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 tracking-wide uppercase">Upcoming Sessions</span>
              <div className="p-2 rounded-xl text-amber-500 bg-amber-50 dark:bg-amber-950/30">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                {counts.upcomingSessions}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Synced with Google Calendar
              </p>
            </div>
          </div>

          {/* Stat 3: Sessions Today */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 tracking-wide uppercase">Classes Today</span>
              <div className="p-2 rounded-xl text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30">
                <CalendarDays className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                {counts.sessionsToday}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                Scheduled slots for today
              </p>
            </div>
          </div>

          {/* Stat 4: Invoice Transactions */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('payments')}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 tracking-wide uppercase">Payment History</span>
              <div className="p-2 rounded-xl text-teal-600 bg-teal-50 dark:bg-teal-950/30">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                ₹{counts.revenue.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1 flex items-center gap-0.5">
                <span>View bills & history</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </p>
            </div>
          </div>
        </div>

        {/* Student Content Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Today's scheduled sessions (7 columns) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 pb-3.5 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">My Upcoming Tuition Classes</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Synchronized learning and revision sessions</p>
              </div>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-[10px] font-semibold text-teal-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Full Calendar View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {todaySessions.length > 0 ? (
                todaySessions.map((sess) => (
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
                          <span>{sess.category} Session</span>
                          <span className="text-[9px] font-medium bg-teal-500/10 text-teal-600 px-1.5 py-0.25 rounded">
                            {sess.duration}
                          </span>
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Mentor: {sess.mentor} • {sess.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <a
                        href={sess.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-500 font-semibold bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md hover:underline cursor-pointer inline-block"
                      >
                        Join Meet
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
                  No upcoming classes scheduled. Contact your administrator or mentor to schedule one.
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Mentor Details Card (5 columns) */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="border-b border-slate-50 dark:border-slate-700/50 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Assigned Mentor Faculty</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Primary mentor assigned for active tracking</p>
            </div>

            {studentMentor ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-750/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {studentMentor.avatar ? (
                    <img
                      src={studentMentor.avatar}
                      alt={studentMentor.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 font-extrabold text-base select-none shrink-0 ring-2 ring-slate-100 dark:ring-slate-800">
                      {studentMentor.name.trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">{studentMentor.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{studentMentor.email}</p>
                    <span className="text-[9px] font-semibold text-teal-600 bg-teal-500/10 px-1.5 py-0.25 rounded-md inline-block mt-1">
                      {studentMentor.experience} Experience
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/55">
                    <span className="text-slate-400">Tuition Specialities</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{studentMentor.subjects.join(', ')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/55">
                    <span className="text-slate-400">Tutor Rating</span>
                    <span className="font-semibold text-yellow-500 font-mono">★ {studentMentor.rating}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/55">
                    <span className="text-slate-400">Weekly Availability</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{studentMentor.availability}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('messaging')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Initiate Chat Session
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500">
                Mentor details not synced. Contact your organization administrator.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render default dashboard layout for Admins / Mentors / Assistants
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
            Welcome back, {currentUser?.name || 'User'}
          </h1>
          <p className="text-xs text-slate-350 mt-1">
            Viewing metrics for <strong className="text-teal-400">{currentUser?.role === 'Super Admin' ? selectedOrg : currentUser?.organization}</strong>.
            {counts.pendingEvals > 0 && currentUser?.role !== 'Assistant' && ` There are ${counts.pendingEvals} urgent evaluation requests pending approval.`}
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
          {currentUser?.role === 'Super Admin' || currentUser?.role === 'Organization Admin' ? (
            <button
              onClick={() => onNavigate('assignments')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Mentor</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Grid of statistics cards */}
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

      {/* Charts Section - Visible only to Super Admin / Org Admin */}
      {(currentUser?.role === 'Super Admin' || currentUser?.role === 'Organization Admin') && (
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
              data={studentGrowth}
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
              data={mentorActivity}
              xAxisKey="name"
              series={[
                { key: 'Sessions', color: '#14B8A6', label: 'Completed Sessions' },
                { key: 'Hours', color: '#2563EB', label: 'Teaching Hours' }
              ]}
            />
          </div>

        </div>
      )}

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
            {todaySessions.length > 0 ? (
              todaySessions.map((sess) => (
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
                    <a
                      href={sess.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-blue-500 font-semibold bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md hover:underline cursor-pointer"
                    >
                      Join Meet
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No classes scheduled for today.
              </div>
            )}
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
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
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
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No recent activity logged.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
