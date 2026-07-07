/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardCheck,
  Star,
  Users,
  Compass,
  AlertTriangle,
  Award,
  Sparkles,
  ChevronDown,
  CheckCircle,
  HelpCircle,
  HeartHandshake,
  MessageSquare,
  Edit,
  ClipboardList,
  Save
} from 'lucide-react';
import { CustomRadarChart } from '../Charts';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

interface EvaluationsViewProps {
  selectedOrg?: string;
  preselectedStudent?: string | null;
  clearPreselected?: () => void;
}

export default function EvaluationsView({ 
  selectedOrg = 'All Organizations',
  preselectedStudent,
  clearPreselected
}: EvaluationsViewProps) {
  const { currentUser, hasPermission, logSecurityAudit } = useAuth();
  
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [evaluationsList, setEvaluationsList] = useState<any[]>([]);
  const [activeStudentName, setActiveStudentName] = useState('');
  
  const [activeEvalId, setActiveEvalId] = useState('');
  const [isNewEvaluation, setIsNewEvaluation] = useState(true);
  const [academic, setAcademic] = useState(85);
  const [behaviour, setBehaviour] = useState(90);
  const [attendance, setAttendance] = useState(95);
  const [communication, setCommunication] = useState(82);

  const [tutorComments, setTutorComments] = useState('');
  const [improvementAreas, setImprovementAreas] = useState('');
  const [goals, setGoals] = useState('');
  const [parentFeedback, setParentFeedback] = useState('');
  const [isSigned, setIsSigned] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canRead = hasPermission('Student Evaluations', 'read');
  const canUpdate = hasPermission('Student Evaluations', 'update') || hasPermission('Student Evaluations', 'approve');

  const loadData = async () => {
    if (!currentUser || !canRead) return;

    try {
      const orgToFilter = currentUser.role === 'Super Admin'
        ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
        : currentUser.organization;

      // 1. Fetch accessible students
      let students: any[] = [];
      
      if (currentUser.role === 'Student') {
        const { data: selfStudent, error: selfErr } = await supabase
          .from('students')
          .select('*')
          .eq('email', currentUser.email)
          .maybeSingle();
        
        if (selfErr) {
          console.error('Error fetching self student profile:', selfErr);
        }
        
        students = [selfStudent || { 
          id: 'student-self', 
          name: currentUser.name, 
          email: currentUser.email, 
          progress: 0, 
          attendance: 0 
        }];
      } else {
        let studentsQuery = supabase.from('students').select('*').order('name', { ascending: true });
        
        if (orgToFilter) {
          studentsQuery = studentsQuery.eq('organization', orgToFilter);
        }
        
        if (currentUser.role === 'Mentor') {
          studentsQuery = studentsQuery.eq('mentor', currentUser.name);
        } else if (currentUser.role === 'Assistant') {
          let mentorName = currentUser.mentorName;
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
            studentsQuery = studentsQuery.eq('mentor', mentorName);
          } else {
            studentsQuery = studentsQuery.eq('mentor', 'NONE_ASSIGNED');
          }
        }

        const { data: fetchedStudents, error: studErr } = await studentsQuery;
        if (studErr) {
          console.error('Error fetching students:', studErr);
          return;
        }
        students = fetchedStudents || [];
      }

      setStudentsList(students);

      // 2. Fetch existing evaluations for these students
      let evalsQuery = supabase.from('evaluations').select('*').order('created_at', { ascending: false });
      if (orgToFilter) {
        evalsQuery = evalsQuery.eq('organization', orgToFilter);
      }

      if (students && students.length > 0) {
        const studentNames = students.map(s => s.name);
        evalsQuery = evalsQuery.in('studentName', studentNames);
      } else {
        evalsQuery = evalsQuery.eq('studentName', 'NONE_ASSIGNED');
      }

      const { data: evals, error: evalErr } = await evalsQuery;
      if (evalErr) {
        console.error('Error fetching evaluations:', evalErr);
      }

      setEvaluationsList(evals || []);

      // 3. Resolve active selection
      if (students && students.length > 0) {
        let initialStudentName = students[0].name || '';

        if (preselectedStudent && students.some(s => s.name === preselectedStudent)) {
          initialStudentName = preselectedStudent;
        } else if (activeStudentName && students.some(s => s.name === activeStudentName)) {
          initialStudentName = activeStudentName;
        }

        setActiveStudentName(initialStudentName);
      }
    } catch (err) {
      console.error('loadData error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, canRead, selectedOrg]);

  // Load selected student's evaluation details
  useEffect(() => {
    if (!activeStudentName) return;

    if (preselectedStudent === activeStudentName && clearPreselected) {
      clearPreselected();
    }

    const existingEval = evaluationsList.find(e => e.studentName === activeStudentName);
    if (existingEval) {
      setActiveEvalId(existingEval.id);
      setAcademic(existingEval.academic);
      setBehaviour(existingEval.behaviour);
      setAttendance(existingEval.attendance);
      setCommunication(existingEval.communication);
      setTutorComments(existingEval.tutorComments || '');
      setImprovementAreas(existingEval.improvementAreas || '');
      setGoals(existingEval.goals || '');
      setParentFeedback(existingEval.parentFeedback || '');
      setIsSigned(existingEval.isSigned || false);
      setIsNewEvaluation(false);
    } else {
      const currentStudent = studentsList.find(s => s.name === activeStudentName);
      setActiveEvalId(`eval-${Date.now()}`);
      setAcademic(currentStudent ? currentStudent.progress : 85);
      setBehaviour(90);
      setAttendance(currentStudent ? currentStudent.attendance : 95);
      setCommunication(82);
      setTutorComments('');
      setImprovementAreas('');
      setGoals('1. Solve 10 calculus section C problems weekly.\n2. Read pre-class literature topics ahead.\n3. Achieve 90% or above in upcoming mid-term mock evaluation.');
      setParentFeedback('');
      setIsSigned(false);
      setIsNewEvaluation(true);
    }
  }, [activeStudentName, evaluationsList, studentsList]);

  // Set up real-time subscription for evaluations and students tables
  useEffect(() => {
    if (!currentUser || !canRead) return;

    const channel = supabase
      .channel('evaluations-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evaluations' },
        () => { loadData(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => { loadData(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, canRead, selectedOrg]);

  // Math calculated overall score
  const overallScore = Math.round((academic + behaviour + attendance + communication) / 4);

  const handleSave = async (signedStatus: boolean = false) => {
    if (!canUpdate) {
      alert("You do not have permission to update student evaluations.");
      return;
    }

    setIsSaving(true);
    const org = currentUser?.organization || selectedOrg || 'All Organizations';
    const currentActiveName = activeStudentName || (studentsList.length > 0 ? studentsList[0].name : '');
    
    if (!activeStudentName && currentActiveName) {
      setActiveStudentName(currentActiveName);
    }

    const payload = {
      id: activeEvalId || `eval-${Date.now()}`,
      studentName: currentActiveName,
      academic,
      behaviour,
      attendance,
      communication,
      tutorComments,
      improvementAreas,
      goals,
      parentFeedback,
      isSigned: signedStatus,
      organization: org === 'All Organizations' ? 'Bright Future Academy' : org
    };

    try {
      let error;
      if (isNewEvaluation) {
        const { error: insErr } = await supabase.from('evaluations').insert(payload);
        error = insErr;
      } else {
        const { error: updErr } = await supabase.from('evaluations').update(payload).eq('id', activeEvalId);
        error = updErr;
      }

      if (error) {
        throw new Error(error.message);
      }

      // Sync evaluation parameters (Academic Score -> progress, Attendance Ratio -> attendance) to students table
      const { error: syncErr } = await supabase
        .from('students')
        .update({
          progress: academic,
          attendance: attendance
        })
        .eq('name', currentActiveName);
      if (syncErr) {
        console.warn('Failed to sync evaluation metrics to students table:', syncErr.message);
      }

      setToastMessage(signedStatus ? 'Evaluation report generated, signed, and published!' : 'Draft evaluation saved successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      // Log security audit
      await logSecurityAudit(
        isNewEvaluation ? 'Create Evaluation' : 'Update Evaluation',
        'Info',
        `User ${currentUser?.email} (${currentUser?.role}) saved evaluation for student ${activeStudentName}`
      );

      // Refresh data
      await loadData();
    } catch (err: any) {
      console.error('Error saving evaluation:', err);
      alert('Failed to save evaluation to database: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Security Access Violation</h3>
        <p className="text-xs text-slate-400 mt-2 max-w-sm">
          You do not hold the required authorization credentials to view academic evaluations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs"
          >
            <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
            <span className="font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              {currentUser?.role === 'Student' ? 'My Report Card' : 'Student Evaluations'}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
              {currentUser?.role === 'Student' 
                ? 'View your latest evaluation metrics, tutor comments, and learning milestones' 
                : 'Build diagnostic score cards, adjust academic performance, behavioral, and communication factors'}
            </p>
          </div>
          {currentUser?.role !== 'Student' && studentsList.length > 0 ? (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-xs shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400">Select Student:</span>
              <select
                value={activeStudentName}
                onChange={(e) => setActiveStudentName(e.target.value)}
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-none focus:outline-none cursor-pointer font-sans"
              >
                {studentsList.map(stud => (
                  <option key={stud.id} value={stud.name} className="bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 font-sans">
                    {stud.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            studentsList.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200/40 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-xs shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400">Student:</span>
                <span className="text-xs font-bold text-slate-705 dark:text-slate-200">{activeStudentName}</span>
              </div>
            )
          )}
        </div>
        {currentUser?.role !== 'Student' && studentsList.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-105 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-205 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>{isSigned ? 'Republish Evaluation' : 'Publish & Dispatch'}</span>
            </button>
          </div>
        )}
      </div>

      {studentsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-650 mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No tutees / students found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">There are no academic students assigned to your profile in this organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Parameters Slider Panel (4 columns) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-500" />
                <span>Diagnostic Parameters</span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Slide or input factors to recalculate average scores</p>
            </div>

            <div className="space-y-4">
              {/* Academic slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Academic Score</span>
                  <span className="font-mono text-blue-600 font-bold">{academic}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={academic}
                  onChange={(e) => setAcademic(Number(e.target.value))}
                  disabled={currentUser?.role === 'Student'}
                  className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg"
                />
              </div>

              {/* Behaviour Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Behaviour & Conduct</span>
                  <span className="font-mono text-teal-500 font-bold">{behaviour}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={behaviour}
                  onChange={(e) => setBehaviour(Number(e.target.value))}
                  disabled={currentUser?.role === 'Student'}
                  className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg"
                />
              </div>

              {/* Attendance Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Attendance Ratio</span>
                  <span className="font-mono text-indigo-500 font-bold">{attendance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={attendance}
                  onChange={(e) => setAttendance(Number(e.target.value))}
                  disabled={currentUser?.role === 'Student'}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg"
                />
              </div>

              {/* Communication Slider */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Communication Index</span>
                  <span className="font-mono text-purple-500 font-bold">{communication}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={communication}
                  onChange={(e) => setCommunication(Number(e.target.value))}
                  disabled={currentUser?.role === 'Student'}
                  className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg"
                />
              </div>
            </div>

            {/* Overall calculations panel */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-750/30 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Calculated Diagnostic Rating</span>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-1.5 leading-none">{overallScore}%</h2>
              <span className="text-[9.5px] text-teal-650 font-extrabold bg-teal-500/10 dark:text-teal-400 px-2 py-0.5 rounded-full inline-block mt-2">
                Grade Achievement: {overallScore >= 90 ? 'Grade A+' : overallScore >= 80 ? 'Grade A' : 'Grade B'}
              </span>
            </div>
          </div>

          {/* Middle: Radar Chart & Comments (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Radar Chart Component imported */}
            <CustomRadarChart 
              academic={academic} 
              attendance={attendance} 
              behaviour={behaviour} 
              communication={communication} 
            />

            {/* Tutor comments form */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center justify-between">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                  <Edit className="w-4.5 h-4.5 text-blue-500" />
                  <span>Mentor Remarks</span>
                </h4>
                <span className="text-[9px] text-slate-400 font-mono">Feedback Summary</span>
              </div>
              
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Qualitative comments</label>
                  <textarea
                    value={tutorComments}
                    onChange={(e) => setTutorComments(e.target.value)}
                    disabled={currentUser?.role === 'Student'}
                    placeholder="Enter academic performance comments, conduct feedback..."
                    className="w-full min-h-[90px] p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-650 dark:text-slate-300 leading-normal focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Top Improvement Areas</label>
                  <input
                    type="text"
                    value={improvementAreas}
                    onChange={(e) => setImprovementAreas(e.target.value)}
                    disabled={currentUser?.role === 'Student'}
                    placeholder="E.g. Speed revision in algebra, slow down on derivative tasks..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-650 dark:text-slate-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right: Goals & Parent Feedback (3 columns) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Concrete academic milestones / goals */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="border-b border-slate-50 dark:border-slate-700 pb-2">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  <span>Next Term Milestones</span>
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Automated and custom milestones</p>
              </div>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                disabled={currentUser?.role === 'Student'}
                placeholder="1. Goal one..."
                className="w-full min-h-[120px] p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] leading-normal font-medium text-slate-650 dark:text-slate-300 focus:outline-none resize-none font-mono"
              />
            </div>

            {/* Parental signature and comments feedback block */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center justify-between">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-500" />
                  <span>Guardians Endorsement</span>
                </h4>
                <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded ${isSigned ? 'bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'}`}>
                  {isSigned ? 'Signed' : 'Awaiting Signature'}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Guardian Reply Feedback</span>
                  <p className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-150 dark:border-slate-850 text-[11px] leading-normal font-medium text-slate-550 dark:text-slate-355 min-h-[60px]">
                    {parentFeedback || 'No reply has been recorded from the guardians yet.'}
                  </p>
                </div>

                {/* Sign action toggle button */}
                <button
                  type="button"
                  onClick={async () => {
                    if (currentUser?.role === 'Student') return;
                    const nextSigned = !isSigned;
                    setIsSigned(nextSigned);
                    if (!isNewEvaluation) {
                      const { error } = await supabase.from('evaluations').update({ isSigned: nextSigned }).eq('id', activeEvalId);
                      if (error) {
                        console.error('Error updating signature:', error);
                      } else {
                        await logSecurityAudit(
                          'Update Evaluation Signature',
                          'Info',
                          `User updated signature status to ${nextSigned} for student ${activeStudentName}`
                        );
                        // Reload evaluations in place
                        let query = supabase.from('evaluations').select('*');
                        const orgToFilter = currentUser.role === 'Super Admin'
                          ? (selectedOrg === 'All Organizations' ? null : selectedOrg)
                          : currentUser.organization;
                        if (orgToFilter) {
                          query = query.eq('organization', orgToFilter);
                        }
                        if (studentsList && studentsList.length > 0) {
                          const studentNames = studentsList.map(s => s.name);
                          query = query.in('studentName', studentNames);
                        }
                        const { data: evals } = await query;
                        if (evals) {
                          setEvaluationsList(evals);
                        }
                      }
                    }
                  }}
                  disabled={currentUser?.role === 'Student'}
                  className={`w-full py-2 border rounded-xl text-[10px] font-bold cursor-pointer transition-colors ${
                    isSigned 
                      ? 'border-emerald-250 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800' 
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isSigned ? 'Remove Guardian Signature' : 'Affix Guardian Signature'}
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
