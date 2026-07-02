/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  GraduationCap,
  Link2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Search,
  PlusCircle,
  XCircle,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { mentors as initialMentors, students as initialStudents } from '../../data/mockData';

interface UnassignedStudent {
  id: string;
  name: string;
  subjectNeed: string;
  grade: string;
  avatar: string;
}

export default function AssignmentView() {
  const [unassigned, setUnassigned] = useState<UnassignedStudent[]>(() => {
    const saved = localStorage.getItem('portal_assignment_unassigned');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'unas-1', name: 'Rayees Mir', subjectNeed: 'Chemistry', grade: '12th Grade', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
      { id: 'unas-2', name: 'Zoya Khan', subjectNeed: 'Mathematics', grade: '11th Grade', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
      { id: 'unas-3', name: 'Sameer Rather', subjectNeed: 'Physics', grade: '12th Grade', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
      { id: 'unas-4', name: 'Tabasum Ara', subjectNeed: 'English Literature', grade: '11th Grade', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
      { id: 'unas-5', name: 'Faisal Dar', subjectNeed: 'Urdu Literature', grade: '12th Grade', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' }
    ];
  });

  const [mentors, setMentors] = useState(() => {
    const saved = localStorage.getItem('portal_assignment_mentors');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'm-1', name: 'Aadil Bhat', specialty: 'Physics', assignedCount: 3, maxCapacity: 5, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', activeStudents: ['Iqra Jan', 'Zahid Bhat', 'Basit Lone'] },
      { id: 'm-3', name: 'Mehreen Shafi', specialty: 'Chemistry', assignedCount: 4, maxCapacity: 5, avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', activeStudents: ['Bisma Yusuf', 'Zahid Mir', 'Yasmeen Dar', 'Arsalan Bhat'] },
      { id: 'm-4', name: 'Suhail Ahmad', specialty: 'Computer Science', assignedCount: 5, maxCapacity: 5, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', activeStudents: ['Yawar Lone', 'Saima Akhter', 'Moomin Shah', 'Kabir Mehta', 'Deepak Sen'] },
      { id: 'm-8', name: 'Tabasum Ara', specialty: 'Urdu Literature', assignedCount: 1, maxCapacity: 5, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', activeStudents: ['Mehak Jan'] }
    ];
  });

  useEffect(() => {
    localStorage.setItem('portal_assignment_unassigned', JSON.stringify(unassigned));
  }, [unassigned]);

  useEffect(() => {
    localStorage.setItem('portal_assignment_mentors', JSON.stringify(mentors));
  }, [mentors]);

  const [selectedStudent, setSelectedStudent] = useState<UnassignedStudent | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const handleSelectStudent = (student: UnassignedStudent) => {
    setSelectedStudent(student);
    setConflictWarning(null);
  };

  const handleAssignToMentor = (mentorId: string) => {
    if (!selectedStudent) return;

    const mentor = mentors.find((m) => m.id === mentorId);
    if (!mentor) return;

    // Check conflict 1: Overcapacity
    if (mentor.assignedCount >= mentor.maxCapacity) {
      setConflictWarning(`Conflict Warning: ${mentor.name} is already at full capacity (${mentor.assignedCount}/${mentor.maxCapacity}). Force assignment anyway?`);
      return;
    }

    // Check conflict 2: Subject mismatch
    const isSubjectMismatch = mentor.specialty.toLowerCase() !== selectedStudent.subjectNeed.toLowerCase();
    if (isSubjectMismatch) {
      setConflictWarning(`Subject Conflict: ${selectedStudent.name} requested ${selectedStudent.subjectNeed} support, but ${mentor.name} specializes in ${mentor.specialty}. Allocate anyway?`);
      return;
    }

    executeAssignment(mentorId);
  };

  const executeAssignment = (mentorId: string) => {
    if (!selectedStudent) return;
    
    const mentor = mentors.find((m) => m.id === mentorId)!;

    // Update unassigned students
    setUnassigned((prev) => prev.filter((s) => s.id !== selectedStudent.id));
    
    // Update mentors capacity lists
    setMentors((prev) =>
      prev.map((m) => {
        if (m.id === mentorId) {
          return {
            ...m,
            assignedCount: m.assignedCount + 1,
            activeStudents: [...m.activeStudents, selectedStudent.name]
          };
        }
        return m;
      })
    );

    setSuccessMessage(`Success: ${selectedStudent.name} has been allocated to ${mentor.name} for ${selectedStudent.subjectNeed}! Schedule is active on calendar.`);
    setSelectedStudent(null);
    setConflictWarning(null);

    // Clear message after timer
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4500);
  };

  const handleForceAssignment = (mentorId: string) => {
    executeAssignment(mentorId);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Mentor Assignments</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Allocate mentors to unassigned students, inspect capacities, and manage subject alignments</p>
        </div>
      </div>

      {/* Messaging Banners */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/80 rounded-2xl flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-green-800 dark:text-green-300">Assignment Complete</h5>
              <p className="text-[11px] text-green-700 dark:text-green-400 mt-0.5 font-medium leading-normal">{successMessage}</p>
            </div>
          </motion.div>
        )}

        {conflictWarning && selectedStudent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300">Safety Check Conflict Warning</h5>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-medium leading-normal">{conflictWarning}</p>
              <div className="flex gap-2 mt-3">
                {/* Find the selected mentor from warning trigger context */}
                {mentors.map((m) => {
                  if (conflictWarning.includes(m.name)) {
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleForceAssignment(m.id)}
                        className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Override & Allocate
                      </button>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => setConflictWarning(null)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-semibold cursor-pointer"
                >
                  Cancel Assignment
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Unassigned Students list (4 columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-700/50 pb-3">
            <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Unassigned Students ({unassigned.length})</span>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">Select a student from the list to assign them a mentor</p>
          </div>

          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {unassigned.map((student) => {
              const isSelected = selectedStudent?.id === student.id;
              return (
                <div
                  key={student.id}
                  onClick={() => handleSelectStudent(student)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/10'
                      : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-750/30 hover:border-blue-200 dark:hover:border-blue-900/40 hover:bg-slate-100/30 dark:hover:bg-slate-850/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-lg object-cover ring-2 ring-white shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <h4 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'} truncate`}>
                        {student.name}
                      </h4>
                      <p className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {student.grade}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-blue-500 text-white border border-blue-400'
                      : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                  } shrink-0`}>
                    {student.subjectNeed}
                  </span>
                </div>
              );
            })}
            {unassigned.length === 0 && (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <Sparkles className="w-8 h-8 text-teal-500" />
                <span className="font-semibold text-xs text-slate-600 dark:text-slate-300">Cohort Perfectly Aligned!</span>
                <p className="text-[10px] text-slate-400 px-6">All registered students have active, allocated mentorship licenses.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Available Mentors capacity mapping (7 columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-700/50 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-teal-500" />
                <span>Available Mentors Directory</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Live allocation workloads and specialized domains</p>
            </div>
            {selectedStudent && (
              <div className="text-right shrink-0">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Allocating</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">{selectedStudent.name}</span>
              </div>
            )}
          </div>

          <div className="space-y-3.5">
            {mentors.map((mentor) => {
              const capRatio = mentor.assignedCount / mentor.maxCapacity;
              const isFull = mentor.assignedCount >= mentor.maxCapacity;
              
              // Highlight mentor if specialties align with the selected student's subject need
              const isMatch = selectedStudent && mentor.specialty.toLowerCase() === selectedStudent.subjectNeed.toLowerCase();

              return (
                <div
                  key={mentor.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isMatch
                      ? 'border-teal-400/80 bg-teal-50/20 dark:bg-teal-950/20 ring-1 ring-teal-400/20'
                      : 'border-slate-100 dark:border-slate-750/30 bg-slate-50/30 dark:bg-slate-900/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={mentor.avatar}
                        alt={mentor.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                          <span>{mentor.name}</span>
                          {isMatch && (
                            <span className="text-[8px] uppercase font-black bg-teal-500 text-white px-1.5 py-0.25 rounded shadow-sm flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> Best Subject Fit
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Domain: <strong className="text-slate-600 dark:text-slate-300">{mentor.specialty}</strong></p>
                      </div>
                    </div>

                    {/* Capacity Indicator progress bar */}
                    <div className="flex items-center gap-3 sm:w-44">
                      <div className="flex-1">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1">
                          <span>Allocations</span>
                          <span className={isFull ? 'text-red-500 font-black' : 'text-slate-600 dark:text-slate-300'}>
                            {mentor.assignedCount}/{mentor.maxCapacity} Full
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFull ? 'bg-red-500' : capRatio >= 0.8 ? 'bg-amber-500' : 'bg-teal-500'
                            }`}
                            style={{ width: `${(mentor.assignedCount / mentor.maxCapacity) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      {/* Action trigger button */}
                      <button
                        disabled={!selectedStudent}
                        onClick={() => handleAssignToMentor(mentor.id)}
                        className={`p-1.5 rounded-lg border transition-all ${
                          !selectedStudent
                            ? 'opacity-30 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-sm cursor-pointer'
                        }`}
                        title={selectedStudent ? `Assign ${selectedStudent.name} to ${mentor.name}` : 'Select a student first'}
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* List of active student names allocated to this mentor */}
                  {mentor.activeStudents.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-750/40 flex flex-wrap gap-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 mr-1 mt-0.5">Tutees:</span>
                      {mentor.activeStudents.map((studName) => (
                        <span key={studName} className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                          {studName}
                        </span>
                      ))}
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
}
