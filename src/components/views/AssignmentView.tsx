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

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

interface AssignmentViewProps {
  selectedOrg?: string;
}

export default function AssignmentView({ selectedOrg = 'All Organizations' }: AssignmentViewProps) {
  const { currentUser } = useAuth();
  const [unassigned, setUnassigned] = useState<UnassignedStudent[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);

  // Student specific assignment states
  const [curriculumAssignments, setCurriculumAssignments] = useState<any[]>([]);
  const [sessionHomeworks, setSessionHomeworks] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'homework'>('materials');
  const [isLoadingStudent, setIsLoadingStudent] = useState<boolean>(false);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'Student') return;
    async function loadStudentAssignments() {
      setIsLoadingStudent(true);
      // Fetch curriculum worksheets/assignments
      const { data: resData } = await supabase
        .from('content_resources')
        .select('*')
        .eq('type', 'Assignment')
        .or(`organization.eq.Global,organization.eq.${currentUser.organization}`);
      if (resData) {
        setCurriculumAssignments(resData);
      }

      // Fetch sessions to extract homework
      const { data: sessData } = await supabase
        .from('sessions')
        .select('*')
        .ilike('student', `%${currentUser.name}%`)
        .order('date', { ascending: false });
      if (sessData) {
        // Only keep sessions that have homework
        const homeworkSesses = sessData.filter(s => s.homework && s.homework.trim().length > 0);
        setSessionHomeworks(homeworkSesses);
      }
      setIsLoadingStudent(false);
    }
    loadStudentAssignments();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role === 'Student') return;
    async function loadData() {
      const orgToFilter = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
        : currentUser.organization;

      let unasQuery = supabase.from('unassigned_students').select('*');
      let mentsQuery = supabase.from('assignment_mentors').select('*').order('name');

      if (orgToFilter) {
        unasQuery = unasQuery.eq('organization', orgToFilter);
        mentsQuery = mentsQuery.eq('organization', orgToFilter);
      }

      const { data: unas, error: unasErr } = await unasQuery;
      if (!unasErr && unas) {
        setUnassigned(unas);
      }

      const { data: ments, error: mentsErr } = await mentsQuery;
      if (!mentsErr && ments) {
        setMentors(ments);
      }
    }
    loadData();
  }, [currentUser, selectedOrg]);

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

  const executeAssignment = async (mentorId: string) => {
    if (!selectedStudent) return;
    
    const mentor = mentors.find((m) => m.id === mentorId)!;

    const { error: delErr } = await supabase
      .from('unassigned_students')
      .delete()
      .eq('id', selectedStudent.id);

    if (delErr) {
      console.error(delErr);
      alert('Error updating unassigned students: ' + delErr.message);
      return;
    }

    const updatedMentor = {
      assignedCount: mentor.assignedCount + 1,
      activeStudents: [...mentor.activeStudents, selectedStudent.name]
    };

    const { error: updErr } = await supabase
      .from('assignment_mentors')
      .update(updatedMentor)
      .eq('id', mentorId);

    if (updErr) {
      console.error(updErr);
      alert('Error updating mentor assignment: ' + updErr.message);
      return;
    }

    setUnassigned((prev) => prev.filter((s) => s.id !== selectedStudent.id));
    setMentors((prev) =>
      prev.map((m) => {
        if (m.id === mentorId) {
          return {
            ...m,
            ...updatedMentor
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

  if (currentUser?.role === 'Student') {
    return (
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">My Assignments &amp; Homework</h1>
            <p className="text-xs text-slate-400 mt-0.5">Access worksheets, download practice question papers, and track homework assigned during classes</p>
          </div>

          {/* Sub-tab selection */}
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex self-start sm:self-auto">
            <button
              onClick={() => setActiveSubTab('materials')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'materials'
                  ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Curriculum Materials ({curriculumAssignments.length})
            </button>
            <button
              onClick={() => setActiveSubTab('homework')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'homework'
                  ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-750 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Class Homework Tasks ({sessionHomeworks.length})
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoadingStudent ? (
          <div className="min-h-[250px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : activeSubTab === 'materials' ? (
          /* Sub-tab 1: Curriculum Material / Worksheets */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curriculumAssignments.map((res) => (
              <div key={res.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between group">
                <div className="relative h-32 bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <img
                    src={res.thumbnail || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=300'}
                    alt={res.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-600/90 text-white font-bold text-[9px] uppercase tracking-wider">
                    {res.category}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors leading-snug line-clamp-2">
                      {res.title}
                    </h4>
                    <p className="text-[10px] text-slate-400">Author: {res.author} · Format: {res.type}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-750 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">{res.size}</span>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert('Downloading assignment file...'); }}
                      className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md text-[10px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              </div>
            ))}
            {curriculumAssignments.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400">No learning worksheets found.</div>
            )}
          </div>
        ) : (
          /* Sub-tab 2: Class Homework Tasks */
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-850 text-slate-400 uppercase text-[9px] font-bold tracking-wider">
                    <th className="p-4">Assigned Date</th>
                    <th className="p-4">Mentor Name</th>
                    <th className="p-4">Class Category</th>
                    <th className="p-4">Homework Details</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-850 font-medium">
                  {sessionHomeworks.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-750/30 transition-colors text-slate-700 dark:text-slate-350">
                      <td className="p-4 whitespace-nowrap font-mono text-[10px] text-slate-400">
                        {new Date(sess.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 whitespace-nowrap text-slate-800 dark:text-white font-bold">{sess.mentor}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {sess.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 max-w-sm font-normal leading-normal py-3.5">
                        {sess.homework}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          sess.status === 'Completed'
                            ? 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                        }`}>
                          {sess.status === 'Completed' ? 'Submitted / Completed' : 'Pending Action'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sessionHomeworks.length === 0 && (
                <div className="py-16 text-center text-slate-400">No active homework tasks assigned from your classes.</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

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
                      {mentor.avatar ? (
                        <img
                          src={mentor.avatar}
                          alt={mentor.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 ring-2 ring-white flex items-center justify-center text-slate-400 dark:text-slate-500 font-extrabold text-xs select-none shrink-0">
                          {mentor.name.trim().charAt(0).toUpperCase()}
                        </div>
                      )}
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
