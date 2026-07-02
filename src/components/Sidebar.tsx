/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  Link2,
  Calendar,
  FileSpreadsheet,
  LineChart,
  BookOpen,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  ClipboardList,
  Settings,
  UserCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onLogout
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'organizations', label: 'Organizations', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'mentors', label: 'Mentors', icon: GraduationCap },
    { id: 'students', label: 'Students', icon: GraduationCap, badge: '52' },
    { id: 'assignments', label: 'Assignments', icon: Link2, isFeature: true },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'sessions', label: 'Session Notes', icon: FileSpreadsheet },
    { id: 'evaluations', label: 'Evaluations', icon: ClipboardList },
    { id: 'library', label: 'Content Library', icon: BookOpen },
    { id: 'messaging', label: 'Messaging', icon: MessageSquare, badge: '3' },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: LineChart },
    { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-r border-slate-150 dark:border-slate-800 transition-colors">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white font-bold shadow-md shadow-blue-900/20">
            <Sparkles className="w-5 h-5 text-teal-100" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col select-none"
            >
              <span className="font-bold text-slate-800 dark:text-white text-sm tracking-tight leading-none">EduPortal</span>
              <span className="text-[10px] text-teal-500 dark:text-teal-400 font-semibold uppercase tracking-wider mt-0.5">Enterprise Admin</span>
            </motion.div>
          )}
        </div>

        {/* Toggle Collapse on Desktop */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center w-6 h-6 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileOpen(false);
              }}
              className={`flex items-center w-full rounded-xl transition-all duration-150 py-2.5 px-3 relative group cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/10'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 w-1.5 h-1/2 bg-teal-400 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              
              <Icon className={`w-5 h-5 transition-transform shrink-0 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />

              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-3 text-xs tracking-wide text-left truncate flex-1"
                >
                  {item.label}
                </motion.span>
              )}

              {/* Badges */}
              {item.badge && !collapsed && (
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-300">
                  {item.badge}
                </span>
              )}

              {/* Quick tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 dark:bg-slate-950 text-white text-[10px] font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-md">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer Account Info */}
      <div className="p-3 border-t border-slate-150 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20">
        <div className="flex items-center gap-3 overflow-hidden rounded-xl p-1.5">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
            alt="Admin"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-150 dark:ring-slate-850"
          />
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 min-w-0"
            >
              <h5 className="text-xs font-semibold text-slate-800 dark:text-white truncate">Mahin Bhat</h5>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono">mahin@eg.com</p>
            </motion.div>
          )}
          
          {!collapsed && (
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors shrink-0 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar container */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-30 shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 z-50 md:hidden transition-transform duration-300 transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
