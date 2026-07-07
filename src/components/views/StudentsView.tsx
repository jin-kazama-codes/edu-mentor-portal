/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  BookOpen,
  UserCheck,
  Percent,
  Calendar,
  AlertCircle,
  Plus,
  Compass,
  Smile,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  HeartHandshake,
  X,
  CheckCircle,
  Clock,
  User,
  Users,
  UserMinus,
  Mail,
  Phone,
  Upload,
  Camera
} from 'lucide-react';
import { students as initialStudents, sessions as mockSessions } from '../../data/mockData';
import { Student } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { hashPassword } from '../../utils/crypto';

interface StudentsViewProps {
  defaultAddOpen?: boolean;
  selectedOrg?: string;
  onNavigate?: (tab: string) => void;
  onEvaluate?: (studentName: string) => void;
}

export default function StudentsView({ 
  defaultAddOpen = false, 
  selectedOrg = 'All Organizations',
  onNavigate,
  onEvaluate
}: StudentsViewProps) {
  const { currentUser, hasPermission, logSecurityAudit } = useAuth();
  const [data, setData] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const canRead = hasPermission('User and Role Management', 'read') || currentUser?.role === 'Mentor' || currentUser?.role === 'Assistant';
  const canEditProgress = currentUser?.role === 'Mentor' || currentUser?.role === 'Assistant' || currentUser?.role === 'Super Admin' || currentUser?.role === 'Organization Admin';
  const canCreate = hasPermission('User and Role Management', 'create');
  const canUpdate = hasPermission('User and Role Management', 'update');
  const canDelete = hasPermission('User and Role Management', 'delete');

  useEffect(() => {
    if (!currentUser || !canRead) return;

    async function loadData() {
      console.log('[StudentsView] Loading for role:', currentUser.role, 'email:', currentUser.email, 'mentor_id:', currentUser.mentor_id, 'mentorName:', currentUser.mentorName);
      
      let query = supabase.from('students').select('*').order('created_at', { ascending: false });
      
      // Enforce organization boundaries
      const orgToFilter = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
        : currentUser.organization;
      console.log('[StudentsView] orgToFilter:', orgToFilter);
      if (orgToFilter) {
        query = query.eq('organization', orgToFilter);
      }

      // Enforce Mentor assigned students boundary
      if (currentUser.role === 'Mentor') {
        query = query.eq('mentor', currentUser.name);
      }

      // Enforce Assistant attached mentor's students boundary
      if (currentUser.role === 'Assistant') {
        let mentorName = currentUser.mentorName;
        console.log('[StudentsView] Assistant mentorName from currentUser:', mentorName);
        
        // If mentorName wasn't resolved at login time, try to resolve it now
        if (!mentorName && currentUser.mentor_id) {
          const { data: resolvedName, error: rpc1Err } = await supabase
            .rpc('get_assistant_mentor_name', { assistant_mentor_id: currentUser.mentor_id });
          console.log('[StudentsView] RPC get_assistant_mentor_name result:', resolvedName, 'error:', rpc1Err?.message);
          if (resolvedName) {
            mentorName = resolvedName;
          }
        }
        // Fallback: try by email if still not found
        if (!mentorName) {
          const { data: resolvedByEmail, error: rpc2Err } = await supabase
            .rpc('get_mentor_name_for_assistant_email', { assistant_email: currentUser.email });
          console.log('[StudentsView] RPC get_mentor_name_for_assistant_email result:', resolvedByEmail, 'error:', rpc2Err?.message);
          if (resolvedByEmail) {
            mentorName = resolvedByEmail;
          }
        }
        
        console.log('[StudentsView] Final mentorName for assistant:', mentorName);
        if (mentorName) {
          query = query.eq('mentor', mentorName);
        }
        // If still no mentorName, org filter above already scopes to their org
      }

      const { data: stds, error } = await query;
      console.log('[StudentsView] Query result - count:', stds?.length, 'error:', error?.message, 'data:', stds);
      if (error) {
        console.error('StudentsView: Error loading students:', error.message);
      }
      if (!error && stds) {
        // Dynamic status check based on student attendance sheets
        const studentIds = stds.map((s) => s.id);
        let updatedStudents = [...stds];

        if (studentIds.length > 0) {
          const { data: attLogs, error: attErr } = await supabase
            .from('student_attendance')
            .select('student_id, status, date')
            .in('student_id', studentIds)
            .order('date', { ascending: false });

          if (!attErr && attLogs) {
            updatedStudents = stds.map((student) => {
              // Find latest non-Weekend attendance log for this student
              const latestLog = attLogs.find(
                (log) => log.student_id === student.id && log.status !== 'Weekend'
              );
              let dynamicStatus = student.status;

              if (latestLog) {
                if (latestLog.status === 'On Leave') {
                  dynamicStatus = 'On Leave';
                } else if (student.status === 'On Leave') {
                  dynamicStatus = 'Active';
                }
              } else if (student.status === 'On Leave') {
                dynamicStatus = 'Active';
              }

              return {
                ...student,
                status: dynamicStatus
              };
            });
          }
        }
        setData(updatedStudents);
      }
    }
    loadData();
  }, [currentUser, canRead, selectedOrg]);



  // Selected Student Details Modal state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Syllabus Progress editing state variables
  const [isEditingProgress, setIsEditingProgress] = useState<boolean>(false);
  const [editingProgressValue, setEditingProgressValue] = useState<number>(0);
  const [isSavingProgress, setIsSavingProgress] = useState<boolean>(false);

  useEffect(() => {
    if (selectedStudent) {
      setEditingProgressValue(selectedStudent.progress);
      setIsEditingProgress(false);
    }
  }, [selectedStudent]);

  const handleUpdateProgress = async () => {
    if (!selectedStudent || !currentUser) return;
    
    // Check permission to edit progress
    const canEditProgress = 
      currentUser.role === 'Mentor' || 
      currentUser.role === 'Assistant' || 
      currentUser.role === 'Super Admin' || 
      currentUser.role === 'Organization Admin';
      
    if (!canEditProgress) {
      alert('Action Denied: You do not have permissions to edit student progress.');
      return;
    }

    setIsSavingProgress(true);
    try {
      const { data: updatedData, error } = await supabase
        .from('students')
        .update({ progress: editingProgressValue })
        .eq('id', selectedStudent.id)
        .select();

      if (error) {
        throw error;
      }

      // Check if the update actually affected any rows (RLS policy check)
      if (!updatedData || updatedData.length === 0) {
        const sessionRes = await supabase.auth.getSession();
        const hasSession = !!sessionRes.data.session;
        
        alert(
          `RLS Write Restriction: The database rejected this update.\n\n` +
          `• Did you copy and run the SQL migration in your Supabase SQL Editor?\n` +
          `• Session status: ${hasSession ? 'Authenticated (' + sessionRes.data.session?.user?.email + ')' : 'Anonymous (Local Mock Auth)'}`
        );
        setIsEditingProgress(false);
        return;
      }

      await logSecurityAudit(
        'Update Student Syllabus Progress Successful',
        'Info',
        `Updated student "${selectedStudent.name}" [ID: ${selectedStudent.id}] syllabus progress to ${editingProgressValue}%.`
      );

      // Update data state for list and dashboard sync
      setData(prev => 
        prev.map(s => 
          s.id === selectedStudent.id 
            ? { ...s, progress: editingProgressValue } 
            : s
        )
      );

      // Update modal display state
      setSelectedStudent(prev => prev ? { ...prev, progress: editingProgressValue } : null);

      setToastMessage(`Syllabus progress updated to ${editingProgressValue}% for ${selectedStudent.name}`);
      setShowToast(true);
      setIsEditingProgress(false);

      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error updating student progress:', err);
      alert('Error updating progress: ' + (err.message || err));
    } finally {
      setIsSavingProgress(false);
    }
  };

  useEffect(() => {
    if (defaultAddOpen) {
      setShowAddStudentModal(true);
    }
  }, [defaultAddOpen]);

  // Mentors from the same organization (for the Assigned Mentor dropdown)
  const [orgMentors, setOrgMentors] = useState<{ id: string; name: string }[]>([]);
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
    async function loadOrgMentors() {
      const orgToFilter = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? formOrg : selectedOrg)
        : currentUser.organization;

      if (!orgToFilter) {
        setOrgMentors([]);
        setFormMentor('');
        return;
      }

      let q = supabase.from('mentors').select('id, name').order('name');
      q = q.eq('organization', orgToFilter);
      const { data: mnts } = await q;
      if (mnts) {
        setOrgMentors(mnts);
        if (mnts.length > 0) {
          setFormMentor(mnts[0].name);
        } else {
          setFormMentor('');
        }
      } else {
        setOrgMentors([]);
        setFormMentor('');
      }
    }
    loadOrgMentors();
  }, [currentUser, selectedOrg, formOrg]);

  // Form states for creating a new student
  const todayFormatted = () => {
    const d = new Date();
    return d.toISOString().split('T')[0]; // yyyy-mm-dd
  };

  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState(16);
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formGender, setFormGender] = useState<'Male' | 'Female' | 'Others' | ''>('');
  const [formGrade, setFormGrade] = useState('11th Grade');
  const [formMentor, setFormMentor] = useState('');
  const [formGuardian, setFormGuardian] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'On Leave' | 'Graduated' | 'Suspended'>('Active');
  const [formProgress, setFormProgress] = useState(0);
  const [formAttendance, setFormAttendance] = useState(0);
  const [formSessionDate, setFormSessionDate] = useState(todayFormatted());
  const [formSessionTopic, setFormSessionTopic] = useState('');
  const [formAvatarPreview, setFormAvatarPreview] = useState<string>('');
  const [formAvatarUrl, setFormAvatarUrl] = useState<string>('');
  const avatarFileRef = React.useRef<HTMLInputElement>(null);

  // Handle avatar file selection → convert to data URL for preview + storage
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setFormAvatarPreview(result);
      setFormAvatarUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formGuardian.trim() || !currentUser) return;
    if (!canCreate) {
      alert('Action Denied: You do not have permissions to enroll new students.');
      return;
    }

    const resolvedOrg = currentUser.role === 'Super Admin'
      ? (selectedOrg === 'All Organizations' ? formOrg : selectedOrg)
      : currentUser.organization;

    if (!resolvedOrg) {
      alert('Please select an organization');
      return;
    }
    const orgDomain = resolvedOrg.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + '.com';
    // Use user-provided email or auto-generate one as fallback
    const email = formEmail.trim() || `${formName.toLowerCase().trim().replace(/\s+/g, '.')}@${orgDomain}`;
    // Use uploaded avatar or a default placeholder
    const avatarToSave = formAvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formName)}&background=6366f1&color=fff&size=150`;

    // Generate org-unique student ID: e.g. BFA-2026-00143
    const orgPrefix = resolvedOrg
      .split(' ')
      .map((w: string) => w.charAt(0).toUpperCase())
      .join('');
    const uniqueNum = Date.now().toString().slice(-5);
    const studentId = `${orgPrefix}-${new Date().getFullYear()}-${uniqueNum}`;

    // Hash the password and create the login record in public.users table
    const hashedPassword = await hashPassword(formPassword.trim() || 'Password123!');
    const newUserId = `usr-${Date.now()}`;
    const newUser = {
      id: newUserId,
      name: formName,
      email,
      role: 'Student',
      organization: resolvedOrg,
      status: 'Active',
      avatar: avatarToSave,
      createdDate: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      number: formPhone.trim() || undefined,
      gender: formGender as 'Male' | 'Female' | 'Others' || undefined,
      password: hashedPassword
    };

    const { error: userError } = await supabase.from('users').insert([newUser]);
    if (userError) {
      console.error(userError);
      alert('Error creating user profile: ' + userError.message);
      return;
    }

    // Build upcoming session string from date + topic
    const sessionDateLabel = formSessionDate
      ? new Date(formSessionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const upcomingSession = formSessionTopic.trim()
      ? `${sessionDateLabel} - ${formSessionTopic.trim()}`
      : sessionDateLabel || 'TBD';

    const newStudent: Student = {
      id: studentId,
      name: formName,
      email,
      phone: formPhone.trim() || undefined,
      gender: (formGender as 'Male' | 'Female' | 'Others') || undefined,
      age: Number(formAge),
      grade: formGrade,
      mentor: formMentor,
      guardian: formGuardian,
      progress: Number(formProgress),
      attendance: Number(formAttendance),
      upcomingSession,
      status: formStatus,
      avatar: avatarToSave,
      organization: resolvedOrg
    };

    const { error } = await supabase.from('students').insert([newStudent]);
    if (error) {
      console.error(error);
      alert('Error enrolling student: ' + error.message);
      // Rollback user creation
      await supabase.from('users').delete().eq('id', newUserId);
      return;
    }

    await logSecurityAudit(
      'Enroll Student Successful',
      'Info',
      `Enrolled student "${formName}" (${email}) in organization "${resolvedOrg}" [ID: ${studentId}], assigned to Mentor "${formMentor}".`
    );

    setData((prev) => [newStudent, ...prev]);
    setToastMessage(`Student "${formName}" enrolled — ID: ${studentId}`);
    setShowToast(true);
    setShowAddStudentModal(false);

    // Reset form states
    setFormName('');
    setFormAge(16);
    setFormPhone('');
    setFormEmail('');
    setFormPassword('');
    setFormGender('');
    setFormGrade('11th Grade');
    setFormMentor(orgMentors.length > 0 ? orgMentors[0].name : '');
    setFormGuardian('');
    setFormStatus('Active');
    setFormProgress(0);
    setFormAttendance(0);
    setFormSessionDate(todayFormatted());
    setFormSessionTopic('');
    setFormAvatarPreview('');
    setFormAvatarUrl('');
    if (avatarFileRef.current) avatarFileRef.current.value = '';

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Compile available grades dynamically
  const allGrades = Array.from(new Set(data.map((s) => s.grade))).sort();

  const filteredStudents = data.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.mentor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'All' || student.grade === gradeFilter;
    const matchesStatus = statusFilter === 'All' || student.status === statusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center font-sans">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Security Access Violation</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          You do not hold the required authorization credentials to view the student cohorts.
        </p>
      </div>
    );
  }

  // Calculate dynamic cohort aggregates
  const totalCohortSize = data.length;
  const avgAttendance = data.length > 0 
    ? Math.round(data.reduce((sum, s) => sum + (s.attendance || 0), 0) / data.length) 
    : 0;
  const avgProgress = data.length > 0 
    ? Math.round(data.reduce((sum, s) => sum + (s.progress || 0), 0) / data.length) 
    : 0;
  const onLeaveCount = data.filter(s => s.status === 'On Leave').length;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Active Student Cohorts</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Track individual progress metrics, academic achievements, attendance trends, and assignments</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        )}
      </div>

      {/* Cohort Aggregates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Cohort Size */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-blue-600 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">Total Cohort Size</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white leading-none block">{totalCohortSize}</span>
            <span className="text-[9px] text-blue-500 font-bold block">Enrolled Students</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 2: Avg Attendance */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-teal-500 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">Average Attendance</span>
            <span className="text-2xl font-black text-teal-600 dark:text-teal-400 leading-none block">{avgAttendance}%</span>
            <span className="text-[9px] text-teal-500 font-bold block">Monthly Attendance Avg</span>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
            <Percent className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 3: Academic Progress */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-indigo-600 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">Academic Progress</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none block">{avgProgress}%</span>
            <span className="text-[9px] text-indigo-500 font-bold block">Average Syllabus Index</span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
        </motion.div>

        {/* Card 4: On Leave */}
        <motion.div
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-l-amber-500 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold tracking-wider block">On Leave Tutees</span>
            <span className="text-2xl font-black text-amber-550 dark:text-amber-405 leading-none block">{onLeaveCount}</span>
            <span className="text-[9px] text-amber-500 font-bold block">Currently On Leave</span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <UserMinus className="w-5 h-5" />
          </div>
        </motion.div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-3 h-4 w-4 my-auto text-slate-400" />
          <input
            type="text"
            placeholder="Search students by name, mentor..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {/* Grade Filter */}
          <select
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Grades</option>
            {allGrades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Graduated">Graduated</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentStudents.map((stud, idx) => {
          // Dynamic status ring colors
          const statusRingColor = 
            stud.status === 'Active'
              ? 'ring-2 ring-emerald-500/50 dark:ring-emerald-400/50'
              : stud.status === 'On Leave'
              ? 'ring-2 ring-amber-500/50 dark:ring-amber-400/50'
              : stud.status === 'Graduated'
              ? 'ring-2 ring-blue-500/50 dark:ring-blue-400/50'
              : 'ring-2 ring-rose-500/50 dark:ring-rose-400/50';

          // Dynamic performance label
          const attendancePerformance = 
            stud.attendance >= 90 ? { label: 'Excellent', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' } :
            stud.attendance >= 75 ? { label: 'Satisfactory', color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' } :
            { label: 'Warning', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' };

          const progressPerformance = 
            stud.progress >= 80 ? { label: 'Advanced', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' } :
            stud.progress >= 50 ? { label: 'On Track', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' } :
            { label: 'Beginning', color: 'text-slate-500 bg-slate-50 dark:bg-slate-900/50' };

          return (
            <motion.div
              key={stud.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.3, delay: idx * 0.02 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-blue-500/5 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 group"
            >
              {/* Header profile info */}
              <div className="p-4.5 border-b border-slate-100/60 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex gap-3 min-w-0">
                  <img
                    src={stud.avatar}
                    alt={stud.name}
                    referrerPolicy="no-referrer"
                    className={`w-11 h-11 rounded-xl object-cover shrink-0 ${statusRingColor}`}
                  />
                  <div className="min-w-0 flex flex-col justify-center">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-xs truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{stud.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{stud.grade} • Age {stud.age}</p>
                  </div>
                </div>
                
                {/* Status pill with pulsing dot */}
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold leading-none ${
                  stud.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/25 dark:text-emerald-400'
                    : stud.status === 'On Leave'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/25 dark:text-amber-400'
                    : stud.status === 'Graduated'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/25 dark:text-blue-400'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/25 dark:text-rose-450'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    stud.status === 'Active' ? 'bg-emerald-500 animate-pulse' :
                    stud.status === 'On Leave' ? 'bg-amber-500 animate-pulse' :
                    stud.status === 'Graduated' ? 'bg-blue-500' : 'bg-rose-500'
                  }`} />
                  {stud.status}
                </span>
              </div>

              {/* Metrics Info */}
              <div className="p-4.5 space-y-4 flex-1">
                {/* Progress Bar & Attendance Bar */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
                      <span className="flex items-center gap-1.5 text-slate-450"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Syllabus Progress</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase ${progressPerformance.color}`}>{progressPerformance.label}</span>
                        <span className="font-mono text-slate-700 dark:text-slate-350">{stud.progress}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: `${stud.progress}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-[10px] font-bold mb-1.5">
                      <span className="flex items-center gap-1.5 text-slate-450"><Smile className="w-3.5 h-3.5 text-teal-500" /> Attendance Rate</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-wide uppercase ${attendancePerformance.color}`}>{attendancePerformance.label}</span>
                        <span className="font-mono text-slate-700 dark:text-slate-350">{stud.attendance}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full" style={{ width: `${stud.attendance}%` }} />
                    </div>
                  </div>
                </div>

                {/* Assignments / Allocations */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50/65 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase font-extrabold text-slate-400 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-blue-500 shrink-0" /> Assigned Mentor
                    </span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200 truncate block mt-0.5" title={stud.mentor}>{stud.mentor}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] uppercase font-extrabold text-slate-400 flex items-center gap-1">
                      <HeartHandshake className="w-3 h-3 text-pink-500 shrink-0" /> Guardian / Contact
                    </span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-200 truncate block mt-0.5" title={stud.guardian}>{stud.guardian}</span>
                  </div>
                </div>

                {/* Upcoming Slot description */}
                <div className="flex gap-2.5 items-center text-[10px] bg-blue-50/40 dark:bg-blue-950/10 p-2.5 rounded-xl border border-blue-100/30 dark:border-blue-900/20 text-slate-650 dark:text-slate-350">
                  <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[8px] block">Next Scheduled Class</span>
                    <p className="truncate font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{stud.upcomingSession}</p>
                  </div>
                </div>
              </div>

              {/* Footer triggers */}
              <div className="p-3.5 bg-slate-50/40 dark:bg-slate-900/20 border-t border-slate-100/80 dark:border-slate-850/80 flex items-center justify-between gap-2">
                <span className="text-[9px] text-slate-400 font-mono tracking-wider">ID: {stud.id.toUpperCase()}</span>
                <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onEvaluate) {
                      onEvaluate(stud.name);
                    } else if (onNavigate) {
                      onNavigate('evaluations');
                    } else {
                      setSelectedStudent(stud);
                    }
                  }}
                  className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-300 rounded-lg text-[10px] font-semibold transition-all cursor-pointer"
                >
                  Evaluations
                </button>
                <button
                  onClick={() => setSelectedStudent(stud)}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-semibold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
        {filteredStudents.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 font-semibold">
            No students matching current filters found.
          </div>
        )}
      </div>

      {/* Pagination component */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-3 flex items-center justify-between shadow-sm">
          <span className="text-[11px] font-medium text-slate-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent shrink-0 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-150 text-slate-600 dark:text-slate-300'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent shrink-0 rounded-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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

      {/* Student Profile Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
              >
                {/* Header Banner */}
                <div className="bg-slate-900 text-white p-6 relative">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                  <div className="flex gap-4 items-center">
                    <img
                      src={selectedStudent.avatar}
                      alt={selectedStudent.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover ring-2 ring-white/30"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black tracking-tight">{selectedStudent.name}</h2>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                          selectedStudent.status === 'Active'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {selectedStudent.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{selectedStudent.grade} • Age {selectedStudent.age} • Student Portal Dossier</p>
                    </div>
                  </div>
                </div>

                {/* Main Content (Tabs / Panels) */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Performance Indicators */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/40 dark:border-blue-900/20 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Academic Progress</span>
                          {canEditProgress && !isEditingProgress && (
                            <button
                              onClick={() => {
                                setEditingProgressValue(selectedStudent.progress);
                                setIsEditingProgress(true);
                              }}
                              className="px-2 py-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md transition-all cursor-pointer flex items-center gap-1 text-[9px] font-bold border border-blue-200/50 dark:border-blue-800/50"
                              title="Edit progress"
                            >
                              Edit Progress
                            </button>
                          )}
                        </div>
                        
                        {isEditingProgress ? (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400">
                              <span>New Progress:</span>
                              <span className="font-mono text-[11px] bg-blue-100 dark:bg-blue-950 px-1.5 py-0.5 rounded">{editingProgressValue}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={editingProgressValue}
                              onChange={(e) => setEditingProgressValue(Number(e.target.value))}
                              disabled={isSavingProgress}
                              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-end gap-1.5 mt-2">
                              <button
                                type="button"
                                disabled={isSavingProgress}
                                onClick={() => setIsEditingProgress(false)}
                                className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSavingProgress}
                                onClick={handleUpdateProgress}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                              >
                                {isSavingProgress ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-xl font-black text-blue-600 dark:text-blue-400">{selectedStudent.progress}%</span>
                              <span className="text-[10px] text-slate-400">of Syllabus completed</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${selectedStudent.progress}%` }} />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100/40 dark:border-teal-900/20 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Attendance Rate</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-black text-teal-600 dark:text-teal-400">{selectedStudent.attendance}%</span>
                        <span className="text-[10px] text-slate-400">average attendance</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-teal-500 rounded-full" style={{ width: `${selectedStudent.attendance}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Student Allocations */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Allocated Staff & Family Contacts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Mentor Tutor</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200 mt-1 block">{selectedStudent.mentor}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Primary Educator</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Guardian / Parent</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200 mt-1 block">{selectedStudent.guardian}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Emergency Contact</span>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Next Class Slot</span>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200 mt-1 block truncate" title={selectedStudent.upcomingSession}>
                          {selectedStudent.upcomingSession}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Assigned Class Schedule</span>
                      </div>
                    </div>
                  </div>

                  {/* Matched Scheduled Sessions */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>Linked Sessions & Slabs ({
                        mockSessions.filter(s => s.student.toLowerCase() === selectedStudent.name.toLowerCase()).length
                      })</span>
                    </h3>
                    <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                      {mockSessions
                        .filter(s => s.student.toLowerCase() === selectedStudent.name.toLowerCase())
                        .map((sess, sidx) => (
                          <div
                            key={sess.id}
                            className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs gap-3"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{sess.notes}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5">{sess.date} • {sess.time} • Duration: {sess.duration}</p>
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
                      {mockSessions.filter(s => s.student.toLowerCase() === selectedStudent.name.toLowerCase()).length === 0 && (
                        <p className="text-xs text-slate-400 italic">No historical session nodes found for this student.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer close button */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Close Profile
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddStudentModal(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            />

            {/* Modal Body */}
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
                      <User className="w-4 h-4" />
                      <span>Enroll New Student Cohort</span>
                    </h2>
                    <p className="text-[10px] text-blue-100 mt-0.5">Assign academic parameters, mentors, and guardians</p>
                  </div>
                  <button
                    onClick={() => setShowAddStudentModal(false)}
                    className="p-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleAddStudentSubmit}>
                  <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">

                    {/* ── Avatar Uploader ── */}
                    <div className="flex items-center gap-4">
                      <div className="relative group shrink-0">
                        <div
                          onClick={() => avatarFileRef.current?.click()}
                          className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors group-hover:bg-blue-50/40 dark:group-hover:bg-blue-950/20"
                        >
                          {formAvatarPreview ? (
                            <img src={formAvatarPreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-slate-400">
                              <Camera className="w-6 h-6" />
                              <span className="text-[9px] font-bold">Photo</span>
                            </div>
                          )}
                        </div>
                        {formAvatarPreview && (
                          <button
                            type="button"
                            onClick={() => { setFormAvatarPreview(''); setFormAvatarUrl(''); if (avatarFileRef.current) avatarFileRef.current.value = ''; }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Student Photo</p>
                        <button
                          type="button"
                          onClick={() => avatarFileRef.current?.click()}
                          className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-[10px] font-semibold bg-slate-50 dark:bg-slate-900 cursor-pointer w-full"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {formAvatarPreview ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        <p className="text-[9px] text-slate-400 mt-1.5">
                          {formAvatarPreview ? (
                            <span className="text-green-500 font-semibold">✓ Photo ready to save</span>
                          ) : (
                            'JPG, PNG or GIF · Max 5MB · Optional'
                          )}
                        </p>
                        <input
                          ref={avatarFileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </div>
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

                    {/* ── Name & Age ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Student Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Faisal Ahmad"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Age</label>
                        <input
                          type="number"
                          required
                          min={5}
                          max={99}
                          value={formAge}
                          onChange={(e) => setFormAge(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    {/* ── Phone & Email ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="tel"
                            placeholder="e.g. +91 98765 43210"
                            value={formPhone}
                            onChange={(e) => setFormPhone(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="email"
                            placeholder={formName ? `${formName.toLowerCase().replace(/\s+/g, '.')}@...` : 'e.g. student@school.com'}
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ── Password ── */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Login Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Create student login password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    {/* ── Gender ── */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-2">Gender</label>
                      <div className="flex gap-2">
                        {(['Male', 'Female', 'Others'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setFormGender(formGender === g ? '' : g)}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-bold border-2 transition-all cursor-pointer ${
                              formGender === g
                                ? g === 'Male'
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                                  : g === 'Female'
                                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400'
                                  : 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            {g === 'Male' ? '♂ Male' : g === 'Female' ? '♀ Female' : '⚧ Others'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Grade Level</label>
                        <select
                          value={formGrade}
                          onChange={(e) => setFormGrade(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="11th Grade">11th Grade</option>
                          <option value="12th Grade">12th Grade</option>
                          <option value="10th Grade">10th Grade</option>
                          <option value="9th Grade">9th Grade</option>
                          <option value="College Freshman">College Freshman</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Primary Guardian</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tariq Ahmad (Father)"
                          value={formGuardian}
                          onChange={(e) => setFormGuardian(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Assigned Mentor</label>
                        <select
                          value={formMentor}
                          onChange={(e) => setFormMentor(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          {orgMentors.length === 0 ? (
                            <option value="">No mentors in this organization</option>
                          ) : (
                            orgMentors.map((m) => (
                              <option key={m.id} value={m.name}>{m.name}</option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Status</label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Active">Active</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Graduated">Graduated</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Initial Progress ({formProgress}%)</label>
                        <div className="mt-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={formProgress}
                            onChange={(e) => setFormProgress(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                            <span>0%</span><span className="font-bold text-blue-500">{formProgress}%</span><span>100%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Initial Attendance ({formAttendance}%)</label>
                        <div className="mt-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={formAttendance}
                            onChange={(e) => setFormAttendance(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-0.5">
                            <span>0%</span><span className="font-bold text-teal-500">{formAttendance}%</span><span>100%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Upcoming Session: Date + Topic split */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Upcoming Session Topic / Date</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] text-slate-400 font-semibold mb-1">Session Date</label>
                          <input
                            type="date"
                            value={formSessionDate}
                            onChange={(e) => setFormSessionDate(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] text-slate-400 font-semibold mb-1">Session Topic</label>
                          <input
                            type="text"
                            value={formSessionTopic}
                            onChange={(e) => setFormSessionTopic(e.target.value)}
                            placeholder="e.g. Derivative Integration"
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      {(formSessionDate || formSessionTopic) && (
                        <p className="mt-1.5 text-[10px] text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/40 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                          Preview: <span className="text-slate-600 dark:text-slate-300 font-semibold">
                            {formSessionDate ? new Date(formSessionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                            {formSessionTopic ? ` - ${formSessionTopic}` : ''}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowAddStudentModal(false)}
                      className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all cursor-pointer"
                    >
                      Enlist Student
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
