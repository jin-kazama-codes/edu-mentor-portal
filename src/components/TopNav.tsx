/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  Sun,
  Moon,
  Sparkles,
  Command,
  User,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Zap,
  CheckCircle,
  PlusCircle,
  Building,
  Lock
} from 'lucide-react';
import { organizations as fallbackOrgs } from '../data/mockData';
import { Organization } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setMobileOpen: (open: boolean) => void;
  selectedOrg: string;
  setSelectedOrg: (org: string) => void;
  onLogout: () => void;
  onQuickAction: (actionType: string) => void;
}

export default function TopNav({
  activeTab,
  setActiveTab,
  setMobileOpen,
  selectedOrg,
  setSelectedOrg,
  onLogout,
  onQuickAction
}: TopNavProps) {
  const { currentUser, hasPermission } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [avatarError, setAvatarError] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [orgsList, setOrgsList] = useState<Organization[]>(fallbackOrgs);

  const canCreateSession = hasPermission('Session Scheduling', 'create');
  const canAssignMentor = hasPermission('Mentor Assignments', 'create') || hasPermission('Mentor Assignments', 'assign');
  const canAddStudent = hasPermission('User and Role Management', 'create');
  const showQuickActions = canCreateSession || canAssignMentor || canAddStudent;

  useEffect(() => {
    async function loadOrgs() {
      const { data, error } = await supabase.from('organizations').select('*').order('name');
      if (!error && data) {
        setOrgsList(data);
      }
    }
    loadOrgs();
  }, []);

  // Initialize and listen to theme changes
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme as 'light' | 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastReadTime, setLastReadTime] = useState<string>(
    () => localStorage.getItem('last_read_notifications_time') || new Date(0).toISOString()
  );

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  useEffect(() => {
    if (!currentUser) return;

    async function fetchNotifications() {
      const orgFilter = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
        : currentUser.organization;

      let studentName = currentUser.name;
      let assignedMentorName = '';
      if (currentUser.role === 'Student') {
        try {
          const { data: studentProfile } = await supabase
            .from('students')
            .select('name, mentor')
            .eq('email', currentUser.email)
            .maybeSingle();
          if (studentProfile) {
            if (studentProfile.name) studentName = studentProfile.name;
            if (studentProfile.mentor) assignedMentorName = studentProfile.mentor;
          }
        } catch (e) {
          console.error('Error fetching student profile for notifications:', e);
        }
      }

      // Helper function to format title with organization for Super Admins
      const formatTitle = (baseTitle: string, orgName: string) => {
        if (currentUser.role === 'Super Admin') {
          return `${baseTitle} [${orgName}]`;
        }
        return baseTitle;
      };

      // 1. Fetch pending evaluations
      let evalsQuery = supabase.from('evaluations').select('*').order('created_at', { ascending: false }).limit(20);
      if (currentUser.role === 'Super Admin') {
        if (orgFilter) evalsQuery = evalsQuery.eq('organization', orgFilter);
      } else if (currentUser.role === 'Organization Admin' || currentUser.role === 'Assistant') {
        evalsQuery = evalsQuery.eq('organization', currentUser.organization);
      } else if (currentUser.role === 'Student') {
        evalsQuery = evalsQuery.eq('studentName', studentName);
      }
      const { data: evals } = await evalsQuery;

      // 2. Fetch payments
      let paysQuery = supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(20);
      if (currentUser.role === 'Super Admin') {
        if (orgFilter) paysQuery = paysQuery.eq('organization', orgFilter);
      } else if (currentUser.role === 'Organization Admin' || currentUser.role === 'Assistant') {
        paysQuery = paysQuery.eq('organization', currentUser.organization);
      } else if (currentUser.role === 'Student') {
        paysQuery = paysQuery.eq('student', studentName);
      }
      const { data: payments } = await paysQuery;

      // 3. Fetch sessions
      let sessQuery = supabase.from('sessions').select('*').order('created_at', { ascending: false }).limit(20);
      if (currentUser.role === 'Super Admin') {
        if (orgFilter) sessQuery = sessQuery.eq('organization', orgFilter);
      } else if (currentUser.role === 'Organization Admin' || currentUser.role === 'Assistant') {
        sessQuery = sessQuery.eq('organization', currentUser.organization);
      } else if (currentUser.role === 'Student') {
        // Students should see notifications from their mentor and themselves (i.e. their own sessions)
        sessQuery = sessQuery.eq('student', studentName).eq('mentor', assignedMentorName);
      }
      const { data: sessions } = await sessQuery;

      // 4. Fetch new users
      let usersQuery = supabase.from('users').select('*').order('created_at', { ascending: false }).limit(30);
      if (currentUser.role === 'Super Admin' && orgFilter) {
        usersQuery = usersQuery.eq('organization', orgFilter);
      }
      const { data: users } = await usersQuery;

      const combined: any[] = [];

      if (evals) {
        evals.forEach((item) => {
          const isOwn = currentUser.role === 'Student';
          combined.push({
            id: `eval-${item.id}`,
            title: formatTitle(isOwn ? 'Evaluation Updated' : 'Evaluation Pending', item.organization),
            body: isOwn
              ? `Your Chemistry evaluation is ready for your review.`
              : `${item.studentName}'s Chemistry evaluation is ready for approval.`,
            time: getRelativeTime(item.created_at),
            timestamp: item.created_at,
            read: new Date(item.created_at) <= new Date(lastReadTime)
          });
        });
      }

      if (payments) {
        payments.forEach((item) => {
          const isOwn = currentUser.role === 'Student';
          combined.push({
            id: `pay-${item.id}`,
            title: formatTitle('Payment Success', item.organization),
            body: isOwn
              ? `Your payment for ${item.plan} invoice of $${item.amount} was successful.`
              : `${item.student} paid ${item.plan} invoice of $${item.amount}.`,
            time: getRelativeTime(item.created_at),
            timestamp: item.created_at,
            read: new Date(item.created_at) <= new Date(lastReadTime)
          });
        });
      }

      if (sessions) {
        sessions.forEach((item) => {
          const isOwn = currentUser.role === 'Student';
          combined.push({
            id: `sess-${item.id}`,
            title: formatTitle('Session Booked', item.organization),
            body: isOwn
              ? `Your session with ${item.mentor} is scheduled on ${item.date}.`
              : `${item.mentor} scheduled a session with ${item.student} on ${item.date}.`,
            time: getRelativeTime(item.created_at),
            timestamp: item.created_at,
            read: new Date(item.created_at) <= new Date(lastReadTime)
          });
        });
      }

      if (users) {
        users.forEach((item) => {
          if (item.email.toLowerCase() === currentUser.email.toLowerCase()) return;

          // Apply Custom Role Visibility Filter in memory
          let show = false;
          if (currentUser.role === 'Super Admin') {
            show = true;
          } else if (currentUser.role === 'Organization Admin') {
            // Can see all notifications from: Super Admin, Mentors of their organization, Assistants of their organization, Students of their organization.
            show = item.role === 'Super Admin' || (item.organization === currentUser.organization && ['Mentor', 'Assistant', 'Student'].includes(item.role));
          } else if (currentUser.role === 'Assistant') {
            // Can see notifications from: Mentors and Students of their organization
            show = item.organization === currentUser.organization && ['Mentor', 'Student'].includes(item.role);
          } else if (currentUser.role === 'Student') {
            // Can see notifications from: their mentor and Assistant of their organization
            show = (item.role === 'Assistant' && item.organization === currentUser.organization) || (item.role === 'Mentor' && item.name === assignedMentorName);
          }

          if (!show) return;

          combined.push({
            id: `usr-${item.id}`,
            title: formatTitle('New User Registered', item.organization),
            body: `${item.name} (${item.role}) joined the organization.`,
            time: getRelativeTime(item.created_at),
            timestamp: item.created_at,
            read: new Date(item.created_at) <= new Date(lastReadTime)
          });
        });
      }

      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setNotifications(combined.slice(0, 6));
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [currentUser, selectedOrg, lastReadTime]);

  const handleMarkAllAsRead = () => {
    const nowStr = new Date().toISOString();
    localStorage.setItem('last_read_notifications_time', nowStr);
    setLastReadTime(nowStr);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 transition-colors">

      {/* Mobile Menu & Org Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Multi-Tenant Org Switcher */}
        <div className="relative">
          <button
            onClick={() => currentUser?.role === 'Super Admin' && setOrgDropdownOpen(!orgDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-left select-none ${currentUser?.role !== 'Super Admin' ? 'cursor-default pointer-events-none' : 'cursor-pointer'
              }`}
          >
            <Building className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-[160px]">{selectedOrg}</span>
            {currentUser?.role === 'Super Admin' ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            )}
          </button>

          <AnimatePresence>
            {orgDropdownOpen && currentUser?.role === 'Super Admin' && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setOrgDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 mt-1.5 w-60 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl z-40 py-1"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-50 dark:border-slate-700">
                    Switch Tenants
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOrg('All Organizations');
                      setOrgDropdownOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs text-left ${selectedOrg === 'All Organizations'
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <span className="truncate font-semibold">All Organizations</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-905 font-medium text-blue-600 dark:text-blue-400 shrink-0">
                      Cross-Org
                    </span>
                  </button>
                  {orgsList.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => {
                        setSelectedOrg(org.name);
                        setOrgDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 text-xs text-left ${selectedOrg === org.name
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                        }`}
                    >
                      <span className="truncate">{org.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-medium text-slate-500 dark:text-slate-400 shrink-0">
                        {org.plan}
                      </span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search Input (Global Search simulation) */}
      <div className="hidden sm:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search students, mentors, sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
            <kbd className="hidden md:inline-flex items-center gap-0.5 h-5 select-none pointer-events-none px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[9px] font-mono font-medium text-slate-400">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </div>

          {/* Interactive Search Results Card */}
          <AnimatePresence>
            {searchFocused && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="absolute left-0 right-0 mt-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl z-50 p-2 text-xs"
              >
                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1 mb-1 border-b border-slate-50 dark:border-slate-700">
                  {searchQuery ? 'Search Suggestions' : 'Recent Searches'}
                </div>
                {searchQuery ? (
                  <div className="space-y-1">
                    <button
                      onClick={() => { setActiveTab('students'); setSearchQuery(''); }}
                      className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition-colors text-left"
                    >
                      <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <div className="font-medium">Students matching "<span className="text-blue-500 font-bold">{searchQuery}</span>"</div>
                        <div className="text-[10px] text-slate-400">View in Students List</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { setActiveTab('mentors'); setSearchQuery(''); }}
                      className="flex items-center gap-2.5 w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 transition-colors text-left"
                    >
                      <Sparkles className="w-4 h-4 text-teal-500 shrink-0" />
                      <div>
                        <div className="font-medium">Mentors matching "<span className="text-blue-500 font-bold">{searchQuery}</span>"</div>
                        <div className="text-[10px] text-slate-400">View in Mentors List</div>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => { setActiveTab('students'); }}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-left"
                    >
                      <span>Zoya Khan <span className="text-slate-400">(Student)</span></span>
                      <span className="text-[9px] text-slate-400 font-mono">11th Grade</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('mentors'); }}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-left"
                    >
                      <span>Aadil Bhat <span className="text-slate-400">(Mentor)</span></span>
                      <span className="text-[9px] text-slate-400 font-mono">Physics</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('sessions'); }}
                      className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-left"
                    >
                      <span>Calculus Derivatives Lesson</span>
                      <span className="text-[9px] text-slate-400 font-mono">Completed</span>
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Side Icons & Actions */}
      <div className="flex items-center gap-3">


        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Notifications Icon with unread badge */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-1.5 w-76 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl z-40 p-2 text-xs"
                >
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-50 dark:border-slate-700 mb-2">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Notifications</span>
                    <span
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] text-blue-500 cursor-pointer font-medium hover:underline"
                    >
                      Mark all as read
                    </span>
                  </div>
                  <div className="space-y-1 max-h-[260px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-[11px]">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-2 rounded-lg transition-colors ${notif.read ? 'hover:bg-slate-50 dark:hover:bg-slate-700/30' : 'bg-slate-50 dark:bg-slate-700/40 border-l-2 border-blue-500'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{notif.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{notif.time}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">{notif.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-1.5 focus:outline-none select-none"
          >
            {currentUser?.avatar && !avatarError ? (
              <img
                src={currentUser.avatar}
                alt={currentUser?.role || 'User'}
                referrerPolicy="no-referrer"
                onError={() => setAvatarError(true)}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs select-none ring-2 ring-slate-100 dark:ring-slate-800 shrink-0">
                {currentUser?.name?.trim().charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl z-40 py-1 text-xs"
                >
                  <div className="px-3.5 py-2.5 border-b border-slate-50 dark:border-slate-700 flex flex-col">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{currentUser?.name || 'Loading user...'}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{currentUser?.email || ''}</span>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); setActiveTab('profile'); }}
                    className="flex items-center gap-2 w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-left"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); setActiveTab('settings'); }}
                    className="flex items-center gap-2 w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-left"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-400" />
                    <span>System Settings</span>
                  </button>
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 w-full px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-left"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Documentation</span>
                  </button>
                  <div className="h-px bg-slate-50 dark:bg-slate-700 my-1" />
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="flex items-center gap-2 w-full px-3.5 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
