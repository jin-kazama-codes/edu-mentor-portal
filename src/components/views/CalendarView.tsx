/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarDays,
  Clock,
  Video,
  User,
  GraduationCap,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  X,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { sessions as initialSessions } from '../../data/mockData';
import { Session } from '../../types';

interface CalendarViewProps {
  defaultBookOpen?: boolean;
}

export default function CalendarView({ defaultBookOpen = false }: CalendarViewProps) {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionsList, setSessionsList] = useState<Session[]>(initialSessions);

  // Book Slot Modal State
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Form State
  const [bookStudent, setBookStudent] = useState('');
  const [bookMentor, setBookMentor] = useState('');
  const [bookDate, setBookDate] = useState('2026-07-02');
  const [bookTime, setBookTime] = useState('04:00 PM - 05:00 PM');
  const [bookCategory, setBookCategory] = useState<Session['category']>('Academic');
  const [bookDuration, setBookDuration] = useState('60 mins');
  const [bookHomework, setBookHomework] = useState('');
  const [bookNotes, setBookNotes] = useState('');

  useEffect(() => {
    if (defaultBookOpen) {
      setShowBookModal(true);
    }
  }, [defaultBookOpen]);

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookStudent.trim() || !bookMentor.trim()) {
      alert('Please fill in Student and Mentor name');
      return;
    }

    const newSession: Session = {
      id: `sess-${Date.now().toString(16).slice(-4)}`,
      student: bookStudent,
      mentor: bookMentor,
      date: bookDate,
      time: bookTime,
      category: bookCategory,
      duration: bookDuration,
      meetingLink: 'https://meet.google.com/xyp-qvbn-abc',
      status: 'Upcoming',
      attendance: 'Present',
      homework: bookHomework || 'Complete specified textbook exercises.',
      notes: bookNotes || 'Prepared syllabus topic discussed during session.',
      files: []
    };

    setSessionsList((prev) => [newSession, ...prev]);
    setToastMessage(`New slot scheduled successfully for ${bookStudent}!`);
    setShowToast(true);
    setShowBookModal(false);

    // Reset Form
    setBookStudent('');
    setBookMentor('');
    setBookDate('2026-07-02');
    setBookTime('04:00 PM - 05:00 PM');
    setBookCategory('Academic');
    setBookDuration('60 mins');
    setBookHomework('');
    setBookNotes('');

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Filters
  const filteredSessions = sessionsList.filter((s) => {
    return selectedCategory === 'All' || s.category === selectedCategory;
  });

  // Week days hardcoded sample
  const weekDays = [
    { name: 'Monday', label: 'Mon', date: 'June 29' },
    { name: 'Tuesday', label: 'Tue', date: 'June 30' },
    { name: 'Wednesday', label: 'Wed', date: 'July 1' },
    { name: 'Thursday', label: 'Thu', date: 'July 2' },
    { name: 'Friday', label: 'Fri', date: 'July 3' },
    { name: 'Saturday', label: 'Sat', date: 'July 4' },
    { name: 'Sunday', label: 'Sun', date: 'July 5' }
  ];

  // Helper: map index to colors
  const getCategoryColor = (cat: Session['category']) => {
    if (cat === 'Academic') return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (cat === 'Behavioral') return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    if (cat === 'Doubt Clearing') return 'bg-teal-500/10 text-teal-600 border-teal-500/20';
    if (cat === 'Exam Prep') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
  };

  const getStatusBadgeColor = (status: Session['status']) => {
    if (status === 'Completed') return 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400';
    if (status === 'Upcoming') return 'bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400';
    return 'bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400';
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Academic Schedules</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Organize class slots, sync external meeting nodes, and review past transcripts</p>
        </div>
        <div className="flex gap-2.5">
          {/* View Toggles */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
            <button
              onClick={() => setView('weekly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                view === 'weekly' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setView('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                view === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Monthly
            </button>
          </div>
          <button
            onClick={() => setShowBookModal(true)}
            className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4.5 h-4.5" />
            <span>Book Slot</span>
          </button>
        </div>
      </div>

      {/* Filters & Control bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button className="p-1.5 border border-slate-200 dark:border-slate-750 rounded-lg hover:bg-slate-150">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">June 29 - July 05, 2026</span>
          <button className="p-1.5 border border-slate-200 dark:border-slate-750 rounded-lg hover:bg-slate-150">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {['All', 'Academic', 'Behavioral', 'Doubt Clearing', 'Exam Prep'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700/60 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Schedule Layout (Default) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
          {weekDays.map((day, dIdx) => {
            // Find sessions happening on this date (dates correspond to June 29 (day 29) to July 5 (day 5))
            const dayNum = 29 + dIdx > 30 ? (29 + dIdx) - 30 : 29 + dIdx;
            const monthStr = dIdx < 2 ? '06' : '07';
            const formattedDateStr = `2026-${monthStr}-${dayNum < 10 ? '0' + dayNum : dayNum}`;

            const daySessions = filteredSessions.filter((s) => s.date === formattedDateStr);

            return (
              <div key={day.name} className="min-h-[220px] md:min-h-[480px] flex flex-col">
                {/* Day Header */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center flex md:flex-col justify-between md:justify-center items-center gap-1 shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{day.label}</span>
                  <span className="text-xs font-black text-slate-700 dark:text-white">{day.date}</span>
                </div>

                {/* Day Sessions List */}
                <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto bg-slate-50/20 dark:bg-slate-900/5">
                  {daySessions.slice(0, 3).map((sess) => (
                    <motion.div
                      key={sess.id}
                      onClick={() => setSelectedSession(sess)}
                      whileHover={{ scale: 1.02 }}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-shadow shadow-xs hover:shadow-md flex flex-col justify-between text-left relative overflow-hidden bg-white dark:bg-slate-850 ${getCategoryColor(
                        sess.category
                      )}`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[8px] font-bold uppercase truncate max-w-[80px]">{sess.category}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${sess.status === 'Completed' ? 'bg-green-500' : sess.status === 'Upcoming' ? 'bg-blue-500' : 'bg-red-500'}`} />
                        </div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-white leading-tight truncate">
                          {sess.student}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">Tutor: {sess.mentor.split(' ')[0]}</p>
                      </div>

                      <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-2 font-mono">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{sess.time}</span>
                      </div>
                    </motion.div>
                  ))}
                  {daySessions.length === 0 && (
                    <div className="h-full flex items-center justify-center text-center p-4">
                      <span className="text-[10px] text-slate-300 dark:text-slate-500 font-semibold font-mono">Free Slot</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Session Details Modal */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-slate-700 shadow-2xl"
            >
              {/* Modal Banner */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-teal-400">{selectedSession.category} Lesson Details</span>
                    <h3 className="text-sm font-black text-white leading-tight mt-0.5">Class ID: #{selectedSession.id.toUpperCase()}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto text-xs text-slate-600 dark:text-slate-300">
                
                {/* Mentor / Student pair */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-750/30">
                    <span className="text-[8px] uppercase font-bold text-slate-400 block mb-1">Assigned Student</span>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      <strong className="text-slate-800 dark:text-white font-bold">{selectedSession.student}</strong>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-750/30">
                    <span className="text-[8px] uppercase font-bold text-slate-400 block mb-1">Subject Mentor</span>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-teal-500" />
                      <strong className="text-slate-800 dark:text-white font-bold">{selectedSession.mentor}</strong>
                    </div>
                  </div>
                </div>

                {/* Date/Time slots */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/20 p-3 rounded-xl border border-slate-100 dark:border-slate-750/20">
                  <div>
                    <span className="text-[8px] uppercase font-bold text-slate-400">Date</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mt-0.5">{selectedSession.date}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-bold text-slate-400">Time / Slot</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mt-0.5">{selectedSession.time}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-bold text-slate-400">Duration</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mt-0.5">{selectedSession.duration}</span>
                  </div>
                </div>

                {/* Meeting details */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Virtual Classroom Link</span>
                  <div className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750/40 rounded-xl items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Video className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="font-mono text-[11px] truncate text-slate-500 dark:text-slate-400">{selectedSession.meetingLink}</span>
                    </div>
                    <a
                      href={selectedSession.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-[10px] font-bold flex items-center gap-1 hover:bg-blue-700 shrink-0"
                    >
                      <span>Join Class</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Attendance & Homework */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Attendance Checklist</span>
                    <div className="mt-1.5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusBadgeColor(selectedSession.attendance === 'Present' ? 'Completed' : 'Cancelled')}`}>
                        {selectedSession.attendance}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadgeColor(selectedSession.status)}`}>
                      Class Status: {selectedSession.status}
                    </span>
                  </div>
                </div>

                {/* Homework description */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Assigned Homework & Exercises</span>
                  <p className="bg-slate-50 dark:bg-slate-750/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] leading-normal font-medium text-slate-600 dark:text-slate-400">
                    {selectedSession.homework}
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Class Notes & Remarks</span>
                  <p className="bg-slate-50 dark:bg-slate-750/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] leading-normal font-medium text-slate-600 dark:text-slate-400">
                    {selectedSession.notes}
                  </p>
                </div>

                {/* Attachments */}
                {selectedSession.files.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Shared Homework Attachments ({selectedSession.files.length})</span>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedSession.files.map((f, fIdx) => (
                        <div key={fIdx} className="p-2 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center gap-1.5 text-[10px]">
                          <FileText className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                          <span className="truncate font-medium text-slate-700 dark:text-slate-300">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-750/30 flex justify-end gap-2.5">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="px-3.5 py-1.5 hover:bg-slate-250 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-750"
                >
                  Close
                </button>
                <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer">
                  Edit Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Book Slot Modal */}
      <AnimatePresence>
        {showBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full overflow-hidden border border-slate-100 dark:border-slate-700 shadow-2xl"
            >
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-850">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[8px] uppercase font-bold tracking-wider text-teal-400">Schedule</span>
                    <h3 className="text-sm font-black text-white leading-tight mt-0.5">Book New Academic Slot</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowBookModal(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleBookSubmit} className="p-5 space-y-4 max-h-[460px] overflow-y-auto text-xs text-slate-600 dark:text-slate-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Student Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zoya Khan"
                      value={bookStudent}
                      onChange={(e) => setBookStudent(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Mentor Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aadil Bhat"
                      value={bookMentor}
                      onChange={(e) => setBookMentor(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Date</label>
                    <input
                      type="date"
                      required
                      value={bookDate}
                      onChange={(e) => setBookDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Time / Slot</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 04:00 PM - 05:00 PM"
                      value={bookTime}
                      onChange={(e) => setBookTime(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Category</label>
                    <select
                      value={bookCategory}
                      onChange={(e) => setBookCategory(e.target.value as Session['category'])}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="Academic">Academic</option>
                      <option value="Behavioral">Behavioral</option>
                      <option value="Doubt Clearing">Doubt Clearing</option>
                      <option value="Exam Prep">Exam Prep</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Duration</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 60 mins"
                      value={bookDuration}
                      onChange={(e) => setBookDuration(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Homework & Exercises</label>
                  <textarea
                    rows={2}
                    placeholder="Enter homework prompt for student..."
                    value={bookHomework}
                    onChange={(e) => setBookHomework(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Class Notes & Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Enter initial learning goals or syllabus remarks..."
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-normal font-medium">
                    * Booking a slot dynamically integrates with external calendars, notifies the student/guardian, and initiates the class notes dashboard automatically.
                  </p>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowBookModal(false)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-750"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    Confirm Schedule
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
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 dark:bg-slate-800 text-white border border-slate-800 dark:border-slate-700 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
            <span className="text-xs font-semibold pr-2">{toastMessage}</span>
            <button
              onClick={() => setShowToast(false)}
              className="p-1 hover:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
