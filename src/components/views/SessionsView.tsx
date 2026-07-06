/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Clock,
  Lock,
  Users,
  Mic,
  MicOff,
  Paperclip,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  Volume2,
  ChevronDown,
  BookOpen,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Session } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

interface SessionsViewProps {
  selectedOrg?: string;
}

export default function SessionsView({ selectedOrg = 'All Organizations' }: SessionsViewProps) {
  const { currentUser } = useAuth();
  const [sessionsList, setSessionsList] = useState<Session[]>([]);
  const [activeSessionIdx, setActiveSessionIdx] = useState(0);
  const [privateNotes, setPrivateNotes] = useState('');
  const [sharedNotes, setSharedNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionPicker, setShowSessionPicker] = useState(false);

  // ── Load sessions from Supabase filtered by org / role ──────────────────────
  useEffect(() => {
    if (!currentUser) return;
    async function loadSessions() {
      setIsLoading(true);
      let query = supabase.from('sessions').select('*').order('date', { ascending: false });

      const orgToFilter =
        currentUser.role === 'Super Admin'
          ? selectedOrg === 'All Organizations'
            ? null
            : selectedOrg
          : currentUser.organization;

      if (orgToFilter) query = query.eq('organization', orgToFilter);

      if (currentUser.role === 'Mentor') {
        query = query.eq('mentor', currentUser.name);
      } else if (currentUser.role === 'Assistant') {
        let mentorName = currentUser.mentorName;
        // Fallback: resolve mentorName via RPC if not set at login time
        if (!mentorName && currentUser.mentor_id) {
          const { data: resolved } = await supabase
            .rpc('get_assistant_mentor_name', { assistant_mentor_id: currentUser.mentor_id });
          if (resolved) mentorName = resolved;
        }
        if (!mentorName) {
          const { data: resolved } = await supabase
            .rpc('get_mentor_name_for_assistant_email', { assistant_email: currentUser.email });
          if (resolved) mentorName = resolved;
        }
        if (mentorName) query = query.eq('mentor', mentorName);
      } else if (currentUser.role === 'Student') {
        query = query.eq('student', currentUser.name);
      }

      const { data, error } = await query;
      if (!error && data) {
        setSessionsList(data);
        setActiveSessionIdx(0);
      }
      setIsLoading(false);
    }
    loadSessions();
  }, [currentUser, selectedOrg]);


  // ── Sync edit states when active session changes ─────────────────────────────
  useEffect(() => {
    const active = sessionsList[activeSessionIdx];
    if (active) {
      setPrivateNotes(active.privateNotes || '');
      setSharedNotes(active.sharedNotes || '');
      setAttachments(active.files || []);
      setVoiceNotes(active.voiceNotesUrl ? [active.voiceNotesUrl] : []);
    }
  }, [activeSessionIdx, sessionsList]);

  const activeSession = sessionsList[activeSessionIdx];

  // Previous sessions (all except active) for the right-panel timeline
  const previousSessions = sessionsList.filter((_, idx) => idx !== activeSessionIdx).slice(0, 5);

  // ── Save notes to Supabase ───────────────────────────────────────────────────
  const handleSaveNotes = async () => {
    if (!activeSession) return;
    const { error } = await supabase
      .from('sessions')
      .update({
        privateNotes,
        sharedNotes,
        files: attachments,
        voiceNotesUrl: voiceNotes[0] || null,
      })
      .eq('id', activeSession.id);

    if (error) {
      console.error(error);
      alert('Error saving notes: ' + error.message);
      return;
    }

    setSessionsList((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, privateNotes, sharedNotes, files: attachments, voiceNotesUrl: voiceNotes[0] }
          : s
      )
    );

    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // ── Voice recording simulation ───────────────────────────────────────────────
  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      const newVoiceNote = `Voice_Note_${new Date().toLocaleDateString('en-IN').replace(/\//g, '_')}.wav (0:28) - Transcribing...`;
      setVoiceNotes((prev) => [newVoiceNote, ...prev]);
      setTimeout(() => {
        setVoiceNotes((prev) =>
          prev.map((v, idx) =>
            idx === 0
              ? `Voice_Note_Rec_Success.wav (0:28) - "${activeSession?.student ?? 'Student'} showed strong understanding"`
              : v
          )
        );
      }, 3000);
    }
  };

  const handleAddAttachment = () => {
    const files = ['session_worksheet.pdf', 'homework_task.png', 'practice_problems.pdf', 'study_guide.docx'];
    const randomFile = files[Math.floor(Math.random() * files.length)];
    if (!attachments.includes(randomFile)) {
      setAttachments((prev) => [...prev, randomFile]);
    }
  };

  // ── Helper: format date nicely ───────────────────────────────────────────────
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading session notes{selectedOrg !== 'All Organizations' ? ` for ${selectedOrg}` : ''}…</p>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (sessionsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-slate-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-700 dark:text-white">No Sessions Found</h2>
          <p className="text-sm text-slate-400 mt-1">
            {selectedOrg !== 'All Organizations'
              ? `No sessions exist yet for ${selectedOrg}.`
              : 'No sessions have been recorded yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Save Toast notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">Notes saved and synchronized successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Classnotes &amp; Transcripts
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Draft private observations, compose parental shared bulletins, record dictations, and review timeline
            {selectedOrg !== 'All Organizations' && (
              <span className="ml-1 text-blue-500 font-semibold">— {selectedOrg}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleSaveNotes}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Classnotes</span>
        </button>
      </div>

      {/* ── Session Picker ───────────────────────────────────────────────────── */}
      <div className="relative">
        <button
          onClick={() => setShowSessionPicker((v) => !v)}
          className="w-full sm:w-auto flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-xs font-semibold text-slate-700 dark:text-white hover:border-blue-400 transition-colors cursor-pointer"
        >
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="truncate max-w-xs">
            {activeSession
              ? `${activeSession.student} · ${activeSession.category} · ${formatDate(activeSession.date)}`
              : 'Select Session'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-auto transition-transform ${showSessionPicker ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showSessionPicker && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-1.5 left-0 z-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-full sm:w-[520px] max-h-72 overflow-y-auto"
            >
              {sessionsList.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveSessionIdx(idx); setShowSessionPicker(false); }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0 cursor-pointer ${idx === activeSessionIdx ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    s.status === 'Completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                    s.status === 'Upcoming' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                    'bg-rose-100 text-rose-600 dark:bg-rose-900/30'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{s.student}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        s.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        s.status === 'Upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>{s.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {s.category} · Mentor: {s.mentor} · {formatDate(s.date)}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Side: Note Editor (8 columns) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Active Session details bar — fully dynamic */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Editing Active Classnote</span>
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mt-0.5">
                  {activeSession
                    ? `Student: ${activeSession.student} · ${activeSession.category}`
                    : 'No session selected'}
                </h3>
                {activeSession && (
                  <p className="text-[9px] text-slate-400 mt-0.5">Mentor: {activeSession.mentor}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-slate-400 font-mono font-medium">
                Session: {activeSession ? formatDate(activeSession.date) : '—'}
              </span>
              {activeSession && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  activeSession.status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : activeSession.status === 'Upcoming'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                }`}>
                  {activeSession.status}
                </span>
              )}
            </div>
          </div>

          {/* Dual Notes Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Private notes */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-700 pb-2 mb-3">
                  <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">Private Observations</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Internal only (hidden from parents)</p>
                  </div>
                </div>
                <textarea
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  className="w-full min-h-[160px] p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans leading-normal resize-none"
                  placeholder="Type confidential observations, focus areas..."
                />
              </div>
            </div>

            {/* Shared Notes (Parents Bulletin) */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-700 pb-2 mb-3">
                  <Users className="w-4 h-4 text-teal-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-xs">Parental Shared Bulletin</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Shared notes (visible to guardians)</p>
                  </div>
                </div>
                <textarea
                  value={sharedNotes}
                  onChange={(e) => setSharedNotes(e.target.value)}
                  className="w-full min-h-[160px] p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-sans leading-normal resize-none"
                  placeholder="Type achievements, test results, homework assignments..."
                />
              </div>
            </div>
          </div>

          {/* Voice Notes & Attachments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Dictations recorder */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="border-b border-slate-50 dark:border-slate-700 pb-2.5">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-blue-500" />
                  <span>Voice dictation transcriptions</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Record live lesson audio for AI-powered summaries</p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">
                    {isRecording ? 'Recording active audio...' : 'Microphone Ready'}
                  </span>
                  <p className="text-[9px] text-slate-400 mt-0.5 truncate">
                    {isRecording
                      ? 'Capturing class presentation... Click again to process transcript.'
                      : 'Click mic to record summaries.'}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
                {voiceNotes.map((note, noteIdx) => (
                  <div key={noteIdx} className="p-2 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 rounded-lg flex items-center gap-2 text-[10px]">
                    <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate font-medium text-slate-500 dark:text-slate-400">{note}</span>
                  </div>
                ))}
                {voiceNotes.length === 0 && (
                  <div className="py-4 text-center text-[11px] text-slate-400">No recordings yet.</div>
                )}
              </div>
            </div>

            {/* Attachments Section */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="border-b border-slate-50 dark:border-slate-700 pb-2.5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-teal-500" />
                    <span>Homework attachments</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Share curriculum resources with the student</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddAttachment}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                  title="Upload resource"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {attachments.map((file, fIdx) => (
                  <div key={fIdx} className="p-2.5 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between gap-2 text-[10px] group/item">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate font-bold text-slate-600 dark:text-slate-300">{file}</span>
                    </div>
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((a) => a !== file))}
                      className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded transition-all shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {attachments.length === 0 && (
                  <div className="py-6 text-center text-[11px] text-slate-400">
                    No active homework attachments uploaded.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Timeline History (4 columns) */}
        <div className="lg:col-span-4 space-y-6">

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Previous Notes Timeline</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeSession
                  ? `Other sessions for ${activeSession.organization || selectedOrg}`
                  : 'Historic lessons list'}
              </p>
            </div>

            <div className="space-y-3">
              {previousSessions.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-slate-400 flex flex-col items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-slate-300" />
                  <span>No other sessions available.</span>
                </div>
              ) : (
                previousSessions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const idx = sessionsList.findIndex((s) => s.id === item.id);
                      if (idx !== -1) setActiveSessionIdx(idx);
                    }}
                    className="w-full text-left p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/30 rounded-xl space-y-1.5 text-xs hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono text-slate-400">{formatDate(item.date)}</span>
                      <span className={`font-bold text-[9px] px-1.5 py-0.5 rounded-full ${
                        item.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : item.status === 'Upcoming'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                      }`}>{item.status}</span>
                    </div>
                    <h5 className="font-bold text-slate-700 dark:text-slate-300 leading-tight">
                      {item.student} · {item.category}
                    </h5>
                    <p className="text-[10px] text-slate-400 font-medium">Mentor: {item.mentor}</p>
                    {item.notes && (
                      <p className="text-[10px] text-slate-400 truncate">{item.notes}</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
