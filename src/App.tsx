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
import StudentsView from './components/views/StudentsView';
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Default to true so client presentation starts instantly on the dashboard!
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [selectedOrg, setSelectedOrg] = useState<string>('Valley Educational Trust');
  const [quickActionTrigger, setQuickActionTrigger] = useState<{ action: string; timestamp: number } | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setQuickActionTrigger(null);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleLoginSuccess = (role: string, organization: string) => {
    setSelectedOrg(organization);
    setIsAuthenticated(true);
    handleTabChange('dashboard');
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
        return <MentorsView />;
      case 'students':
        return <StudentsView defaultAddOpen={quickActionTrigger?.action === 'add_student'} />;
      case 'assignment':
      case 'assignments':
        return <AssignmentView />;
      case 'calendar':
        return <CalendarView defaultBookOpen={quickActionTrigger?.action === 'create_session'} />;
      case 'sessions':
        return <SessionsView />;
      case 'evaluations':
        return <EvaluationsView />;
      case 'library':
        return <ContentLibraryView />;
      case 'messaging':
        return <MessagingView />;
      case 'payments':
        return <PaymentsView />;
      case 'reports':
        return <ReportsView />;
      case 'permissions':
        return <PermissionsView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} selectedOrg={selectedOrg} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <LoginView onLogin={handleLoginSuccess} />
      </div>
    );
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
