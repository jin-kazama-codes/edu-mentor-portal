/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Building2,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Plus,
  Trash2,
  Edit,
  ArrowUpRight,
  ExternalLink,
  Ban,
  CheckCircle,
  MoreVertical,
  X,
  Users,
  Award,
  Percent
} from 'lucide-react';
import { organizations as fallbackOrgs } from '../../data/mockData';
import { Organization } from '../../types';
import { supabase } from '../../lib/supabase';
import { useEffect } from 'react';

export default function OrganizationsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [data, setData] = useState<Organization[]>([]);

  const [actualStudentCount, setActualStudentCount] = useState(0);
  const [studentCountsMap, setStudentCountsMap] = useState<Record<string, number>>({});
  const [mentorCountsMap, setMentorCountsMap] = useState<Record<string, number>>({});
  const [userCountsMap, setUserCountsMap] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadData() {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      if (!error && orgs) {
        setData(orgs);
      }

      // Fetch actual counts
      const { data: studentsData } = await supabase.from('students').select('organization');
      const { data: mentorsData } = await supabase.from('mentors').select('organization');
      const { data: usersData } = await supabase.from('users').select('organization');

      const sMap: Record<string, number> = {};
      studentsData?.forEach((s) => {
        sMap[s.organization] = (sMap[s.organization] || 0) + 1;
      });
      setStudentCountsMap(sMap);
      setActualStudentCount(studentsData?.length || 0);

      const mMap: Record<string, number> = {};
      mentorsData?.forEach((m) => {
        mMap[m.organization] = (mMap[m.organization] || 0) + 1;
      });
      setMentorCountsMap(mMap);

      const uMap: Record<string, number> = {};
      usersData?.forEach((u) => {
        uMap[u.organization] = (uMap[u.organization] || 0) + 1;
      });
      setUserCountsMap(uMap);
    }
    loadData();
  }, []);

  // Modals and notifications states
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [selectedOrgForEdit, setSelectedOrgForEdit] = useState<Organization | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Provision Form state
  const [provName, setProvName] = useState('');
  const [provPlan, setProvPlan] = useState<Organization['plan']>('Standard');
  const [provUsers, setProvUsers] = useState(10);
  const [provStudents, setProvStudents] = useState(100);
  const [provMentors, setProvMentors] = useState(5);

  // Edit Form state
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState<Organization['plan']>('Standard');
  const [editUsers, setEditUsers] = useState(10);
  const [editStudents, setEditStudents] = useState(100);
  const [editMentors, setEditMentors] = useState(5);

  const handleOpenEditModal = (org: Organization) => {
    setSelectedOrgForEdit(org);
    setEditName(org.name);
    setEditPlan(org.plan);
    setEditUsers(org.users);
    setEditStudents(org.students);
    setEditMentors(org.mentors);
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provName.trim()) return;

    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: provName,
      plan: provPlan,
      users: provUsers,
      students: provStudents,
      mentors: provMentors,
      renewalDate: '2027-06-01',
      status: 'Active'
    };

    const { error } = await supabase.from('organizations').insert([newOrg]);
    if (error) {
      console.error(error);
      alert('Error provisioning organization: ' + error.message);
      return;
    }

    setData((prev) => [newOrg, ...prev]);
    setToastMessage(`Successfully provisioned tenant "${provName}"!`);
    setShowToast(true);
    setShowProvisionModal(false);

    // reset
    setProvName('');
    setProvPlan('Standard');
    setProvUsers(10);
    setProvStudents(100);
    setProvMentors(5);

    setTimeout(() => setShowToast(false), 3000);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForEdit) return;

    const updated = {
      name: editName,
      plan: editPlan,
      users: editUsers,
      students: editStudents,
      mentors: editMentors
    };

    const { error } = await supabase
      .from('organizations')
      .update(updated)
      .eq('id', selectedOrgForEdit.id);

    if (error) {
      console.error(error);
      alert('Error updating organization: ' + error.message);
      return;
    }

    setData((prev) =>
      prev.map((org) => {
        if (org.id === selectedOrgForEdit.id) {
          return {
            ...org,
            ...updated
          };
        }
        return org;
      })
    );

    setToastMessage(`Updated tenant details for "${editName}"`);
    setShowToast(true);
    setSelectedOrgForEdit(null);

    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredOrgs = data.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'All' || org.plan === planFilter;
    const matchesStatus = statusFilter === 'All' || org.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleToggleStatus = async (id: string) => {
    const org = data.find((o) => o.id === id);
    if (!org) return;

    const newStatus: Organization['status'] = org.status === 'Active' ? 'Suspended' : 'Active';

    const { error } = await supabase
      .from('organizations')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('Error updating status: ' + error.message);
      return;
    }

    setData((prev) =>
      prev.map((org) => {
        if (org.id === id) {
          return { ...org, status: newStatus };
        }
        return org;
      })
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Organization Tenants</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Manage educational institutions, plans, billing, and system limits</p>
        </div>
        <button
          onClick={() => setShowProvisionModal(true)}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Tenant</span>
        </button>
      </div>

      {/* Stats Summary cards — computed from live data */}
      {(() => {
        const totalTenants = data.length;
        const totalEnrolled = actualStudentCount;
        const enterpriseCount = data.filter((o) => o.plan === 'Enterprise').length;
        const activeCount = data.filter((o) => o.status === 'Active').length;
        const renewalRate = totalTenants > 0 ? Math.round((activeCount / totalTenants) * 100) : 0;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Total Tenants */}
            <motion.div
              whileHover={{ y: -4 }}
              className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-blue-600 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">Total Tenants</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white leading-none block">
                  {totalTenants === 0 ? '—' : totalTenants}
                </span>
                <span className="text-[9px] text-blue-500 font-bold block">Registered Tenants</span>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
            </motion.div>

            {/* Card 2: Active Enrollment */}
            <motion.div
              whileHover={{ y: -4 }}
              className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-teal-500 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">Active Enrollment</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white leading-none block">
                  {totalTenants === 0 ? '—' : totalEnrolled.toLocaleString()}
                </span>
                <span className="text-[9px] text-teal-500 font-bold block">Enrolled Students</span>
              </div>
              <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl text-teal-650 dark:text-teal-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </motion.div>

            {/* Card 3: Enterprise Tiers */}
            <motion.div
              whileHover={{ y: -4 }}
              className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-indigo-600 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">Enterprise Tiers</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white leading-none block">
                  {totalTenants === 0 ? '—' : enterpriseCount}
                </span>
                <span className="text-[9px] text-indigo-500 font-bold block">Institutes &amp; Schools</span>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
            </motion.div>

            {/* Card 4: Renewal Rate */}
            <motion.div
              whileHover={{ y: -4 }}
              className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-amber-500 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">Avg Renewal Rate</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white leading-none block">
                  {totalTenants === 0 ? '—' : `${renewalRate}%`}
                </span>
                <span className="text-[9px] text-amber-500 font-bold block">Platform Renewal</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Percent className="w-5 h-5" />
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Plans</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Premium Growth">Premium Growth</option>
            <option value="Standard">Standard</option>
            <option value="Basic">Basic</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Organization</th>
                <th className="px-5 py-3">Subscription Plan</th>
                <th className="px-5 py-3">Platform Users</th>
                <th className="px-5 py-3">Students Limit</th>
                <th className="px-5 py-3">Active Mentors</th>
                <th className="px-5 py-3">Renewal Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                  <td className="px-5 py-4 font-bold text-slate-800 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                        <Building2 className="w-4.5 h-4.5" />
                      </div>
                      <span>{org.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                      org.plan === 'Enterprise'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : org.plan === 'Premium Growth'
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono font-medium">{userCountsMap[org.name] || 0} users</td>
                  <td className="px-5 py-4 font-mono font-medium text-slate-500">
                    {studentCountsMap[org.name] || 0} / {org.students} students
                  </td>
                  <td className="px-5 py-4 font-mono font-medium text-slate-500">{mentorCountsMap[org.name] || 0} mentors</td>
                  <td className="px-5 py-4 font-mono">{org.renewalDate}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleToggleStatus(org.id)}
                      className={`px-2 py-0.5 rounded-full font-bold text-[9px] flex items-center gap-1 cursor-pointer hover:opacity-80 transition-all ${
                        org.status === 'Active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${org.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span>{org.status}</span>
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggleStatus(org.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                        title={org.status === 'Active' ? 'Suspend Organization' : 'Re-activate Organization'}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(org)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                        title="Edit Organization Details"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrgs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400 font-medium">
                    No organizations matching filters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 text-xs font-sans"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provision Tenant Modal */}
      <AnimatePresence>
        {showProvisionModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProvisionModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
              >
                <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                      <Building2 className="w-4.5 h-4.5" />
                      <span>Provision Educational Tenant</span>
                    </h2>
                    <p className="text-[10px] text-blue-100 mt-0.5">Spin up isolated learning spaces and allocate quotas</p>
                  </div>
                  <button
                    onClick={() => setShowProvisionModal(false)}
                    className="p-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleProvisionSubmit}>
                  <div className="p-5 space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Institution Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Oakridge International Srinagar"
                        value={provName}
                        onChange={(e) => setProvName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Subscription Tier</label>
                      <select
                        value={provPlan}
                        onChange={(e) => setProvPlan(e.target.value as any)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      >
                        <option value="Enterprise">Enterprise</option>
                        <option value="Premium Growth">Premium Growth</option>
                        <option value="Standard">Standard</option>
                        <option value="Basic">Basic</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Users Quota</label>
                        <input
                          type="number"
                          required
                          value={provUsers}
                          onChange={(e) => setProvUsers(Number(e.target.value))}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Students Limit</label>
                        <input
                          type="number"
                          required
                          value={provStudents}
                          onChange={(e) => setProvStudents(Number(e.target.value))}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tutors Quota</label>
                        <input
                          type="number"
                          required
                          value={provMentors}
                          onChange={(e) => setProvMentors(Number(e.target.value))}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowProvisionModal(false)}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all cursor-pointer"
                    >
                      Provision Tenant
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Tenant Modal */}
      <AnimatePresence>
        {selectedOrgForEdit && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrgForEdit(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
              >
                <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black tracking-tight">Modify Tenant Registration</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedOrgForEdit.id.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrgForEdit(null)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleEditSubmit}>
                  <div className="p-5 space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tenant Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Subscription Tier</label>
                      <select
                        value={editPlan}
                        onChange={(e) => setEditPlan(e.target.value as any)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      >
                        <option value="Enterprise">Enterprise</option>
                        <option value="Premium Growth">Premium Growth</option>
                        <option value="Standard">Standard</option>
                        <option value="Basic">Basic</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Users Quota</label>
                        <input
                          type="number"
                          required
                          value={editUsers}
                          onChange={(e) => setEditUsers(Number(e.target.value))}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Students Limit</label>
                        <input
                          type="number"
                          required
                          value={editStudents}
                          onChange={(e) => setEditStudents(Number(e.target.value))}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tutors Quota</label>
                        <input
                          type="number"
                          required
                          value={editMentors}
                          onChange={(e) => setEditMentors(Number(e.target.value))}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedOrgForEdit(null)}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all cursor-pointer"
                    >
                      Save Tenant Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
