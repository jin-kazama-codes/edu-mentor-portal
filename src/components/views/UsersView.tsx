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
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { hashPassword } from '../../utils/crypto';

function UserAvatar({ src, name }: { src?: string; name: string }) {
  const [error, setError] = useState(false);

  const isValidUrl = src && (src.startsWith('http') || src.startsWith('data:image') || src.startsWith('/'));

  if (!isValidUrl || error) {
    return (
      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-750 ring-2 ring-slate-100 dark:ring-slate-700 shrink-0 flex items-center justify-center text-slate-650 dark:text-slate-350 font-extrabold text-[13px] select-none">
        {name.trim().charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className="w-9 h-9 rounded-lg object-cover ring-2 ring-slate-100 dark:ring-slate-700 shrink-0"
    />
  );
}

export default function UsersView() {
  const { currentUser, hasPermission, logSecurityAudit } = useAuth();
  const [data, setData] = useState<User[]>([]);

  const [orgsList, setOrgsList] = useState<string[]>([]);

  const canRead = hasPermission('User and Role Management', 'read');
  const canCreate = hasPermission('User and Role Management', 'create');
  const canUpdate = hasPermission('User and Role Management', 'update');
  const canDelete = hasPermission('User and Role Management', 'delete');

  useEffect(() => {
    if (!currentUser || !canRead) return;

    async function loadData() {
      let query = supabase.from('users').select('*').order('created_at', { ascending: false });
      if (currentUser.role !== 'Super Admin') {
        query = query.eq('organization', currentUser.organization);
      }
      const { data: usrs, error } = await query;
      if (!error && usrs) {
        setData(usrs);
      }
    }
    async function loadOrgs() {
      const { data, error } = await supabase.from('organizations').select('name');
      let fetchedOrgs = !error && data ? data.map((o: any) => o.name) : [];
      if (currentUser && currentUser.role !== 'Super Admin' && !fetchedOrgs.includes(currentUser.organization)) {
        fetchedOrgs.push(currentUser.organization);
      }
      setOrgsList(fetchedOrgs);
    }
    loadData();
    loadOrgs();
  }, [currentUser, canRead]);

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
  const [inviteOrg, setInviteOrg] = useState('');
  const [inviteStatus, setInviteStatus] = useState<User['status']>('Active');
  const [inviteAvatarFile, setInviteAvatarFile] = useState<File | null>(null);
  const [inviteAvatarPreview, setInviteAvatarPreview] = useState<string>('');
  const [inviteNumber, setInviteNumber] = useState('');
  const [inviteGender, setInviteGender] = useState<'Male' | 'Female' | 'Others'>('Male');
  const [invitePassword, setInvitePassword] = useState('');

  useEffect(() => {
    if (currentUser && currentUser.role !== 'Super Admin') {
      setInviteOrg(currentUser.organization);
    }
  }, [currentUser]);

  // Form states for Edit User
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Student');
  const [editOrg, setEditOrg] = useState('');
  const [editStatus, setEditStatus] = useState<User['status']>('Active');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string>('');
  const [editNumber, setEditNumber] = useState('');
  const [editGender, setEditGender] = useState<'Male' | 'Female' | 'Others'>('Male');
  const [editPassword, setEditPassword] = useState('');

  const handleOpenInviteModal = () => {
    setInviteName('');
    setInviteEmail('');
    setInviteRole(currentUser?.role === 'Super Admin' ? 'Organization Admin' : 'Student');
    setInviteStatus('Active');
    setInviteAvatarFile(null);
    setInviteAvatarPreview('');
    setInviteNumber('');
    setInviteGender('Male');
    setInvitePassword('');
    if (currentUser && currentUser.role !== 'Super Admin') {
      setInviteOrg(currentUser.organization);
    } else {
      setInviteOrg('');
    }
    setShowInviteModal(true);
  };

  const handleOpenEditModal = (user: User) => {
    setSelectedUserForEdit(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditOrg(user.organization);
    setEditStatus(user.status);
    setEditAvatarPreview(user.avatar || '');
    setEditAvatarFile(null);
    setEditNumber(user.number || '');
    setEditGender(user.gender || 'Male');
    setEditPassword('');
  };

  // Helper to convert File to Base64 data URL
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleInviteAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds the 2MB limit. Please select a smaller image.');
        return;
      }
      setInviteAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setInviteAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveInviteAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInviteAvatarFile(null);
    setInviteAvatarPreview('');
  };

  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds the 2MB limit. Please select a smaller image.');
        return;
      }
      setEditAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveEditAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditAvatarFile(null);
    setEditAvatarPreview('');
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
    setInviteRole(currentUser?.role === 'Super Admin' ? 'Organization Admin' : 'Student');
    setInviteOrg(currentUser?.role !== 'Super Admin' ? (currentUser?.organization || '') : '');
    setInviteAvatarFile(null);
    setInviteAvatarPreview('');
    setInviteNumber('');
    setInviteGender('Male');
    setInvitePassword('');
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim() || !currentUser) return;
    if (!canCreate) {
      alert('Action Denied: You do not have permissions to invite new users.');
      return;
    }

    if (currentUser.role === 'Super Admin' && inviteRole !== 'Organization Admin') {
      alert('Action Denied: Super Admin can only invite Organization Admin.');
      return;
    }

    const resolvedOrg = currentUser.role === 'Super Admin' ? inviteOrg : currentUser.organization;
    let uploadedAvatarUrl = '';

    if (inviteAvatarFile) {
      try {
        const fileExt = inviteAvatarFile.name.split('.').pop();
        const fileName = `avatar-${Date.now()}.${fileExt}`;
        const filePath = fileName;

        try {
          await supabase.storage.createBucket('avatars', { public: true });
        } catch (bucketErr) {
          console.log('Bucket check/creation failed:', bucketErr);
        }

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, inviteAvatarFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadErr) {
          console.warn('Supabase storage upload error, falling back to Base64:', uploadErr.message);
          uploadedAvatarUrl = await toBase64(inviteAvatarFile);
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          uploadedAvatarUrl = publicUrl;
        }
      } catch (err: any) {
        console.error('Storage error, falling back to Base64:', err);
        try {
          uploadedAvatarUrl = await toBase64(inviteAvatarFile);
        } catch (base64Err) {
          console.error('Base64 fallback failed:', base64Err);
        }
      }
    }

    if (!invitePassword.trim()) {
      alert('Password is required when inviting a new user.');
      return;
    }

    const hashedPassword = await hashPassword(invitePassword);

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      organization: resolvedOrg,
      status: inviteStatus,
      avatar: uploadedAvatarUrl,
      createdDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      number: inviteNumber,
      gender: inviteGender,
      password: hashedPassword
    };

    const { error } = await supabase.from('users').insert([newUser]);
    if (error) {
      console.error(error);
      alert('Error inviting user: ' + error.message);
      return;
    }

    await logSecurityAudit(
      'Create User Successful',
      'Info',
      `Invited user "${inviteName}" (${inviteEmail}) as ${inviteRole} to organization "${resolvedOrg}"`
    );

    setData((prev) => [newUser, ...prev]);
    setToastMessage(`Successfully invited "${inviteName}" as ${inviteRole}!`);
    setShowToast(true);
    handleCloseInviteModal();

    setTimeout(() => setShowToast(false), 3000);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit || !currentUser) return;
    if (!canUpdate) {
      alert('Action Denied: You do not have permissions to edit user details.');
      return;
    }

    const resolvedOrg = currentUser.role === 'Super Admin' ? editOrg : currentUser.organization;
    let uploadedAvatarUrl = selectedUserForEdit.avatar;

    if (editAvatarFile) {
      try {
        const fileExt = editAvatarFile.name.split('.').pop();
        const fileName = `avatar-${Date.now()}.${fileExt}`;
        const filePath = fileName;

        try {
          await supabase.storage.createBucket('avatars', { public: true });
        } catch (bucketErr) {
          console.log('Bucket check/creation failed:', bucketErr);
        }

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, editAvatarFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadErr) {
          console.warn('Supabase storage upload error, falling back to Base64:', uploadErr.message);
          uploadedAvatarUrl = await toBase64(editAvatarFile);
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          uploadedAvatarUrl = publicUrl;
        }
      } catch (err: any) {
        console.error('Storage error, falling back to Base64:', err);
        try {
          uploadedAvatarUrl = await toBase64(editAvatarFile);
        } catch (base64Err) {
          console.error('Base64 fallback failed:', base64Err);
        }
      }
    } else if (!editAvatarPreview) {
      uploadedAvatarUrl = '';
    }

    const updated: any = {
      name: editName,
      email: editEmail,
      role: editRole,
      organization: resolvedOrg,
      status: editStatus,
      avatar: uploadedAvatarUrl,
      number: editNumber,
      gender: editGender
    };

    if (editPassword.trim()) {
      updated.password = await hashPassword(editPassword);
    }

    const { error } = await supabase
      .from('users')
      .update(updated)
      .eq('id', selectedUserForEdit.id);

    if (error) {
      console.error(error);
      alert('Error updating user: ' + error.message);
      return;
    }

    // Identify and audit suspensions
    if (editStatus !== selectedUserForEdit.status) {
      const isSuspended = editStatus === 'Inactive' || editStatus === 'Pending';
      await logSecurityAudit(
        isSuspended ? 'Suspend User Successful' : 'Reactivate User Successful',
        isSuspended ? 'High' : 'Medium',
        `Changed status for user "${editName}" (${editEmail}) to ${editStatus}.`
      );
    } else {
      await logSecurityAudit(
        'Update User Successful',
        'Medium',
        `Updated details for user "${editName}" (${editEmail}). Role: ${editRole}, Org: ${resolvedOrg}.`
      );
    }

    setData((prev) =>
      prev.map((u) => {
        if (u.id === selectedUserForEdit.id) {
          return {
            ...u,
            ...updated
          };
        }
        return u;
      })
    );

    setToastMessage(`Updated user details for "${editName}"`);
    setShowToast(true);
    setSelectedUserForEdit(null);
    setEditAvatarFile(null);
    setEditAvatarPreview('');

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

  const handleToggleStatus = async (id: string) => {
    if (!canUpdate) {
      alert('Action Denied: You do not have permissions to modify user status.');
      return;
    }
    const user = data.find((u) => u.id === id);
    if (!user) return;

    const newStatus: User['status'] = user.status === 'Active' ? 'Inactive' : 'Active';

    const { error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('Error updating user status: ' + error.message);
      return;
    }

    const logAction = newStatus === 'Inactive' ? 'Suspend User Successful' : 'Reactivate User Successful';
    const logSeverity = newStatus === 'Inactive' ? 'High' : 'Medium';
    await logSecurityAudit(
      logAction,
      logSeverity,
      `Toggled status of user "${user.name}" (${user.email}) to ${newStatus}.`
    );

    setData((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const handleDeleteSelected = async () => {
    if (!canDelete) {
      alert('Action Denied: You do not have permissions to delete user records.');
      return;
    }
    if (selectedIds.length === 0) return;

    const usersToDelete = data.filter((u) => selectedIds.includes(u.id));
    const mentorEmails = usersToDelete.filter((u) => u.role === 'Mentor').map((u) => u.email);
    const studentEmails = usersToDelete.filter((u) => u.role === 'Student').map((u) => u.email);

    const { error } = await supabase
      .from('users')
      .delete()
      .in('id', selectedIds);

    if (error) {
      console.error(error);
      alert('Error deleting selected users: ' + error.message);
      return;
    }

    if (mentorEmails.length > 0) {
      const { error: mentorError } = await supabase
        .from('mentors')
        .delete()
        .in('email', mentorEmails);
      if (mentorError) {
        console.error('Error deleting from mentors table:', mentorError);
      }
    }

    if (studentEmails.length > 0) {
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .in('email', studentEmails);
      if (studentError) {
        console.error('Error deleting from students table:', studentError);
      }
    }

    await logSecurityAudit(
      'Delete Users Successful',
      'Critical',
      `Deleted ${selectedIds.length} user records: [${selectedIds.join(', ')}].`
    );

    setData((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
    setSelectedIds([]);
  };

  const handleDeleteUser = async (user: User) => {
    if (!canDelete) {
      alert('Action Denied: You do not have permissions to delete user records.');
      return;
    }

    if (currentUser && user.id === currentUser.id) {
      alert('Action Denied: You cannot delete your own user account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user "${user.name}" (${user.email})? This action is permanent.`)) {
      return;
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (error) {
      console.error(error);
      alert('Error deleting user: ' + error.message);
      return;
    }

    if (user.role === 'Mentor') {
      const { error: mentorError } = await supabase
        .from('mentors')
        .delete()
        .eq('email', user.email);
      if (mentorError) {
        console.error('Error deleting from mentors table:', mentorError);
      }
    } else if (user.role === 'Student') {
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('email', user.email);
      if (studentError) {
        console.error('Error deleting from students table:', studentError);
      }
    }

    await logSecurityAudit(
      'Delete User Successful',
      'Critical',
      `Deleted user record: "${user.name}" (${user.email}).`
    );

    setData((prev) => prev.filter((u) => u.id !== user.id));
    setSelectedIds((prev) => prev.filter((id) => id !== user.id));

    setToastMessage(`Successfully deleted user "${user.name}"`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleExportCSV = async () => {
    if (!hasPermission('User and Role Management', 'export')) {
      alert('Action Denied: You do not have permissions to export user data.');
      return;
    }

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

    await logSecurityAudit(
      'Export User Data Successful',
      'High',
      `Exported CSV record list of ${filteredUsers.length} users.`
    );
  };

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center font-sans">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Security Access Violation</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          You do not hold the required authorization credentials ('User and Role Management' read scope) to view the platform user directory.
        </p>
      </div>
    );
  }

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
          {currentUser?.role === 'Super Admin' && (
            <button
              onClick={handleOpenInviteModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Organization Admin</span>
            </button>
          )}
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
            {currentUser?.role === 'Super Admin' && <option value="Super Admin">Super Admin</option>}
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
                    className={`transition-colors ${isSelected
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
                        <UserAvatar src={user.avatar} name={user.name} />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-800 dark:text-white truncate">{user.name}</span>
                          <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                          {(user.number || user.gender) && (
                            <span className="text-[9px] text-slate-400/80 truncate mt-0.5">
                              {user.gender ? `${user.gender} • ` : ''}{user.number || ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${user.role === 'Super Admin'
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
                        className={`px-2 py-0.5 rounded-full font-bold text-[9px] flex items-center gap-1 cursor-pointer hover:opacity-85 transition-all ${user.status === 'Active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                          : user.status === 'Pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                          }`}
                      >
                        <span className={`w-1.2 h-1.2 rounded-full inline-block ${user.status === 'Active' ? 'bg-green-500' : user.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'
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
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentPage === page
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
              onClick={handleCloseInviteModal}
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
                    onClick={handleCloseInviteModal}
                    className="p-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleInviteSubmit}>
                  <div className="p-5 space-y-4 text-xs">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center justify-center pb-2 border-b border-slate-100 dark:border-slate-750">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">User Avatar</label>
                      <div className="relative group cursor-pointer">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-colors flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative shadow-inner">
                          {inviteAvatarPreview ? (
                            <img src={inviteAvatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-550 p-2 text-center">
                              <Plus className="w-6 h-6 mb-0.5 text-slate-405" />
                              <span className="text-[9px] font-bold">Upload</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleInviteAvatarChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                        {inviteAvatarPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveInviteAvatar}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-650 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">
                        Supports PNG, JPG, or GIF (Max 2MB)
                      </p>
                    </div>

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

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter temporary password"
                        value={invitePassword}
                        onChange={(e) => setInvitePassword(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={inviteNumber}
                          onChange={(e) => setInviteNumber(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Gender</label>
                        <select
                          value={inviteGender}
                          onChange={(e) => setInviteGender(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Role Allocation</label>
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value as UserRole)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          {currentUser?.role === 'Super Admin' ? (
                            <option value="Organization Admin">Organization Admin</option>
                          ) : (
                            <>
                              <option value="Mentor">Mentor</option>
                              <option value="Assistant">Assistant</option>
                              <option value="Student">Student</option>
                            </>
                          )}
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
                      <select
                        value={inviteOrg}
                        onChange={(e) => setInviteOrg(e.target.value)}
                        disabled={currentUser?.role !== 'Super Admin'}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Tenant Organization</option>
                        {orgsList.map((orgName) => (
                          <option key={orgName} value={orgName}>
                            {orgName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleCloseInviteModal}
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
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center justify-center pb-2 border-b border-slate-100 dark:border-slate-750">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">User Avatar</label>
                      <div className="relative group cursor-pointer">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-colors flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative shadow-inner">
                          {editAvatarPreview ? (
                            <img src={editAvatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-550 p-2 text-center">
                              <Plus className="w-6 h-6 mb-0.5 text-slate-405" />
                              <span className="text-[9px] font-bold">Upload</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEditAvatarChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                        {editAvatarPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveEditAvatar}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-650 text-white rounded-full p-1 shadow-md transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">
                        Supports PNG, JPG, or GIF (Max 2MB)
                      </p>
                    </div>

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

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">New Password (Optional)</label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep current password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={editNumber}
                          onChange={(e) => setEditNumber(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Gender</label>
                        <select
                          value={editGender}
                          onChange={(e) => setEditGender(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Platform Role</label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          {currentUser?.role === 'Super Admin' && (
                            <>
                              <option value="Super Admin">Super Admin</option>
                              <option value="Organization Admin">Organization Admin</option>
                            </>
                          )}
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
                      <select
                        value={editOrg}
                        onChange={(e) => setEditOrg(e.target.value)}
                        disabled={currentUser?.role !== 'Super Admin'}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="">Select Tenant Organization</option>
                        {orgsList.map((orgName) => (
                          <option key={orgName} value={orgName}>
                            {orgName}
                          </option>
                        ))}
                      </select>
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
