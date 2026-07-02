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
  Mail
} from 'lucide-react';
import { mentors as initialMentors, sessions as mockSessions } from '../../data/mockData';
import { Mentor } from '../../types';

export default function MentorsView() {
  const [data, setData] = useState<Mentor[]>(() => {
    const saved = localStorage.getItem('portal_mentors');
    return saved ? JSON.parse(saved) : initialMentors;
  });

  useEffect(() => {
    localStorage.setItem('portal_mentors', JSON.stringify(data));
  }, [data]);

  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('All');

  // Modals and feedback state
  const [selectedMentorProfile, setSelectedMentorProfile] = useState<Mentor | null>(null);
  const [selectedMentorSchedules, setSelectedMentorSchedules] = useState<Mentor | null>(null);
  const [showAddMentorModal, setShowAddMentorModal] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Form states for creating a new mentor
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSubjects, setFormSubjects] = useState<string[]>(['Mathematics']);
  const [formExperience, setFormExperience] = useState('4 Years');
  const [formAvailability, setFormAvailability] = useState<'Full-time' | 'Part-time' | 'Weekends Only' | 'On-demand'>('Full-time');
  const [formPerformance, setFormPerformance] = useState<'Outstanding' | 'Exceeding' | 'Meeting' | 'Needs Review'>('Exceeding');

  const handleAddMentorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Please fill in Name and Email fields');
      return;
    }

    const newMentor: Mentor = {
      id: `ment-${Date.now()}`,
      name: formName,
      email: formEmail,
      subjects: formSubjects,
      studentsAssigned: [],
      experience: formExperience,
      rating: 5.0,
      availability: formAvailability,
      upcomingSessions: 0,
      performance: formPerformance,
      avatar: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 9999999)}?w=150&auto=format&fit=crop&q=80`
    };

    setData((prev) => [newMentor, ...prev]);
    setToastMessage(`Mentor "${formName}" added to faculty successfully!`);
    setShowToast(true);
    setShowAddMentorModal(false);

    // Reset form states
    setFormName('');
    setFormEmail('');
    setFormSubjects(['Mathematics']);
    setFormExperience('4 Years');
    setFormAvailability('Full-time');
    setFormPerformance('Exceeding');

    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Subjects list compiled from all mentors
  const allSubjects = Array.from(new Set(initialMentors.flatMap((m) => m.subjects)));

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
        <button
          onClick={() => setShowAddMentorModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Mentor</span>
        </button>
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
                <img
                  src={mentor.avatar}
                  alt={mentor.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-white shadow-md group-hover:scale-102 transition-transform shrink-0"
                />
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
                    <img
                      src={selectedMentorProfile.avatar}
                      alt={selectedMentorProfile.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover ring-2 ring-white/30"
                    />
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
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Teaching Experience</span>
                      <strong className="text-sm font-black text-slate-700 dark:text-slate-200 mt-1 block">{selectedMentorProfile.experience}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Performance Index</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <strong className="text-sm font-black text-slate-700 dark:text-slate-200">{selectedMentorProfile.rating.toFixed(2)}</strong>
                        <span className="text-[10px] text-slate-400">/ 5.0 Rating</span>
                      </div>
                    </div>
                  </div>

                  {/* Teaches Subjects */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Teaches Subjects</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMentorProfile.subjects.map((sub) => (
                        <span key={sub} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-300 font-bold rounded-lg border border-blue-100/40 dark:border-blue-800/40">
                          {sub}
                        </span>
                      ))}
                    </div>
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

                  {/* Faculty Schedule Overview snippet */}
                  <div className="p-3 bg-slate-50/60 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/60 rounded-xl">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Availability Window</span>
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-extrabold text-xs">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{selectedMentorProfile.availability}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Mentor Name</label>
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
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Professional Email</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. mentor@edvalley.com"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Experience Years</label>
                        <input
                          type="text"
                          placeholder="e.g. 5 Years"
                          value={formExperience}
                          onChange={(e) => setFormExperience(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        />
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
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Teaches Subject</label>
                        <select
                          onChange={(e) => setFormSubjects([e.target.value])}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                        >
                          <option value="Mathematics">Mathematics</option>
                          <option value="Physics">Physics</option>
                          <option value="Organic Chemistry">Organic Chemistry</option>
                          <option value="English Literature">English Literature</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Urdu Grammar">Urdu Grammar</option>
                        </select>
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
