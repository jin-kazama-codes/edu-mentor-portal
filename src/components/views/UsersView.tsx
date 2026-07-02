/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  Trash2,
  Edit,
  Download,
  CheckSquare,
  Square,
  AlertCircle,
  ShieldCheck,
  Building2,
  Lock,
  X,
  CheckCircle
} from 'lucide-react';
import { users as initialUsers } from '../../data/mockData';
import { User, UserRole } from '../../types';

export default function UsersView() {
  const [data, setData] = useState<User[]>(() => {
    const saved = localStorage.getItem('portal_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  useEffect(() => {
    localStorage.setItem('portal_users', JSON.stringify(data));
  }, [data]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Interactivity and modals states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form states for Invite New User
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Student');
  const [inviteOrg, setInviteOrg] = useState('EdValley Srinagar');
  const [inviteStatus, setInviteStatus] = useState<User['status']>('Active');

  // Form states for Edit User
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Student');
  const [editOrg, setEditOrg] = useState('');
  const [editStatus, setEditStatus] = useState<User['status']>('Active');

  const handleOpenEditModal = (user: User) => {
    setSelectedUserForEdit(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditOrg(user.organization);
    setEditStatus(user.status);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      organization: inviteOrg,
      status: inviteStatus,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      createdDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never'
    };

    setData((prev) => [newUser, ...prev]);
    setToastMessage(`Successfully invited "${inviteName}" as ${inviteRole}!`);
    setShowToast(true);
    setShowInviteModal(false);

    // reset
    setInviteName('');
    setInviteEmail('');
    setInviteRole('Student');

    setTimeout(() => setShowToast(false), 3000);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    setData((prev) =>
      prev.map((u) => {
        if (u.id === selectedUserForEdit.id) {
          return {
            ...u,
            name: editName,
            email: editEmail,
            role: editRole,
            organization: editOrg,
            status: editStatus
          };
        }
        return u;
      })
    );

    setToastMessage(`Updated user details for "${editName}"`);
    setShowToast(true);
    setSelectedUserForEdit(null);

    setTimeout(() => setShowToast(false), 3000);
  };

  // Filter logic
  const filteredUsers = data.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = () => {
    if (selectedIds.length === currentUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentUsers.map((u) => u.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleToggleStatus = (id: string) => {
    setData((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus: User['status'] = u.status === 'Active' ? 'Inactive' : 'Active';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setData((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
    setSelectedIds([]);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Name,Email,Role,Organization,Status"].join(",") + "\n"
      + filteredUsers.map(u => `"${u.name}","${u.email}","${u.role}","${u.organization}","${u.status}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `platform_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">User Directory</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Maintain identity, role-based controls, and organizations allocations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Invite New User</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-300">
              <CheckSquare className="w-4 h-4" />
              <span>{selectedIds.length} users selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium cursor-pointer transition-all">
                Change Roles
              </button>
              <button
                onClick={handleDeleteSelected}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-750 text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, org..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Organization Admin">Organization Admin</option>
            <option value="Mentor">Mentor</option>
            <option value="Assistant">Assistant</option>
            <option value="Student">Student</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 w-10">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    {selectedIds.length === currentUsers.length && currentUsers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-5 py-3.5">User Details</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Tenant Organization</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created Date</th>
                <th className="px-5 py-3.5">Last Active</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {currentUsers.map((user) => {
                const isSelected = selectedIds.includes(user.id);
                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-blue-50/20 dark:bg-blue-900/10'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-750/30'
                    }`}
                  >
                    <td className="px-5 py-4 w-10">
                      <button onClick={() => handleSelectOne(user.id)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-lg object-cover ring-2 ring-slate-100 dark:ring-slate-700 shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-800 dark:text-white truncate">{user.name}</span>
                          <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        user.role === 'Super Admin'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                          : user.role === 'Organization Admin'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                          : user.role === 'Mentor'
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-750/50 dark:text-slate-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{user.organization}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`px-2 py-0.5 rounded-full font-bold text-[9px] flex items-center gap-1 cursor-pointer hover:opacity-85 transition-all ${
                          user.status === 'Active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                            : user.status === 'Pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                        }`}
                      >
                        <span className={`w-1.2 h-1.2 rounded-full inline-block ${
                          user.status === 'Active' ? 'bg-green-500' : user.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span>{user.status}</span>
                      </button>
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-slate-400">{user.createdDate}</td>
                    <td className="px-5 py-4 font-mono font-medium text-slate-500">{user.lastLogin}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
                          title="Block/Activate User"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500 cursor-pointer"
                          title="Edit User Profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400 font-medium">
                    No users matching the filters found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-150 text-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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

      {/* Invite User Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
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
                      <UserCheck className="w-4.5 h-4.5" />
                      <span>Invite New Platform Associate</span>
                    </h2>
                    <p className="text-[10px] text-blue-100 mt-0.5">Disseminate access credentials and secure roles</p>
                  </div>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="p-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleInviteSubmit}>
                  <div className="p-5 space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Faisal Ahmad"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. user@edportal.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Role Allocation</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as UserRole)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Super Admin">Super Admin</option>
                          <option value="Organization Admin">Organization Admin</option>
                          <option value="Mentor">Mentor</option>
                          <option value="Assistant">Assistant</option>
                          <option value="Student">Student</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Initial Status</label>
                        <select
                          value={inviteStatus}
                          onChange={(e) => setInviteStatus(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Affiliated Organization</label>
                      <input
                        type="text"
                        placeholder="e.g. Srinagar EdValley School"
                        value={inviteOrg}
                        onChange={(e) => setInviteOrg(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all cursor-pointer"
                    >
                      Send Invitation
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {selectedUserForEdit && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUserForEdit(null)}
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
                    <h2 className="text-sm font-black tracking-tight">Modify Identity Dossier</h2>
                    <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedUserForEdit.id.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => setSelectedUserForEdit(null)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleEditSubmit}>
                  <div className="p-5 space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">User Full Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Platform Role</label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Super Admin">Super Admin</option>
                          <option value="Organization Admin">Organization Admin</option>
                          <option value="Mentor">Mentor</option>
                          <option value="Assistant">Assistant</option>
                          <option value="Student">Student</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Account Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Active">Active</option>
                          <option value="Pending">Pending</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Affiliated Organization</label>
                      <input
                        type="text"
                        value={editOrg}
                        onChange={(e) => setEditOrg(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForEdit(null)}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all cursor-pointer"
                    >
                      Save Modifications
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
