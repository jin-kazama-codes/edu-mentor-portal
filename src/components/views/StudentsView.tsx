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
  Mail
} from 'lucide-react';
import { students as initialStudents, sessions as mockSessions } from '../../data/mockData';
import { Student } from '../../types';

interface StudentsViewProps {
  defaultAddOpen?: boolean;
}

export default function StudentsView({ defaultAddOpen = false }: StudentsViewProps) {
  const [data, setData] = useState<Student[]>(() => {
    const saved = localStorage.getItem('portal_students');
    return saved ? JSON.parse(saved) : initialStudents;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Selected Student Details Modal state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('portal_students', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (defaultAddOpen) {
      setShowAddStudentModal(true);
    }
  }, [defaultAddOpen]);

  // Form states for creating a new student
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState(16);
  const [formGrade, setFormGrade] = useState('11th Grade');
  const [formMentor, setFormMentor] = useState('Aadil Bhat');
  const [formGuardian, setFormGuardian] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'On Leave' | 'Graduated' | 'Suspended'>('Active');
  const [formProgress, setFormProgress] = useState(80);
  const [formAttendance, setFormAttendance] = useState(92);
  const [formUpcomingSession, setFormUpcomingSession] = useState('July 10, 2026 - Derivative Integration');

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formGuardian.trim()) {
      alert('Please fill in Name and Guardian fields');
      return;
    }

    const newStudent: Student = {
      id: `stud-${Date.now()}`,
      name: formName,
      age: Number(formAge),
      grade: formGrade,
      mentor: formMentor,
      guardian: formGuardian,
      progress: Number(formProgress),
      attendance: Number(formAttendance),
      upcomingSession: formUpcomingSession,
      status: formStatus,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 9999999)}?w=150&auto=format&fit=crop&q=80`
    };

    setData((prev) => [newStudent, ...prev]);
    setToastMessage(`Student "${formName}" enrolled successfully!`);
    setShowToast(true);
    setShowAddStudentModal(false);

    // Reset form states
    setFormName('');
    setFormAge(16);
    setFormGrade('11th Grade');
    setFormMentor('Aadil Bhat');
    setFormGuardian('');
    setFormStatus('Active');
    setFormProgress(80);
    setFormAttendance(92);
    setFormUpcomingSession('July 10, 2026 - Derivative Integration');

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Compile available grades dynamically
  const allGrades = Array.from(new Set(initialStudents.map((s) => s.grade))).sort();

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

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Active Student Cohorts</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Track individual progress metrics, academic achievements, attendance trends, and assignments</p>
        </div>
        <button
          onClick={() => setShowAddStudentModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Cohort Aggregates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="p-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Cohort Size</span>
          <span className="text-lg font-black text-slate-700 dark:text-white mt-1.5 block">52 Registered</span>
        </div>
        <div className="p-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Average Attendance</span>
          <span className="text-lg font-black text-teal-600 mt-1.5 block">91.4% Avg</span>
        </div>
        <div className="p-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Academic Progress</span>
          <span className="text-lg font-black text-blue-500 mt-1.5 block">84.2% Index</span>
        </div>
        <div className="p-1">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">On Leave Tutees</span>
          <span className="text-lg font-black text-amber-500 mt-1.5 block">3 Students</span>
        </div>
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
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentStudents.map((stud, idx) => (
          <motion.div
            key={stud.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: idx * 0.02 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
          >
            {/* Header profile info */}
            <div className="p-4 border-b border-slate-50 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex gap-3 min-w-0">
                <img
                  src={stud.avatar}
                  alt={stud.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-lg object-cover ring-2 ring-slate-50 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-xs truncate">{stud.name}</h3>
                  <p className="text-[10px] text-slate-400">{stud.grade} • Age {stud.age}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold ${
                stud.status === 'Active'
                  ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                  : stud.status === 'On Leave'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                  : stud.status === 'Graduated'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400'
              }`}>
                {stud.status}
              </span>
            </div>

            {/* Metrics Info */}
            <div className="p-4 space-y-3.5 flex-1">
              {/* Progress Bar & Attendance Bar */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                    <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Syllabus Progress</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{stud.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stud.progress}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                    <span className="flex items-center gap-1"><Smile className="w-3.5 h-3.5 text-teal-500" /> Attendance Rate</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{stud.attendance}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${stud.attendance}%` }} />
                  </div>
                </div>
              </div>

              {/* Assignments / Allocations */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750/30 text-xs">
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block">Assigned Mentor</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate block mt-0.5" title={stud.mentor}>{stud.mentor}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-slate-400 block">Guardian / Contact</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate block mt-0.5" title={stud.guardian}>{stud.guardian}</span>
                </div>
              </div>

              {/* Upcoming Slot description */}
              <div className="flex gap-1.5 items-start text-[10px] bg-slate-50/60 dark:bg-slate-750/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.25" />
                <div className="min-w-0">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Next Scheduled Class:</span>
                  <p className="truncate mt-0.5 font-medium">{stud.upcomingSession}</p>
                </div>
              </div>
            </div>

            {/* Footer triggers */}
            <div className="p-3 bg-slate-50/30 dark:bg-slate-900/10 border-t border-slate-50 dark:border-slate-750/30 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono">ID: {stud.id.toUpperCase()}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedStudent(stud)}
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
        ))}
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
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/40 dark:border-blue-900/20 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Academic Progress</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl font-black text-blue-600 dark:text-blue-400">{selectedStudent.progress}%</span>
                        <span className="text-[10px] text-slate-400">of Syllabus completed</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${selectedStudent.progress}%` }} />
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
                  <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
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
                          <option value="Aadil Bhat">Aadil Bhat</option>
                          <option value="Mehreen Shafi">Mehreen Shafi</option>
                          <option value="Suhail Ahmad">Suhail Ahmad</option>
                          <option value="Saba Jan">Saba Jan</option>
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
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formProgress}
                          onChange={(e) => setFormProgress(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Initial Attendance ({formAttendance}%)</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={formAttendance}
                          onChange={(e) => setFormAttendance(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500 mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Upcoming Session Topic / Date</label>
                      <input
                        type="text"
                        value={formUpcomingSession}
                        onChange={(e) => setFormUpcomingSession(e.target.value)}
                        placeholder="e.g. July 12, 2026 - Kinetic Physics Formulas"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                      />
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
