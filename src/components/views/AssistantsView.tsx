/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  UserCheck,
  Plus,
  X,
  Mail,
  Phone,
  User,
  Edit,
  Trash2,
  GraduationCap,
  Sparkles,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { User as UserType } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { hashPassword } from '../../utils/crypto';

interface AssistantsViewProps {
  selectedOrg?: string;
}

export default function AssistantsView({ selectedOrg = 'All Organizations' }: AssistantsViewProps) {
  const { currentUser, hasPermission, logSecurityAudit } = useAuth();
  const [data, setData] = useState<UserType[]>([]);
  const [mentorsList, setMentorsList] = useState<UserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [formMentorsList, setFormMentorsList] = useState<UserType[]>([]);
  const [orgsList, setOrgsList] = useState<string[]>([]);
  const [formOrg, setFormOrg] = useState('');

  useEffect(() => {
    async function loadOrgs() {
      const { data, error } = await supabase.from('organizations').select('name').order('name');
      if (!error && data) {
        setOrgsList(data.map((o: any) => o.name));
      }
    }
    loadOrgs();
  }, []);

  useEffect(() => {
    if (selectedOrg && selectedOrg !== 'All Organizations') {
      setFormOrg(selectedOrg);
    } else {
      setFormOrg('');
    }
  }, [selectedOrg]);

  useEffect(() => {
    if (!currentUser) return;
    async function loadFormMentors() {
      const orgToFilterForm = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? formOrg : selectedOrg)
        : currentUser.organization;

      if (!orgToFilterForm) {
        setFormMentorsList([]);
        return;
      }

      const { data: mnts, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'Mentor')
        .eq('organization', orgToFilterForm)
        .order('name');

      if (!error && mnts) {
        setFormMentorsList(mnts);
      } else {
        setFormMentorsList([]);
      }
    }
    loadFormMentors();
  }, [currentUser, selectedOrg, formOrg]);

  const canCreate = hasPermission('User and Role Management', 'create');
  const canUpdate = hasPermission('User and Role Management', 'update');
  const canDelete = hasPermission('User and Role Management', 'delete');

  const orgToFilter = currentUser?.role === 'Super Admin'
    ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
    : currentUser?.organization;

  // Load Assistants and Mentors from database
  useEffect(() => {
    if (!currentUser) return;

    async function loadData() {
      setLoading(true);
      
      // Fetch Assistants
      let assistQuery = supabase
        .from('users')
        .select('*')
        .eq('role', 'Assistant')
        .order('created_at', { ascending: false });
      
      if (orgToFilter) {
        assistQuery = assistQuery.eq('organization', orgToFilter);
      }
      
      const { data: assists, error: assistErr } = await assistQuery;
      if (!assistErr && assists) {
        setData(assists);
      }

      // Fetch Mentors (from users table so we get their user ID for mentor_id linking)
      let mentorQuery = supabase
        .from('users')
        .select('*')
        .eq('role', 'Mentor');

      if (orgToFilter) {
        mentorQuery = mentorQuery.eq('organization', orgToFilter);
      }

      const { data: mnts, error: mentorErr } = await mentorQuery;
      if (!mentorErr && mnts) {
        setMentorsList(mnts);
      }
      
      setLoading(false);
    }

    loadData();
  }, [currentUser, selectedOrg, orgToFilter]);

  const [searchQuery, setSearchQuery] = useState('');
  const [mentorFilter, setMentorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals and feedback state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedAssistantForEdit, setSelectedAssistantForEdit] = useState<UserType | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Form states for Add Assistant
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Others'>('Male');
  const [formStatus, setFormStatus] = useState<UserType['status']>('Active');
  const [formPassword, setFormPassword] = useState('');
  const [formMentorId, setFormMentorId] = useState('');
  const [formAvatarFile, setFormAvatarFile] = useState<File | null>(null);
  const [formAvatarPreview, setFormAvatarPreview] = useState('');

  // Form states for Edit Assistant
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGender, setEditGender] = useState<'Male' | 'Female' | 'Others'>('Male');
  const [editStatus, setEditStatus] = useState<UserType['status']>('Active');
  const [editPassword, setEditPassword] = useState('');
  const [editMentorId, setEditMentorId] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);

  // Reset Add Form
  useEffect(() => {
    if (!showAddModal) {
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormGender('Male');
      setFormStatus('Active');
      setFormPassword('');
      setFormMentorId('');
      setFormAvatarFile(null);
      setFormAvatarPreview('');
      setShowPassword(false);
      if (selectedOrg && selectedOrg !== 'All Organizations') {
        setFormOrg(selectedOrg);
      } else {
        setFormOrg('');
      }
    }
  }, [showAddModal, selectedOrg]);

  // Set Edit Form when selected assistant changes
  useEffect(() => {
    if (selectedAssistantForEdit) {
      setEditName(selectedAssistantForEdit.name);
      setEditEmail(selectedAssistantForEdit.email);
      setEditPhone(selectedAssistantForEdit.number || '');
      setEditGender(selectedAssistantForEdit.gender || 'Male');
      setEditStatus(selectedAssistantForEdit.status);
      setEditPassword('');
      setEditMentorId(selectedAssistantForEdit.mentor_id || '');
      setEditAvatarPreview(selectedAssistantForEdit.avatar || '');
      setEditAvatarFile(null);
      setShowEditPassword(false);
    }
  }, [selectedAssistantForEdit]);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds the 2MB limit. Please select a smaller image.');
        return;
      }
      if (isEdit) {
        setEditAvatarFile(file);
        setEditAvatarPreview(URL.createObjectURL(file));
      } else {
        setFormAvatarFile(file);
        setFormAvatarPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleRemoveAvatar = (isEdit: boolean) => {
    if (isEdit) {
      setEditAvatarFile(null);
      setEditAvatarPreview('');
    } else {
      setFormAvatarFile(null);
      setFormAvatarPreview('');
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      try {
        await supabase.storage.createBucket('avatars', { public: true });
      } catch (bucketErr) {
        console.log('Bucket check/creation failed:', bucketErr);
      }

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadErr) {
        console.warn('Supabase storage upload error, falling back to Base64:', uploadErr.message);
        return await toBase64(file);
      } else if (uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        return publicUrl;
      }
    } catch (err) {
      console.error('Storage error, falling back to Base64:', err);
      try {
        return await toBase64(file);
      } catch (base64Err) {
        console.error('Base64 fallback failed:', base64Err);
      }
    }
    return '';
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !currentUser) return;
    if (!canCreate) {
      alert('Action Denied: You do not have permissions to add assistants.');
      return;
    }
    if (!formPassword.trim()) {
      alert('Password is required when creating a new assistant.');
      return;
    }

    const resolvedOrg = currentUser.role === 'Super Admin'
      ? (selectedOrg === 'All Organizations' ? formOrg : selectedOrg)
      : currentUser.organization;

    if (!resolvedOrg) {
      alert('Please select an organization');
      return;
    }

    let uploadedAvatarUrl = '';
    if (formAvatarFile) {
      uploadedAvatarUrl = await uploadAvatar(formAvatarFile);
    }

    const hashedPassword = await hashPassword(formPassword);

    const newAssistant: UserType = {
      id: `usr-${Date.now()}`,
      name: formName,
      email: formEmail,
      role: 'Assistant',
      organization: resolvedOrg,
      status: formStatus,
      avatar: uploadedAvatarUrl,
      createdDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      number: formPhone || undefined,
      gender: formGender,
      password: hashedPassword,
      mentor_id: formMentorId || undefined
    };

    const { error } = await supabase.from('users').insert([newAssistant]);
    if (error) {
      console.error(error);
      alert('Error creating assistant: ' + error.message);
      return;
    }

    await logSecurityAudit(
      'Create User Successful',
      'Info',
      `Created assistant "${formName}" (${formEmail}) in organization "${resolvedOrg}"`
    );

    setData((prev) => [newAssistant, ...prev]);
    setToastMessage(`Assistant "${formName}" added successfully!`);
    setShowToast(true);
    setShowAddModal(false);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssistantForEdit || !currentUser) return;
    if (!canUpdate) {
      alert('Action Denied: You do not have permissions to edit assistant details.');
      return;
    }

    let uploadedAvatarUrl = selectedAssistantForEdit.avatar;
    if (editAvatarFile) {
      uploadedAvatarUrl = await uploadAvatar(editAvatarFile);
    } else if (!editAvatarPreview) {
      uploadedAvatarUrl = '';
    }

    const updated: any = {
      name: editName,
      email: editEmail,
      number: editPhone || null,
      gender: editGender,
      status: editStatus,
      avatar: uploadedAvatarUrl,
      mentor_id: editMentorId || null
    };

    if (editPassword.trim()) {
      updated.password = await hashPassword(editPassword);
    }

    const { error } = await supabase
      .from('users')
      .update(updated)
      .eq('id', selectedAssistantForEdit.id);

    if (error) {
      console.error(error);
      alert('Error updating assistant: ' + error.message);
      return;
    }

    // Security Audit Log
    await logSecurityAudit(
      'Update User Successful',
      'Medium',
      `Updated details for assistant "${editName}" (${editEmail}).`
    );

    setData((prev) =>
      prev.map((a) =>
        a.id === selectedAssistantForEdit.id
          ? {
              ...a,
              name: editName,
              email: editEmail,
              number: editPhone || undefined,
              gender: editGender,
              status: editStatus,
              avatar: uploadedAvatarUrl,
              mentor_id: editMentorId || undefined
            }
          : a
      )
    );

    setToastMessage(`Assistant "${editName}" updated successfully!`);
    setShowToast(true);
    setSelectedAssistantForEdit(null);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDeleteAssistant = async (id: string, name: string) => {
    if (!currentUser) return;
    if (!canDelete) {
      alert('Action Denied: You do not have permissions to delete assistants.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete assistant "${name}"? This action cannot be undone.`)) {
      return;
    }

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error(error);
      alert('Error deleting assistant: ' + error.message);
      return;
    }

    await logSecurityAudit(
      'Delete User Successful',
      'High',
      `Deleted assistant "${name}" (${id})`
    );

    setData((prev) => prev.filter((a) => a.id !== id));
    setToastMessage(`Assistant "${name}" deleted successfully.`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Find mentor name from mentor ID mapping
  const getMentorName = (mentorId?: string) => {
    if (!mentorId) return 'Unassigned';
    const mentor = mentorsList.find((m) => m.id === mentorId);
    return mentor ? mentor.name : 'Unassigned';
  };

  // Filters logic
  const filteredAssistants = data.filter((ass) => {
    const matchesSearch =
      ass.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ass.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMentor =
      mentorFilter === 'All' ||
      (mentorFilter === 'Unassigned' && !ass.mentor_id) ||
      ass.mentor_id === mentorFilter;

    const matchesStatus =
      statusFilter === 'All' ||
      ass.status === statusFilter;

    return matchesSearch && matchesMentor && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Teaching Assistants</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
            Manage organization teaching assistants, assign them to mentors, and view active assignments
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Assistant</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search assistants by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {/* Mentor Filter */}
          <select
            value={mentorFilter}
            onChange={(e) => setMentorFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Mentors</option>
            <option value="Unassigned">Unassigned Only</option>
            {mentorsList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Grid of Assistants */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredAssistants.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center shadow-sm">
          <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Assistants Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Try adjusting your search criteria, or add a new assistant to the organization.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssistants.map((assistant, idx) => (
            <motion.div
              key={assistant.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.02 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-50 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-900/10">
                <div className="flex gap-3">
                  {assistant.avatar ? (
                    <img
                      src={assistant.avatar}
                      alt={assistant.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow-md group-hover:scale-102 transition-transform shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 ring-2 ring-white shadow-md group-hover:scale-102 transition-transform shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-500 font-extrabold text-lg select-none">
                      {assistant.name.trim().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-sm truncate flex items-center gap-1.5">
                      <span>{assistant.name}</span>
                      {assistant.status === 'Active' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" title="Active" />
                      ) : assistant.status === 'Pending' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" title="Pending" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" title="Inactive" />
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{assistant.email}</p>
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded mt-1.5 uppercase tracking-wide">
                      {assistant.gender || 'Not Specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Assigned Mentor</span>
                  <div className="mt-1 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                    {assistant.mentor_id ? (
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-indigo-50/60 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                        {getMentorName(assistant.mentor_id)}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic">Unassigned</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750/30">
                  <div>
                    <span className="text-[8px] uppercase font-bold text-slate-400 block">Phone</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                      {assistant.number || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-bold text-slate-400 block">Status</span>
                    <span className={`text-[10px] font-bold mt-1 inline-block ${
                      assistant.status === 'Active' ? 'text-emerald-600' : assistant.status === 'Pending' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {assistant.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3.5 border-t border-slate-50 dark:border-slate-700/65 flex gap-2 bg-slate-50/20 dark:bg-slate-900/5">
                <button
                  onClick={() => setSelectedAssistantForEdit(assistant)}
                  className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDeleteAssistant(assistant.id, assistant.name)}
                    className="p-1.5 text-rose-500 hover:text-white border border-rose-200 hover:bg-rose-500 hover:border-rose-500 dark:border-rose-900/30 dark:hover:bg-rose-600/80 rounded-lg transition-colors cursor-pointer"
                    title="Delete Assistant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span className="font-extrabold text-sm text-slate-800 dark:text-white">Add New Teaching Assistant</span>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
                {/* Avatar upload */}
                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Profile Photo</span>
                  <div className="flex items-center gap-4 w-full justify-center">
                    {formAvatarPreview ? (
                      <div className="relative shrink-0">
                        <img
                          src={formAvatarPreview}
                          alt="Preview"
                          className="w-16 h-16 rounded-xl object-cover ring-2 ring-blue-500 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAvatar(false)}
                          className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-sm"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200 dark:border-slate-700">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div className="text-left">
                      <label className="inline-block px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm border border-blue-100 dark:border-blue-800/40">
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAvatarChange(e, false)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {currentUser?.role === 'Super Admin' && selectedOrg === 'All Organizations' && (
                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Affiliated Organization *</label>
                    <select
                      required
                      value={formOrg}
                      onChange={(e) => setFormOrg(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="" disabled>Select Tenant Organization</option>
                      {orgsList.map((orgName) => (
                        <option key={orgName} value={orgName}>
                          {orgName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Shabir Ganie"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. shabir@learnhub.com"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender *</label>
                    <select
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status *</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-3 pr-10 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assign Mentor</label>
                  <select
                    value={formMentorId}
                    onChange={(e) => setFormMentorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Unassigned (Link later)</option>
                    {formMentorsList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Create Assistant
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {selectedAssistantForEdit && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <span className="font-extrabold text-sm text-slate-800 dark:text-white">Edit Assistant Profile</span>
                </div>
                <button
                  onClick={() => setSelectedAssistantForEdit(null)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
                {/* Avatar upload */}
                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Profile Photo</span>
                  <div className="flex items-center gap-4 w-full justify-center">
                    {editAvatarPreview ? (
                      <div className="relative shrink-0">
                        <img
                          src={editAvatarPreview}
                          alt="Preview"
                          className="w-16 h-16 rounded-xl object-cover ring-2 ring-blue-500 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveAvatar(true)}
                          className="absolute -top-1.5 -right-1.5 p-0.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-sm"
                          title="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200 dark:border-slate-700">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div className="text-left">
                      <label className="inline-block px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm border border-blue-100 dark:border-blue-800/40">
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAvatarChange(e, true)}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 2MB.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Shabir Ganie"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. shabir@learnhub.com"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gender *</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status *</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Update Password (Optional)</label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? "text" : "password"}
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Leave blank to keep same"
                        className="w-full pl-3 pr-10 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assign Mentor</label>
                  <select
                    value={editMentorId}
                    onChange={(e) => setEditMentorId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Unassigned (No Mentor)</option>
                    {mentorsList.filter(m => m.organization === selectedAssistantForEdit?.organization).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedAssistantForEdit(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-5 right-5 bg-slate-900 dark:bg-slate-850 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 z-50 border border-slate-800"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
