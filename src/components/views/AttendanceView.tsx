/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
  Loader2,
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Student, AttendanceStatus, StudentAttendance } from '../../types';

// Custom SVG Icons matching the mockup designs perfectly
const PresentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" className="stroke-emerald-500 fill-emerald-50/60 dark:fill-emerald-950/20" />
    <path d="m9 12 2 2 4-4" className="stroke-emerald-600 dark:stroke-emerald-400" />
  </svg>
);

const AbsentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" className="stroke-rose-500 fill-rose-50/60 dark:fill-rose-950/20" />
    <path d="m15 9-6 6M9 9l6 6" className="stroke-rose-600 dark:stroke-rose-400" />
  </svg>
);

const LeaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" className="stroke-amber-500 fill-amber-50/60 dark:fill-amber-950/20" />
    <path d="M10 15V9M14 15V9" className="stroke-amber-600 dark:stroke-amber-400" />
  </svg>
);

const FieldIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" className="stroke-purple-500 fill-purple-50/60 dark:fill-purple-950/20" />
    <path d="M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" className="stroke-purple-600 dark:stroke-purple-400" />
    <path d="M9 12h2l1 3 1.5-4 1.5 2 2-2" className="stroke-purple-600 dark:stroke-purple-400" />
    <path d="M8 21h8" className="stroke-purple-600 dark:stroke-purple-400" />
  </svg>
);

const WfhIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" className="stroke-fuchsia-500 fill-fuchsia-50/60 dark:fill-fuchsia-950/20" />
    <path d="m9 14 3-3 3 3v3H9v-3Z" className="stroke-fuchsia-600 dark:stroke-fuchsia-400" />
    <path d="M7 11h10" className="stroke-fuchsia-600 dark:stroke-fuchsia-400" />
  </svg>
);

const HalfIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" className="stroke-blue-500" />
    <path d="M12 2v20A10 10 0 0 0 12 2Z" className="fill-blue-600 stroke-blue-600 dark:fill-blue-400 dark:stroke-blue-400" />
  </svg>
);

const WeekendIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" className="stroke-indigo-500 fill-indigo-50/60 dark:fill-indigo-950/20" />
    <path d="M8 11V9.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1.5" className="stroke-indigo-600 dark:stroke-indigo-400" />
    <rect x="7" y="11" width="10" height="5" rx="1.5" className="stroke-indigo-600 dark:stroke-indigo-400" />
    <path d="M7 13h10M6 18h12" className="stroke-indigo-600 dark:stroke-indigo-400" />
  </svg>
);

