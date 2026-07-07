/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Sidebar & Global Bars
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';

// Views
import LoginView from './components/views/LoginView';
import DashboardView from './components/views/DashboardView';
import OrganizationsView from './components/views/OrganizationsView';
import UsersView from './components/views/UsersView';
import MentorsView from './components/views/MentorsView';
import AssistantsView from './components/views/AssistantsView';
import StudentsView from './components/views/StudentsView';
import AttendanceView from './components/views/AttendanceView';
import AssignmentView from './components/views/AssignmentView';
import CalendarView from './components/views/CalendarView';
import SessionsView from './components/views/SessionsView';
import EvaluationsView from './components/views/EvaluationsView';
import ContentLibraryView from './components/views/ContentLibraryView';
import MessagingView from './components/views/MessagingView';
import PaymentsView from './components/views/PaymentsView';
import ReportsView from './components/views/ReportsView';
import PermissionsView from './components/views/PermissionsView';
import SettingsView from './components/views/SettingsView';
import ProfileView from './components/views/ProfileView';
import { AuthProvider, useAuth } from './lib/auth';

function MainApp() {
  const { currentUser, loading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('activeTab') || 'dashboard';
  });
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [selectedOrg, setSelectedOrg] = useState<string>('All Organizations');
  const [quickActionTrigger, setQuickActionTrigger] = useState<{ action: string; timestamp: number } | null>(null);
  const [preselectedStudent, setPreselectedStudent] = useState<string | null>(null);

  // Dynamic organization mapping based on logged-in user context
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role !== 'Super Admin') {
        setSelectedOrg(currentUser.organization);
      } else if (!selectedOrg || selectedOrg === 'Bright Future Academy') {
        setSelectedOrg('All Organizations');
      }
    }
  }, [currentUser, selectedOrg]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('activeTab', tab);
    setQuickActionTrigger(null);
  };

  const handleLogout = async () => {
    localStorage.removeItem('activeTab');
    await logout();
  };

  const handleLoginSuccess = async (email: string, role: string, organization: string, passwordInput: string) => {
    const success = await login(email, role as any, organization, passwordInput);
    if (success) {
      handleTabChange('dashboard');
    }
  };

  // Render current view
  const renderViewContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => handleTabChange(tab)} selectedOrg={selectedOrg} />;
      case 'organizations':
        return <OrganizationsView />;
      case 'users':
        return <UsersView />;
      case 'mentors':
        return <MentorsView selectedOrg={selectedOrg} />;
      case 'assistants':
        return <AssistantsView selectedOrg={selectedOrg} />;
      case 'students':
        return (
          <StudentsView
            defaultAddOpen={quickActionTrigger?.action === 'add_student'}
            selectedOrg={selectedOrg}
            onNavigate={(tab) => handleTabChange(tab)}
            onEvaluate={(studentName) => {
              setPreselectedStudent(studentName);
              handleTabChange('evaluations');
            }}
          />
        );
      case 'attendance':
        return <AttendanceView selectedOrg={selectedOrg} />;
      case 'assignment':
      case 'assignments':
        return <AssignmentView selectedOrg={selectedOrg} />;
      case 'calendar':
        return <CalendarView defaultBookOpen={quickActionTrigger?.action === 'create_session'} selectedOrg={selectedOrg} />;
      case 'sessions':
        return <SessionsView selectedOrg={selectedOrg} />;
      case 'evaluations':
        return (
          <EvaluationsView
            selectedOrg={selectedOrg}
            preselectedStudent={preselectedStudent}
            clearPreselected={() => setPreselectedStudent(null)}
          />
        );
      case 'library':
        return <ContentLibraryView selectedOrg={selectedOrg} />;
      case 'messaging':
        return <MessagingView selectedOrg={selectedOrg} />;
      case 'payments':
        return <PaymentsView selectedOrg={selectedOrg} />;
      case 'reports':
        return <ReportsView selectedOrg={selectedOrg} />;
      case 'permissions':
        return <PermissionsView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView onNavigate={(tab) => handleTabChange(tab)} selectedOrg={selectedOrg} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-xs text-slate-400">Enforcing database RLS filters...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">

      {/* Collapsible desktop Sidebar + drawer mobile */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* Top Navbar */}
        <TopNav
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          setMobileOpen={setMobileOpen}
          selectedOrg={selectedOrg}
          setSelectedOrg={setSelectedOrg}
          onLogout={handleLogout}
          onQuickAction={(action) => {
            if (action === 'settings') handleTabChange('settings');
            if (action === 'profile') handleTabChange('profile');
            if (action === 'assign_mentor') handleTabChange('assignments');
            if (action === 'create_session') {
              setQuickActionTrigger({ action: 'create_session', timestamp: Date.now() });
              setActiveTab('calendar');
            }
            if (action === 'add_student') {
              setQuickActionTrigger({ action: 'add_student', timestamp: Date.now() });
              setActiveTab('students');
            }
          }}
        />

        {/* Content canvas with subtle fade entrance animation */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderViewContent()}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
