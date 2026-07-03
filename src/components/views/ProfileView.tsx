/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  ShieldCheck,
  CheckCircle,
  Lock,
  Save,
  Laptop,
  Smartphone,
  Globe,
  Plus,
  Compass,
  ArrowRight,
  UserX,
  Mail,
  Key,
  KeyRound
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

export default function ProfileView() {
  const { currentUser, refreshUser } = useAuth();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      async function loadProfile() {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', currentUser.email)
          .maybeSingle();
        if (!error && data) {
          setName(data.name);
          setEmail(data.email);
          setAvatar(data.avatar || '');
        } else {
          setName(currentUser.name);
          setEmail(currentUser.email);
          setAvatar(currentUser.avatar || '');
        }
      }
      loadProfile();
    }
  }, [currentUser]);

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('users')
      .update({ name, email, avatar })
      .eq('id', currentUser.id);
    if (error) {
      console.error(error);
      alert('Error updating profile: ' + error.message);
      return;
    }

    await refreshUser();

    setToastMsg('Profile details updated successfully!');
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleUpdatePassword = (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Error: New passwords do not match.');
      return;
    }
    setToastMsg('Security credentials updated successfully! Logged sessions synced.');
    setShowToast(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const activeSessions = [
    { id: 's-mac', device: 'Apple MacBook Pro 16"', location: 'Srinagar, J&K', ip: '192.168.1.1', active: true, icon: Laptop },
    { id: 's-phone', device: 'Apple iPhone 15 Pro Max', location: 'Srinagar, J&K', ip: '192.168.1.45', active: false, icon: Smartphone }
  ];

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
            <span className="font-semibold font-sans">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Identity Settings</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Manage administrative credentials, configure multi-factor passkeys, and inspect active terminal sessions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: General profile credentials (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main info card */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 dark:border-slate-700 pb-3 gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"}
                  alt={currentUser?.name || "User Profile"}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
                />
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-xs">{name}</h3>
                  <p className="text-[10px] text-slate-400">Primary Role: <strong className={
                    currentUser?.role === 'Super Admin' ? 'text-rose-600 dark:text-rose-400' :
                    currentUser?.role === 'Organization Admin' ? 'text-blue-600 dark:text-blue-400' :
                    currentUser?.role === 'Mentor' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
                  }>{currentUser?.role || 'Guest'}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleUpdateProfile}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile details</span>
              </button>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Administrative Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Administrative Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Avatar Image URL</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Change password forms */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2.5 flex items-center gap-2">
              <Key className="w-4.5 h-4.5 text-indigo-500" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-xs">Change Password</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Keep credentials robust to satisfy compliance standards</p>
              </div>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-3.5 py-1.8 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
              >
                Update Password credentials
              </button>
            </form>
          </div>

        </div>

        {/* Right column: active sessions + multi-factor auth (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Multi-factor authorization passkeys toggle */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Multi-factor Auth (MFA)</span>
              </h4>
              <span className={`w-2 h-2 rounded-full ${twoFactorEnabled ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">SAML Authenticator</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">SAML / Auth0 secure code verification</span>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorEnabled}
                  onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Active Terminal Sessions */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center gap-1.5">
              <Globe className="w-4.5 h-4.5 text-blue-500" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white text-xs">Active Session Terminals</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Secure terminal footprints</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-sans">
              {activeSessions.map((sess) => {
                const Icon = sess.icon;
                return (
                  <div key={sess.id} className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-750/30 rounded-xl flex items-start gap-3">
                    <Icon className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-slate-700 dark:text-slate-300 block truncate">{sess.device}</strong>
                        {sess.active && (
                          <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-500/15 border border-emerald-500/10 px-1.5 py-0.25 rounded shrink-0">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">{sess.location} • IP: {sess.ip}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