// Map status to visual styles and label info
const statusMetadata: Record<AttendanceStatus, { label: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; bg: string; text: string }> = {
  Present: { label: 'Present', icon: PresentIcon, color: '#10B981', bg: 'bg-emerald-50/60 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  Absent: { label: 'Absent', icon: AbsentIcon, color: '#EF4444', bg: 'bg-rose-50/60 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30', text: 'text-rose-700 dark:text-rose-400' },
  'On Leave': { label: 'On Leave', icon: LeaveIcon, color: '#F59E0B', bg: 'bg-amber-50/60 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  'On Field': { label: 'On Field', icon: FieldIcon, color: '#8B5CF6', bg: 'bg-purple-50/60 dark:bg-purple-950/10 border-purple-100 dark:border-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
  Wfh: { label: 'Wfh', icon: WfhIcon, color: '#D946EF', bg: 'bg-fuchsia-50/60 dark:bg-fuchsia-950/10 border-fuchsia-100 dark:border-fuchsia-900/30', text: 'text-fuchsia-700 dark:text-fuchsia-400' },
  Half: { label: 'Half', icon: HalfIcon, color: '#3B82F6', bg: 'bg-blue-50/60 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
  Weekend: { label: 'Weekend', icon: WeekendIcon, color: '#6366F1', bg: 'bg-indigo-50/60 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
};

const statusBorderMap: Record<AttendanceStatus, string> = {
  Present: 'border-l-[3.5px] border-l-emerald-500 border-slate-150 dark:border-slate-850/50',
  Absent: 'border-l-[3.5px] border-l-rose-500 border-slate-150 dark:border-slate-850/50',
  'On Leave': 'border-l-[3.5px] border-l-amber-500 border-slate-150 dark:border-slate-850/50',
  'On Field': 'border-l-[3.5px] border-l-purple-500 border-slate-150 dark:border-slate-850/50',
  Wfh: 'border-l-[3.5px] border-l-fuchsia-500 border-slate-150 dark:border-slate-850/50',
  Half: 'border-l-[3.5px] border-l-blue-500 border-slate-150 dark:border-slate-850/50',
  Weekend: 'border-l-[3.5px] border-l-indigo-500 border-slate-150 dark:border-slate-850/50',
};

function StudentAvatar({ src, name, className }: { src?: string; name: string; className?: string }) {
  const [error, setError] = useState(false);

  const isValidUrl = src && (src.startsWith('http') || src.startsWith('data:image') || src.startsWith('/'));

  if (!isValidUrl || error) {
    return (
      <div className={`rounded-full bg-slate-100 dark:bg-slate-750 shrink-0 flex items-center justify-center text-slate-650 dark:text-slate-350 font-extrabold select-none ${className}`}>
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
      className={`rounded-full object-cover shrink-0 ${className}`}
    />
  );
}

interface AttendanceViewProps {
  selectedOrg?: string;
}

export default function AttendanceView({ selectedOrg = 'All Organizations' }: AttendanceViewProps) {
  const { currentUser } = useAuth();

  // Scoped student list & attendance logs
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');

  // Date configuration: Year and Month
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`; // "YYYY-MM"
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [bulkStudentId, setBulkStudentId] = useState('');
  const [bulkDate, setBulkDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus>('Present');
  const [bulkBeginTime, setBulkBeginTime] = useState('');
  const [bulkEndTime, setBulkEndTime] = useState('');

  // Edit popover state
  const [activePopover, setActivePopover] = useState<{ studentId: string; dateStr: string; x: number; y: number } | null>(null);

  // Determine permissions
  const canEdit = currentUser && ['Super Admin', 'Organization Admin', 'Mentor', 'Assistant'].includes(currentUser.role);
  const isStudent = currentUser?.role === 'Student';

  // Available months list for custom header picker
  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Compute active year & month index
  const [yearStr, monthStr] = selectedDate.split('-');
  const activeYear = parseInt(yearStr, 10);
  const activeMonthIndex = parseInt(monthStr, 10) - 1; // 0-indexed

  // Handle clicking outside custom Date picker popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Main data loader
  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Students based on role boundaries
      let stdQuery = supabase.from('students').select('*').order('name', { ascending: true });

      const orgToFilter = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
        : currentUser.organization;

      if (orgToFilter) {
        stdQuery = stdQuery.eq('organization', orgToFilter);
      }

      if (currentUser.role === 'Mentor') {
        stdQuery = stdQuery.eq('mentor', currentUser.name);
      } else if (currentUser.role === 'Assistant') {
        let mentorName = currentUser.mentorName;
        // Resolve assistant's mentor name dynamically if missing
        if (!mentorName && currentUser.mentor_id) {
          const { data: resolvedName } = await supabase
            .rpc('get_assistant_mentor_name', { assistant_mentor_id: currentUser.mentor_id });
          if (resolvedName) mentorName = resolvedName;
        }
        if (!mentorName) {
          const { data: resolvedByEmail } = await supabase
            .rpc('get_mentor_name_for_assistant_email', { assistant_email: currentUser.email });
          if (resolvedByEmail) mentorName = resolvedByEmail;
        }
        if (mentorName) {
          stdQuery = stdQuery.eq('mentor', mentorName);
        }
      } else if (currentUser.role === 'Student') {
        stdQuery = stdQuery.eq('email', currentUser.email);
      }

      const { data: stds, error: stdError } = await stdQuery;
      if (stdError) throw stdError;
      setStudents(stds || []);

      // 2. Fetch attendance logs for selected month
      let logQuery = supabase.from('student_attendance').select('*');
      if (orgToFilter) {
        logQuery = logQuery.eq('organization', orgToFilter);
      }
      logQuery = logQuery.like('date', `${selectedDate}-%`);

      const { data: logs, error: logError } = await logQuery;
      if (logError) throw logError;
      setAttendanceLogs(logs || []);
    } catch (err: any) {
      console.error('[AttendanceView] Load failed:', err);
      setErrorMsg(err.message || 'Error loading attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, selectedOrg, selectedDate]);

  // Generate lists of days in active month
  const getDaysInMonth = () => {
    const totalDays = new Date(activeYear, activeMonthIndex + 1, 0).getDate();
    const startDayOfWeek = new Date(activeYear, activeMonthIndex, 1).getDay(); // 0 = Sunday, 6 = Saturday

    const days: { dayNumber: number | null; dateStr: string; isSunday: boolean }[] = [];

    // Fill padded empty cells at beginning of grid
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ dayNumber: null, dateStr: '', isSunday: false });
    }

    // Fill calendar days
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${selectedDate}-${dayStr}`;
      const isSunday = new Date(activeYear, activeMonthIndex, d).getDay() === 0;
      days.push({ dayNumber: d, dateStr, isSunday });
    }

    return days;
  };

  const calendarCells = getDaysInMonth();

  // Find attendance record for a student on a specific date
  const getDayAttendance = (studentId: string, dateStr: string, isSunday: boolean): { status: AttendanceStatus | null; record: StudentAttendance | null } => {
    const record = attendanceLogs.find(log => log.student_id === studentId && log.date === dateStr);
    if (record) {
      return { status: record.status, record };
    }
    // Sunday default is Weekend
    if (isSunday) {
      return { status: 'Weekend', record: null };
    }
    return { status: null, record: null };
  };

  // Handle cell marking/popover trigger
  const handleCellClick = (e: React.MouseEvent, studentId: string, dateStr: string, isSunday: boolean) => {
    if (!canEdit) return; // Read-only for students

    const rect = e.currentTarget.getBoundingClientRect();
    
    let x = rect.left + rect.width / 2;
    let y = rect.bottom + 5;

    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      x = rect.left - containerRect.left + rect.width / 2;
      y = rect.bottom - containerRect.top + 5;
    }

    setActivePopover({
      studentId,
      dateStr,
      x,
      y
    });
  };

  // Save attendance status for a day
  const handleStatusSelect = async (status: AttendanceStatus | 'Clear') => {
    if (!activePopover || !currentUser) return;

    const { studentId, dateStr } = activePopover;
    setActivePopover(null);
    setSubmitting(true);

    try {
      const student = students.find(s => s.id === studentId);
      if (!student) throw new Error('Student not found');

      if (status === 'Clear') {
        const { error } = await supabase
          .from('student_attendance')
          .delete()
          .match({ student_id: studentId, date: dateStr });
        if (error) throw error;
      } else {
        // Default working hours: Present/Wfh/On Field is 9am-5pm; Half is 9am-1pm; others are null
        let defaultBegin: string | null = null;
        let defaultEnd: string | null = null;
        
        if (['Present', 'Wfh', 'On Field'].includes(status)) {
          defaultBegin = new Date(`${dateStr}T09:00:00`).toISOString();
          defaultEnd = new Date(`${dateStr}T17:00:00`).toISOString();
        } else if (status === 'Half') {
          defaultBegin = new Date(`${dateStr}T09:00:00`).toISOString();
          defaultEnd = new Date(`${dateStr}T13:00:00`).toISOString();
        }

        const payload: Partial<StudentAttendance> = {
          id: `${studentId}-${dateStr}`,
          student_id: studentId,
          date: dateStr,
          status,
          organization: student.organization,
          day_begin: defaultBegin || undefined,
          day_end: defaultEnd || undefined
        };

        const { error } = await supabase
          .from('student_attendance')
          .upsert(payload);
        if (error) throw error;
      }

      // Reload logs and student average attendance values
      await loadData();
    } catch (err: any) {
      console.error('[AttendanceView] Save status failed:', err);
      alert(err.message || 'Failed to save attendance record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk add attendance save
  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkStudentId || !currentUser) return;

    setSubmitting(true);
    try {
      const student = students.find(s => s.id === bulkStudentId);
      if (!student) throw new Error('Student not found');

      let finalBegin: string | null = null;
      let finalEnd: string | null = null;
      
      if (bulkBeginTime) {
        finalBegin = new Date(`${bulkDate}T${bulkBeginTime}:00`).toISOString();
      } else if (['Present', 'Wfh', 'On Field'].includes(bulkStatus)) {
        finalBegin = new Date(`${bulkDate}T09:00:00`).toISOString();
      } else if (bulkStatus === 'Half') {
        finalBegin = new Date(`${bulkDate}T09:00:00`).toISOString();
      }

      if (bulkEndTime) {
        finalEnd = new Date(`${bulkDate}T${bulkEndTime}:00`).toISOString();
      } else if (['Present', 'Wfh', 'On Field'].includes(bulkStatus)) {
        finalEnd = new Date(`${bulkDate}T17:00:00`).toISOString();
      } else if (bulkStatus === 'Half') {
        finalEnd = new Date(`${bulkDate}T13:00:00`).toISOString();
      }

      const payload: Partial<StudentAttendance> = {
        id: `${bulkStudentId}-${bulkDate}`,
        student_id: bulkStudentId,
        date: bulkDate,
        status: bulkStatus,
        organization: student.organization,
        day_begin: finalBegin || undefined,
        day_end: finalEnd || undefined
      };

      const { error } = await supabase
        .from('student_attendance')
        .upsert(payload);
      if (error) throw error;

      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
      console.error('[AttendanceView] Bulk add failed:', err);
      alert(err.message || 'Failed to add attendance record.');
    } finally {
      setSubmitting(false);
    }
  };

  // Month modification triggers
  const handlePrevMonth = () => {
    let nextMonth = activeMonthIndex;
    let nextYear = activeYear;
    if (activeMonthIndex === 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else {
      nextMonth -= 1;
    }
    setSelectedDate(`${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let nextMonth = activeMonthIndex;
    let nextYear = activeYear;
    if (activeMonthIndex === 11) {
      nextMonth = 0;
      nextYear += 1;
    } else {
      nextMonth += 1;
    }
    setSelectedDate(`${nextYear}-${String(nextMonth + 1).padStart(2, '0')}`);
  };

  // CSV Generator and downloader
  const handleExportCSV = () => {
    if (students.length === 0) return;

    const daysCount = new Date(activeYear, activeMonthIndex + 1, 0).getDate();

    // Headers list
    const headers = [
      'Student Name',
      'Email',
      'Organization',
      'Overall Attendance (%)',
      ...Array.from({ length: daysCount }, (_, i) => `Day ${i + 1}`)
    ];

    // Rows mapping
    const rows = students.map(student => {
      const studentDays = Array.from({ length: daysCount }, (_, i) => {
        const d = i + 1;
        const dateStr = `${selectedDate}-${String(d).padStart(2, '0')}`;
        const isSunday = new Date(activeYear, activeMonthIndex, d).getDay() === 0;
        const { status } = getDayAttendance(student.id, dateStr, isSunday);
        return status || '-';
      });

      return [
        `"${student.name}"`,
        `"${student.email}"`,
        `"${student.organization}"`,
        `${student.attendance || 0}`,
        ...studentDays
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${monthsList[activeMonthIndex]}_${activeYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered student list
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = selectedBranch === 'All' || student.grade === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  // Extract unique grades to act as branch selection filters
  const availableBranches = ['All', ...Array.from(new Set(students.map(s => s.grade))).sort()];

  return (
    <div ref={containerRef} className="space-y-6 font-sans relative">
      {/* Top Banner Header & Month Select */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Attendance</h1>
          <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">Dashboard / Attendance</p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Select Month & Year picker */}
          <div className="relative" ref={datePickerRef}>
            <label className="absolute -top-4 left-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Select Month and Year
            </label>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-350 dark:hover:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-200"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{monthsList[activeMonthIndex]} {activeYear}</span>
            </button>

            {/* Custom Date Picker Popup */}
            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2 mb-3">
                    <button
                      onClick={() => setSelectedDate(`${activeYear - 1}-${String(activeMonthIndex + 1).padStart(2, '0')}`)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{activeYear}</span>
                    <button
                      onClick={() => setSelectedDate(`${activeYear + 1}-${String(activeMonthIndex + 1).padStart(2, '0')}`)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {monthsList.map((m, idx) => {
                      const isSel = idx === activeMonthIndex;
                      return (
                        <button
                          key={m}
                          onClick={() => {
                            setSelectedDate(`${activeYear}-${String(idx + 1).padStart(2, '0')}`);
                            setShowDatePicker(false);
                          }}
                          className={`py-2 text-xs rounded-xl font-medium transition-all ${isSel
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350'
                            }`}
                        >
                          {m.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* "+ Add Attendance" button */}
          {canEdit && (
            <button
              onClick={() => {
                if (students.length > 0) {
                  setBulkStudentId(students[0].id);
                }
                setBulkBeginTime('');
                setBulkEndTime('');
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/15 cursor-pointer hover:shadow-orange-500/25 active:scale-98 transition-all duration-150"
            >
              <Plus className="w-4 h-4" />
              <span>Add Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters: Name search & Choose Branch */}
      {!isStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          {/* Employee Name / Student Name search */}
          <div className="relative">
            <label className="absolute -top-2.5 left-3 bg-white dark:bg-slate-900 px-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Student Name
            </label>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 z-10" />
              <input
                type="text"
                placeholder="Search student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Choose Branch dropdown */}
          <div className="relative">
            <label className="absolute -top-2.5 left-3 bg-white dark:bg-slate-900 px-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Choose Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-200"
            >
              {availableBranches.map((branch) => (
                <option key={branch} value={branch} className="dark:bg-slate-900">
                  {branch === 'All' ? 'Choose Branch (All)' : `Class ${branch}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main legend of status colors */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap gap-2 gap-y-3.5 items-center justify-center md:justify-start">
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 mr-2 tracking-wide block">Status Legend:</span>
        {Object.entries(statusMetadata).map(([status, meta]) => {
          const IconComp = meta.icon;
          return (
            <div
              key={status}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold tracking-wide select-none transition-all duration-150 hover:scale-102 ${meta.bg} ${meta.text}`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Loading States */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">Fetching attendance sheets...</p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-6 text-center shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="font-bold text-rose-800 dark:text-rose-450 text-sm">Failed to load data</h3>
          <p className="text-xs text-rose-600 dark:text-rose-500/80 mt-1">{errorMsg}</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl py-16 text-center shadow-sm">
          <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">No students found</h3>
          <p className="text-xs text-slate-450 mt-1">Try adjusting your filters or searches.</p>
        </div>
      ) : (
        /* Students List with calendar cards */
        <div className="space-y-6">
          {filteredStudents.map((student) => {
            return (
              <div
                key={student.id}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-5 space-y-4"
              >
                {/* Student Card Top Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-3">
                    <StudentAvatar
                      src={student.avatar}
                      name={student.name}
                      className="w-10 h-10 ring-2 ring-slate-100 dark:ring-slate-800 shadow-sm"
                    />
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm tracking-tight">{student.name}</h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none mt-1">
                        Class {student.grade} • {student.email}
                      </p>
                    </div>
                  </div>

                  {/* Right: Dynamic Summary info */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Overall Score */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                      <Award className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Rate:</span>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">{student.attendance}%</span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-teal-650 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/15 border border-teal-100 dark:border-teal-900/30 px-2 py-1.5 rounded-xl">
                        {monthsList[activeMonthIndex]} {activeYear} Attendance
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calendar Sheet */}
                <div className="overflow-x-auto">
                  <div className="min-w-[700px] pb-2">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      <div>Sun</div>
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                      <div>Thu</div>
                      <div>Fri</div>
                      <div>Sat</div>
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {calendarCells.map((cell, idx) => {
                        if (cell.dayNumber === null) {
                          return (
                            <div
                              key={`empty-${idx}`}
                              className="h-16 rounded-xl bg-slate-50/40 dark:bg-slate-950/10 border border-dashed border-slate-100 dark:border-slate-850/50"
                            />
                          );
                        }

                        const { status, record } = getDayAttendance(student.id, cell.dateStr, cell.isSunday);
                        const meta = status ? statusMetadata[status] : null;
                        const IconComp = meta?.icon;
                        const borderClass = status ? statusBorderMap[status] : 'border-slate-100 dark:border-slate-850/50';
                        const cellBgClass = status
                          ? `${meta.bg} dark:bg-slate-900/30 shadow-3xs`
                          : 'bg-slate-50/30 hover:bg-slate-100/40 dark:bg-slate-950/10 dark:hover:bg-slate-900/30 border border-slate-100 dark:border-slate-850/60';

                        let hoverTitle = status || '';
                        if (status && record) {
                          if (record.day_begin) {
                            const beginTime = new Date(record.day_begin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            hoverTitle += `\nDay Begin: ${beginTime}`;
                          }
                          if (record.day_end) {
                            const endTime = new Date(record.day_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                            hoverTitle += `\nDay End: ${endTime}`;
                          }
                        }

                        return (
                          <div
                            key={cell.dateStr}
                            onClick={(e) => handleCellClick(e, student.id, cell.dateStr, cell.isSunday)}
                            title={hoverTitle}
                            className={`h-16 rounded-xl flex flex-col p-2 select-none transition-all duration-150 ${cellBgClass} ${borderClass} ${canEdit ? 'cursor-pointer hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-xs hover:-translate-y-[1px]' : ''
                              }`}
                          >
                            {/* Day Number */}
                            <span className={`text-[10px] ${status ? 'font-black' : 'font-bold'} ${meta ? meta.text : 'text-slate-400 dark:text-slate-500'}`}>
                              {cell.dayNumber}
                            </span>

                            {/* Day Status Icon / Indicator */}
                            <div className="flex-1 flex items-center justify-center mt-0.5">
                              {meta && IconComp ? (
                                <IconComp className="w-5 h-5 drop-shadow-sm transition-transform duration-200" />
                              ) : (
                                <span className="text-[10px] text-slate-350 font-bold dark:text-slate-750">
                                  {canEdit && !cell.isSunday ? (
                                    <span className="text-[9px] text-indigo-500 dark:text-indigo-400 opacity-0 hover:opacity-100 transition-opacity font-semibold">Mark</span>
                                  ) : (
                                    '•'
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Punch times info text */}
                            {record?.day_begin && (
                              <div className="text-[8px] text-center font-extrabold mt-1 text-slate-500 dark:text-slate-400 opacity-80 select-none tracking-tighter">
                                {new Date(record.day_begin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                {record.day_end ? ` - ${new Date(record.day_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}` : ' ...'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Popover Selection Overlay Menu */}
      <AnimatePresence>
        {activePopover && (
          <>
            {/* Backdrop layer to click away */}
            <div
              className="fixed inset-0 z-50 cursor-default"
              onClick={() => setActivePopover(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              style={{
                position: 'absolute',
                left: activePopover.x,
                top: activePopover.y,
                transform: 'translateX(-50%)'
              }}
              className="backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl z-50 p-2.5 py-3 w-44 flex flex-col gap-1.5"
            >
              <div className="text-[9px] font-extrabold uppercase text-slate-400 dark:text-slate-500 text-center tracking-wider mb-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-850">
                Mark Status
              </div>
              {Object.entries(statusMetadata).map(([status, meta]) => {
                const IconComp = meta.icon;
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusSelect(status as AttendanceStatus)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-350 font-semibold cursor-pointer text-left transition-colors"
                  >
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => handleStatusSelect('Clear')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-rose-55 dark:hover:bg-rose-950/20 text-xs text-rose-600 dark:text-rose-400 font-semibold cursor-pointer text-left border-t border-slate-100 dark:border-slate-850 mt-1 pt-2 transition-colors"
              >
                <X className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Clear Record</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* "+ Add Attendance" Modal dialog */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            {/* Modal backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setShowAddModal(false)}
            />
            {/* Modal content box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full z-50 relative"
            >
              <h3 className="text-base font-black text-slate-800 dark:text-white mb-4">Add Student Attendance</h3>
              <form onSubmit={handleBulkAdd} className="space-y-4">
                {/* Choose student */}
                <div className="relative">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                    Student
                  </label>
                  <select
                    value={bulkStudentId}
                    onChange={(e) => setBulkStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-200"
                    required
                  >
                    {students.map((stud) => (
                      <option key={stud.id} value={stud.id} className="dark:bg-slate-900">
                        {stud.name} ({stud.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Choose date */}
                <div className="relative">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:color-scheme-dark transition-all duration-200"
                    required
                  />
                </div>

                {/* Choose Status */}
                <div className="relative">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                    Status
                  </label>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all duration-200"
                    required
                  >
                    {Object.keys(statusMetadata).map((status) => (
                      <option key={status} value={status} className="dark:bg-slate-900">
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Choose Begin and End Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                      Day Begin Time
                    </label>
                    <input
                      type="time"
                      value={bulkBeginTime}
                      onChange={(e) => setBulkBeginTime(e.target.value)}
                      placeholder="e.g. 09:00"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:color-scheme-dark transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                      Day End Time
                    </label>
                    <input
                      type="time"
                      value={bulkEndTime}
                      onChange={(e) => setBulkEndTime(e.target.value)}
                      placeholder="e.g. 17:00"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955/30 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:color-scheme-dark transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-105/80 dark:bg-slate-800 dark:hover:bg-slate-700/85 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-300 transition-all duration-150 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !bulkStudentId}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-750 hover:to-indigo-750 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/15 disabled:opacity-50 transition-all duration-150 cursor-pointer animate-none"
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Save Record</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
