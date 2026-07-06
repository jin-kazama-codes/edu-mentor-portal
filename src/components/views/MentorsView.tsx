/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Star,
  Clock,
  Briefcase,
  Users,
  Award,
  ExternalLink,
  Plus,
  Compass,
  Sparkles,
  UserCheck,
  X,
  CheckCircle,
  Calendar,
  Mail,
  ChevronDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { mentors as initialMentors, sessions as mockSessions } from '../../data/mockData';
import { Mentor, User } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { hashPassword } from '../../utils/crypto';

interface MentorsViewProps {
  selectedOrg?: string;
}

export default function MentorsView({ selectedOrg = 'All Organizations' }: MentorsViewProps) {
  const { currentUser, hasPermission } = useAuth();
  const [data, setData] = useState<Mentor[]>([]);

  const canCreate = hasPermission('User and Role Management', 'create');

  useEffect(() => {
    async function loadData() {
      if (!currentUser) return;
      let query = supabase.from('mentors').select('*').order('created_at', { ascending: false });
      
      const orgToFilter = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
        : currentUser.organization;
      if (orgToFilter) {
        query = query.eq('organization', orgToFilter);
      }

      const { data: mnts, error } = await query;
      if (!error && mnts) {
        setData(mnts);
      }
    }
    loadData();
  }, [currentUser, selectedOrg]);

  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('All');

  // Modals and feedback state
  const [selectedMentorProfile, setSelectedMentorProfile] = useState<Mentor | null>(null);
  const [selectedMentorSchedules, setSelectedMentorSchedules] = useState<Mentor | null>(null);
  const [showAddMentorModal, setShowAddMentorModal] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const [showSubjectDropdown, setShowSubjectDropdown] = useState<boolean>(false);

  const [formAvatarFile, setFormAvatarFile] = useState<File | null>(null);
  const [formAvatarPreview, setFormAvatarPreview] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Reset form when modal is closed
  useEffect(() => {
    if (!showAddMentorModal) {
      setShowSubjectDropdown(false);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormGender('');
      setFormAvatar('');
      setFormAvatarFile(null);
      setFormAvatarPreview('');
      setFormPassword('');
      setShowPassword(false);
      setFormSubjects(['Mathematics']);
      setFormExperience('4 Years');
      setFormAvailability('Full-time');
      setFormPerformance('Exceeding');
      setFormRating('5.0');
      if (selectedOrg && selectedOrg !== 'All Organizations') {
        setFormOrg(selectedOrg);
      } else {
        setFormOrg('');
      }
    }
  }, [showAddMentorModal, selectedOrg]);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds the 2MB limit. Please select a smaller image.');
        return;
      }
      setFormAvatarFile(file);
      setFormAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveAvatar = () => {
    setFormAvatarFile(null);
    setFormAvatarPreview('');
  };

  const canUpdate = hasPermission('User and Role Management', 'update');

  // Edit states for an existing mentor profile
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editExperience, setEditExperience] = useState<string>('4 Years');
  const [editAvailability, setEditAvailability] = useState<'Full-time' | 'Part-time' | 'Weekends Only' | 'On-demand'>('Full-time');
  const [editPerformance, setEditPerformance] = useState<'Outstanding' | 'Exceeding' | 'Meeting' | 'Needs Review'>('Exceeding');
  const [editSubjects, setEditSubjects] = useState<string[]>(['Mathematics']);
  const [editShowSubjectsDropdown, setEditShowSubjectsDropdown] = useState<boolean>(false);
  const [editRating, setEditRating] = useState<string>('5.0');

  // Initialize edit states when selected mentor changes
  useEffect(() => {
    if (selectedMentorProfile) {
      setEditExperience(selectedMentorProfile.experience);
      setEditAvailability(selectedMentorProfile.availability);
      setEditPerformance(selectedMentorProfile.performance);
      setEditSubjects(selectedMentorProfile.subjects);
      setEditShowSubjectsDropdown(false);
      setEditRating(selectedMentorProfile.rating.toString());
      setIsEditing(false);
    }
  }, [selectedMentorProfile]);

  const handleEditMentorSubmit = async () => {
    if (!selectedMentorProfile || !currentUser) return;
    if (!canUpdate) {
      alert('Action Denied: You do not have permissions to update mentors.');
      return;
    }
    if (editSubjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }

    const parsedRating = parseFloat(editRating) || 0.0;

    const { error } = await supabase
      .from('mentors')
      .update({
        experience: editExperience,
        availability: editAvailability,
        performance: editPerformance,
        subjects: editSubjects,
        rating: parsedRating
      })
      .eq('id', selectedMentorProfile.id);

    if (error) {
      console.error(error);
      alert('Error updating mentor: ' + error.message);
      return;
    }

    setData((prev) =>
      prev.map((m) =>
        m.id === selectedMentorProfile.id
          ? {
              ...m,
              experience: editExperience,
              availability: editAvailability,
              performance: editPerformance,
              subjects: editSubjects,
              rating: parsedRating
            }
          : m
      )
    );

    setSelectedMentorProfile((prev) =>
      prev
        ? {
            ...prev,
            experience: editExperience,
            availability: editAvailability,
            performance: editPerformance,
            subjects: editSubjects,
            rating: parsedRating
          }
        : null
    );

    setToastMessage(`Mentor "${selectedMentorProfile.name}" updated successfully!`);
    setShowToast(true);
    setIsEditing(false);

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Form states for creating a new mentor
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Others' | ''>('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formSubjects, setFormSubjects] = useState<string[]>(['Mathematics']);
  const [formExperience, setFormExperience] = useState('4 Years');
  const [formAvailability, setFormAvailability] = useState<'Full-time' | 'Part-time' | 'Weekends Only' | 'On-demand'>('Full-time');
  const [formPerformance, setFormPerformance] = useState<'Outstanding' | 'Exceeding' | 'Meeting' | 'Needs Review'>('Exceeding');
  const [formRating, setFormRating] = useState<string>('5.0');

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
    }
  }, [selectedOrg]);

  const handleAddMentorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!formName.trim() || !formEmail.trim()) {
      alert('Please enter a mentor name and email');
      return;
    }
    if (!formPhone.trim()) {
      alert('Please enter a phone number');
      return;
    }
    if (!formGender) {
      alert('Please select a gender');
      return;
    }
    if (!formPassword.trim()) {
      alert('Please enter a password');
      return;
    }
    if (formSubjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }
    if (!canCreate) {
      alert('Action Denied: You do not have permissions to add mentors.');
      return;
    }

    const resolvedOrg = currentUser.role === 'Super Admin'
      ? (selectedOrg === 'All Organizations' ? formOrg : selectedOrg)
      : currentUser.organization;

    if (!resolvedOrg) {
      alert('Please select an organization');
      return;
    }

    const newUserId = `usr-${Date.now()}`;
    const hashedPassword = await hashPassword(formPassword);

    let uploadedAvatarUrl = '';

    if (formAvatarFile) {
      try {
        const fileExt = formAvatarFile.name.split('.').pop();
        const fileName = `avatar-${Date.now()}.${fileExt}`;
        const filePath = fileName;

        try {
          await supabase.storage.createBucket('avatars', { public: true });
        } catch (bucketErr) {
          console.log('Bucket check/creation failed:', bucketErr);
        }

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, formAvatarFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadErr) {
          console.warn('Supabase storage upload error, falling back to Base64:', uploadErr.message);
          uploadedAvatarUrl = await toBase64(formAvatarFile);
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          uploadedAvatarUrl = publicUrl;
        }
      } catch (err: any) {
        console.error('Storage error, falling back to Base64:', err);
        try {
          uploadedAvatarUrl = await toBase64(formAvatarFile);
        } catch (base64Err) {
          console.error('Base64 fallback failed:', base64Err);
        }
      }
    }

    const newUser: User = {
      id: newUserId,
      name: formName,
      email: formEmail,
      role: 'Mentor',
      organization: resolvedOrg,
      status: 'Active',
      avatar: uploadedAvatarUrl,
      createdDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      number: formPhone,
      gender: formGender as 'Male' | 'Female' | 'Others',
      password: hashedPassword
    };

    const { error: userError } = await supabase.from('users').insert([newUser]);
    if (userError) {
      console.error(userError);
      alert('Error creating user profile: ' + userError.message);
      return;
    }

    const parsedRating = parseFloat(formRating) || 5.0;

    const newMentor: Mentor = {
      id: `ment-${Date.now()}`,
      name: formName,
      email: formEmail,
      phone: formPhone,
      gender: formGender as 'Male' | 'Female' | 'Others',
      subjects: formSubjects,
      studentsAssigned: [],
      experience: formExperience,
      rating: parsedRating,
      availability: formAvailability,
      upcomingSessions: 0,
      performance: formPerformance,
      avatar: uploadedAvatarUrl,
      organization: resolvedOrg
    };

    const { error } = await supabase.from('mentors').insert([newMentor]);
    if (error) {
      console.error(error);
      alert('Error adding mentor: ' + error.message);
      // Rollback user if mentor creation fails
      await supabase.from('users').delete().eq('id', newUserId);
      return;
    }

    setData((prev) => [newMentor, ...prev]);
    setToastMessage(`Mentor "${formName}" added to faculty successfully!`);
    setShowToast(true);
    setShowAddMentorModal(false);

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Subjects list compiled from all mentors
  const allSubjects = Array.from(new Set(data.flatMap((m) => m.subjects)));

  const filteredMentors = data.filter((mentor) => {
    const matchesSearch = mentor.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || mentor.subjects.includes(subjectFilter);
    const matchesAvail = availabilityFilter === 'All' || mentor.availability === availabilityFilter;
    return matchesSearch && matchesSubject && matchesAvail;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Mentor Faculty</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Manage tutors, verify experience ratings, view active allocations and availability</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowAddMentorModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Mentor</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search mentors by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Subjects</option>
            {allSubjects.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          {/* Availability Filter */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Availabilities</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Weekends Only">Weekends Only</option>
            <option value="On-demand">On-demand</option>
          </select>
        </div>
      </div>

      {/* Mentor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((mentor, idx) => (
          <motion.div
            key={mentor.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: idx * 0.03 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
          >
            {/* Inner Header / Photo Banner */}
            <div className="p-4 border-b border-slate-50 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-900/10">
              <div className="flex gap-3">
                {mentor.avatar ? (
                  <img
                    src={mentor.avatar}
                    alt={mentor.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow-md group-hover:scale-102 transition-transform shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 ring-2 ring-white shadow-md group-hover:scale-102 transition-transform shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-555 font-extrabold text-lg select-none">
                    {mentor.name.trim().charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-sm truncate flex items-center gap-1.5">
                    <span>{mentor.name}</span>
                    {mentor.rating >= 4.9 && (
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" title="Top Rated Faculty" />
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 truncate">{mentor.email}</p>
                  
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{mentor.rating.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 font-medium ml-1">Rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle body info */}
            <div className="p-4 space-y-3 flex-1">
              {/* Subjects tags */}
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Teaches</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {mentor.subjects.map((sub) => (
                    <span key={sub} className="text-[10px] font-semibold bg-blue-50/60 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-md">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assignments / Metrics */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750/30">
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block">Experience</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                    {mentor.experience}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block">Assigned Students</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-teal-500" />
                    {mentor.studentsAssigned.length} Students
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{mentor.availability}</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  mentor.performance === 'Outstanding'
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                    : mentor.performance === 'Exceeding'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                    : mentor.performance === 'Needs Review'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-750/50'
                }`}>
                  {mentor.performance}
                </span>
              </div>
            </div>

            {/* Footer action */}
            <div className="p-3.5 border-t border-slate-50 dark:border-slate-750/30 bg-slate-50/20 dark:bg-slate-900/10 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono">ID: {mentor.id.toUpperCase()}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMentorProfile(mentor)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                >
                  Profile
                </button>
                <button
                  onClick={() => setSelectedMentorSchedules(mentor)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Schedules</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredMentors.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 font-semibold">
            No mentors matching current filters.
          </div>
        )}
      </div>

      {/* Toast Alert */}
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

      {/* Mentor Profile Modal */}
      <AnimatePresence>
        {selectedMentorProfile && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMentorProfile(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
              >
                {/* Header Banner */}
                <div className="bg-slate-900 text-white p-6 relative">
                  <button
                    onClick={() => setSelectedMentorProfile(null)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                  <div className="flex gap-4 items-center">
                    {selectedMentorProfile.avatar ? (
                      <img
                        src={selectedMentorProfile.avatar}
                        alt={selectedMentorProfile.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover ring-2 ring-white/30"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-700 ring-2 ring-white/30 flex items-center justify-center text-slate-300 font-extrabold text-xl select-none">
                        {selectedMentorProfile.name.trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black tracking-tight">{selectedMentorProfile.name}</h2>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                          selectedMentorProfile.performance === 'Outstanding'
                            ? 'bg-green-500/25 text-green-300'
                            : 'bg-blue-500/25 text-blue-300'
                        }`}>
                          {selectedMentorProfile.performance}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{selectedMentorProfile.email} • ID: {selectedMentorProfile.id.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
                {/* Profile details body */}
                <div className="p-6 space-y-5 text-xs max-h-[65vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Teaching Experience</span>
                      {isEditing ? (
                        <select
                          value={editExperience}
                          onChange={(e) => setEditExperience(e.target.value)}
                          className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                        >
                          {Array.from({ length: 20 }, (_, i) => {
                            const years = i + 1;
                            const label = `${years} Year${years > 1 ? 's' : ''}`;
                            return (
                              <option key={label} value={label}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <strong className="text-sm font-black text-slate-700 dark:text-slate-200 mt-1 block">{selectedMentorProfile.experience}</strong>
                      )}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Performance Index (Rating)</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                          <input
                            type="number"
                            min="1.0"
                            max="5.0"
                            step="0.1"
                            value={editRating}
                            onChange={(e) => setEditRating(e.target.value)}
                            className="w-full p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none text-xs font-bold font-mono"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <strong className="text-sm font-black text-slate-700 dark:text-slate-200">{selectedMentorProfile.rating.toFixed(2)}</strong>
                          <span className="text-[10px] text-slate-400">/ 5.0 Rating</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Performance Category</span>
                      <select
                        value={editPerformance}
                        onChange={(e) => setEditPerformance(e.target.value as any)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="Outstanding">Outstanding</option>
                        <option value="Exceeding">Exceeding</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Needs Review">Needs Review</option>
                      </select>
                    </div>
                  )}

                  {/* Teaches Subjects */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Teaches Subjects</span>
                    {isEditing ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => setEditShowSubjectsDropdown(!editShowSubjectsDropdown)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 flex items-center justify-between text-left cursor-pointer"
                        >
                          <span className="truncate pr-2">
                            {editSubjects.length === 0 ? "Select subjects..." : editSubjects.join(', ')}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${editShowSubjectsDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {editShowSubjectsDropdown && (
                          <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
                            {['Mathematics', 'Physics', 'Organic Chemistry', 'English Literature', 'Computer Science', 'Urdu Grammar'].map((sub) => {
                              const isChecked = editSubjects.includes(sub);
                              return (
                                <label key={sub} className="flex items-center gap-2 cursor-pointer py-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setEditSubjects(editSubjects.filter((s) => s !== sub));
                                      } else {
                                        setEditSubjects([...editSubjects, sub]);
                                      }
                                    }}
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                                  />
                                  <span className="text-xs">{sub}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMentorProfile.subjects.map((sub) => (
                          <span key={sub} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-300 font-bold rounded-lg border border-blue-100/40 dark:border-blue-800/40">
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Allocated Students */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Assigned Students ({selectedMentorProfile.studentsAssigned.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMentorProfile.studentsAssigned.map((stud) => (
                        <span key={stud} className="px-2.5 py-1 bg-teal-50 dark:bg-teal-900/25 text-teal-600 dark:text-teal-300 font-bold rounded-lg border border-teal-100/40 dark:border-teal-850/40">
                          {stud}
                        </span>
                      ))}
                      {selectedMentorProfile.studentsAssigned.length === 0 && (
                        <span className="text-slate-400 italic font-medium">No students allocated yet.</span>
                      )}
                    </div>
                  </div>

                  {/* Availability Window */}
                  <div className="p-3 bg-slate-50/60 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/60 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Availability Window</span>
                    {isEditing ? (
                      <select
                        value={editAvailability}
                        onChange={(e) => setEditAvailability(e.target.value as any)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Weekends Only">Weekends Only</option>
                        <option value="On-demand">On-demand</option>
                      </select>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-extrabold text-xs">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>{selectedMentorProfile.availability}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleEditMentorSubmit}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {canUpdate && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          Edit Details
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const mentor = selectedMentorProfile;
                          setSelectedMentorProfile(null);
                          setSelectedMentorSchedules(mentor);
                        }}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
                      >
                        View Schedules
                      </button>
                      <button
                        onClick={() => setSelectedMentorProfile(null)}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Mentor Schedules Modal */}
      <AnimatePresence>
        {selectedMentorSchedules && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMentorSchedules(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
              >
                {/* Header */}
                <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <h2 className="text-sm font-black tracking-tight">{selectedMentorSchedules.name}'s Class Schedule</h2>
                      <p className="text-[10px] text-slate-400">Real-time schedule allocation logs</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMentorSchedules(null)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body lists of matching sessions */}
                <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto text-xs">
                  {mockSessions
                    .filter(s => s.mentor.toLowerCase() === selectedMentorSchedules.name.toLowerCase())
                    .map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <strong className="text-slate-800 dark:text-slate-200 block truncate">{sess.notes}</strong>
                          <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400 mt-1 font-medium">
                            <span className="text-blue-500 font-bold">Student: {sess.student}</span>
                            <span>•</span>
                            <span>{sess.date}</span>
                            <span>•</span>
                            <span>{sess.time}</span>
                            <span>•</span>
                            <span>Duration: {sess.duration}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold ${
                          sess.status === 'Completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                            : sess.status === 'Upcoming'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                        }`}>
                          {sess.status}
                        </span>
                      </div>
                    ))}

                  {mockSessions.filter(s => s.mentor.toLowerCase() === selectedMentorSchedules.name.toLowerCase()).length === 0 && (
                    <div className="text-center py-8 text-slate-400 italic font-medium">
                      No sessions currently scheduled for this tutor.
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedMentorSchedules(null)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Close Schedule
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Mentor Modal */}
      <AnimatePresence>
        {showAddMentorModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMentorModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
              >
                {/* Header */}
                <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black tracking-tight flex items-center gap-1.5">
                      <Users className="w-4.5 h-4.5" />
                      <span>Appoint New Faculty Mentor</span>
                    </h2>
                    <p className="text-[10px] text-blue-100 mt-0.5">Appoint credentialed tutors and verify qualifications</p>
                  </div>
                  <button
                    onClick={() => setShowAddMentorModal(false)}
                    className="p-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleAddMentorSubmit}>
                  <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
                    {/* Image Uploader */}
                    <div className="flex flex-col items-center justify-center pb-2 border-b border-slate-100 dark:border-slate-750">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Mentor Avatar</label>
                      <div className="relative group cursor-pointer">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 transition-colors flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative shadow-inner">
                          {formAvatarPreview ? (
                            <img src={formAvatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-550 p-2 text-center">
                              <Plus className="w-6 h-6 mb-0.5" />
                              <span className="text-[9px] font-bold">Upload</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                        {formAvatarPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
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

                    {currentUser?.role === 'Super Admin' && selectedOrg === 'All Organizations' && (
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Affiliated Organization</label>
                        <select
                          required
                          value={formOrg}
                          onChange={(e) => setFormOrg(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Mentor Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter mentor's full name"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Professional Email</label>
                        <div className="relative">
                          <Mail className="absolute inset-y-0 left-2.5 h-3.5 w-3.5 my-auto text-slate-400 pointer-events-none" />
                          <input
                            type="email"
                            required
                            placeholder="Enter professional email"
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          placeholder="Enter phone number"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Gender</label>
                        <select
                          required
                          value={formGender}
                          onChange={(e) => setFormGender(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="" disabled>Select gender...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Experience Years</label>
                        <select
                          value={formExperience}
                          onChange={(e) => setFormExperience(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          {Array.from({ length: 20 }, (_, i) => {
                            const years = i + 1;
                            const label = `${years} Year${years > 1 ? 's' : ''}`;
                            return (
                              <option key={label} value={label}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Availability Window</label>
                        <select
                          value={formAvailability}
                          onChange={(e) => setFormAvailability(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Weekends Only">Weekends Only</option>
                          <option value="On-demand">On-demand</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Initial Performance Category</label>
                        <select
                          value={formPerformance}
                          onChange={(e) => setFormPerformance(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Outstanding">Outstanding</option>
                          <option value="Exceeding">Exceeding</option>
                          <option value="Meeting">Meeting</option>
                          <option value="Needs Review">Needs Review</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Teaches Subjects</label>
                        <button
                          type="button"
                          onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 flex items-center justify-between text-left cursor-pointer"
                        >
                          <span className="truncate pr-2">
                            {formSubjects.length === 0 ? "Select subjects..." : formSubjects.join(', ')}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${showSubjectDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showSubjectDropdown && (
                          <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
                            {['Mathematics', 'Physics', 'Organic Chemistry', 'English Literature', 'Computer Science', 'Urdu Grammar'].map((sub) => {
                              const isChecked = formSubjects.includes(sub);
                              return (
                                <label key={sub} className="flex items-center gap-2 cursor-pointer py-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setFormSubjects(formSubjects.filter((s) => s !== sub));
                                      } else {
                                        setFormSubjects([...formSubjects, sub]);
                                      }
                                    }}
                                    className="w-3.5 h-3.5 rounded border-slate-305 text-blue-600 focus:ring-blue-500/20"
                                  />
                                  <span className="text-xs">{sub}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="Enter password for login"
                            value={formPassword}
                            onChange={(e) => setFormPassword(e.target.value)}
                            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-slate-450 hover:text-slate-650 dark:hover:text-slate-300 transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Initial Rating</label>
                        <input
                          type="number"
                          required
                          min="1.0"
                          max="5.0"
                          step="0.1"
                          placeholder="e.g. 5.0"
                          value={formRating}
                          onChange={(e) => setFormRating(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddMentorModal(false)}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all cursor-pointer"
                    >
                      Appoint Mentor
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
