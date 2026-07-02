/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { motion } from 'motion/react';
import { Lock, Mail, Sparkles, Building2, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLogin: (role: string, organization: string) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('mahinbhat@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<'Super Admin' | 'Mentor' | 'Student'>('Super Admin');
  const [selectedOrg, setSelectedOrg] = useState('Bright Future Academy');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin(selectedRole, selectedOrg);
    }, 800);
  };

  const handleDemoPreset = (role: 'Super Admin' | 'Mentor' | 'Student') => {
    setSelectedRole(role);
    if (role === 'Super Admin') {
      setEmail('mahinbhat@gmail.com');
      setSelectedOrg('All Organizations');
    } else if (role === 'Mentor') {
      setEmail('aadil.bhat@brightfuture.com');
      setSelectedOrg('Bright Future Academy');
    } else {
      setEmail('zoya.khan@brightfuture.com');
      setSelectedOrg('Bright Future Academy');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/60 p-6 md:p-8 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white font-bold shadow-lg mb-3">
            <Sparkles className="w-6 h-6 text-teal-100" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Student & Mentor Platform</h2>
          <p className="text-xs text-slate-400 mt-1">Enterprise Administration Portal</p>
        </div>

        {/* Presentation Role Presets (Excellent for quick testing) */}
        <div className="mb-6">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Choose Presentation Role Preset
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Super Admin', 'Mentor', 'Student'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleDemoPreset(role)}
                className={`py-2 px-1 text-[11px] font-semibold rounded-lg border transition-all ${
                  selectedRole === role
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/10'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Work Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                placeholder="you@company.com"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between items-center">
              <span>Password</span>
              <span className="text-[10px] text-blue-400 hover:underline cursor-pointer">Forgot password?</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tenant Selector (for multi-tenant simulation) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Assigned Organization</span>
            </label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            >
              <option value="All Organizations">All Tenants (Super Admin Access)</option>
              <option value="Bright Future Academy">Bright Future Academy</option>
              <option value="LearnHub Institute">LearnHub Institute</option>
              <option value="Smart Minds J&K">Smart Minds J&K</option>
              <option value="Aspire Education">Aspire Education</option>
              <option value="Valley Crest Academics">Valley Crest Academics</option>
            </select>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-xs transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Legal notice footer */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>FIPS 140-2 Encrypted Session Connection</span>
        </div>
      </motion.div>
    </div>
  );
}
