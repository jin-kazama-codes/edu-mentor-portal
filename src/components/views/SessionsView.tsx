/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Clock,
  Sparkles,
  Lock,
  Users,
  Mic,
  MicOff,
  Paperclip,
  Save,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  Volume2
} from 'lucide-react';
import { sessions as initialSessions } from '../../data/mockData';

export default function SessionsView() {
  const [activeSessionIdx, setActiveSessionIdx] = useState(0);
  const [privateNotes, setPrivateNotes] = useState('Zoya completed the derivatives exercises live but showed slight hesitation with the Chain Rule. Advised her to solve 10 targeted problems. Parents need to encourage her, as she seems under self-imposed pressure.');
  const [sharedNotes, setSharedNotes] = useState('Excellent progress! Zoya scored 9/10 in our live differentiation quiz today. We reviewed the Product Rule and Quotient Rule in detail. Homework consists of CBSE section C questions.');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState<string[]>([
    'Voice_Note_July_02_Calculus.wav (0:45) - Transcribed'
  ]);
  const [attachments, setAttachments] = useState<string[]>([
    'calculus_derivatives_quiz_solutions.pdf'
  ]);
  const [showNotification, setShowNotification] = useState(false);

  const sampleLessonsTimeline = [
    { id: 'h-1', topic: 'Calculus derivatives - Quotient Rule', date: 'July 01, 2026', tutor: 'Aadil Bhat', summary: 'Scored 9/10 in differentiation quiz.' },
    { id: 'h-2', topic: 'Limits & Continuity Concepts', date: 'June 25, 2026', tutor: 'Aadil Bhat', summary: 'Addressed doubts about infinity boundaries.' },
    { id: 'h-3', topic: 'Functions, Domains, and Range', date: 'June 18, 2026', tutor: 'Aadil Bhat', summary: 'Covered composite functions mapping.' }
  ];

  const handleSaveNotes = () => {
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
      setVoiceNotes((prev) => [
        `Voice_Note_${new Date().toLocaleDateString().replace(/\//g, '_')}.wav (0:28) - Transcribing...`,
        ...prev
      ]);
      // Simulate automated AI transcription addition
      setTimeout(() => {
        setVoiceNotes((prev) =>
          prev.map((v, idx) =>
            idx === 0 ? 'Voice_Note_Rec_Success.wav (0:28) - "Zoya showed good grasp of Chain rule"' : v
          )
        );
      }, 3000);
    }
  };

  const handleAddAttachment = () => {
    const files = ['differentiation_cheatsheet.pdf', 'homework_cbse_section_c.png'];
    const randomFile = files[Math.floor(Math.random() * files.length)];
    if (!attachments.includes(randomFile)) {
      setAttachments((prev) => [...prev, randomFile]);
    }
  };

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
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Classnotes & Transcripts</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Draft private observations, compose parental shared bulletins, record dictations, and review timeline</p>
        </div>
        <button
          onClick={handleSaveNotes}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Classnotes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Note Editor (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Session details bar */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400">Editing Active Classnote</span>
                <h3 className="text-xs font-extrabold text-slate-800 dark:text-white mt-0.5">Student: Zoya Khan • Calculus Derivatives</h3>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-medium">Session: July 2, 2026</span>
          </div>

          {/* Dual Notes Fields (Private vs Shared) */}
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
            
            {/* Dictations recorder simulation */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="border-b border-slate-50 dark:border-slate-700 pb-2.5">
                <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-blue-500" />
                  <span>Voice dictation transcriptions</span>
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Record live lesson audio for AI-powered summaries</p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-750/30">
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-650 text-white animate-pulse' 
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
                    {isRecording ? 'Capturing class presentation... Click again to process transcript.' : 'Click mic to record summaries.'}
                  </p>
                </div>
              </div>

              {/* Recorded list */}
              <div className="space-y-1.5 max-h-[110px] overflow-y-auto">
                {voiceNotes.map((note, noteIdx) => (
                  <div key={noteIdx} className="p-2 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 rounded-lg flex items-center gap-2 text-[10px]">
                    <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate font-medium text-slate-500 dark:text-slate-400">{note}</span>
                  </div>
                ))}
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
                  className="p-1 rounded-lg hover:bg-slate-150 text-slate-400 hover:text-slate-600 shrink-0"
                  title="Upload resource"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {attachments.map((file, fIdx) => (
                  <div key={fIdx} className="p-2.5 border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-between gap-2 text-[10px] group/item">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                      <span className="truncate font-bold text-slate-600 dark:text-slate-300">{file}</span>
                    </div>
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((a) => a !== file))}
                      className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-all shrink-0 cursor-pointer"
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

        {/* Right Side: AI Summary & History (4 columns) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Timeline History */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Previous Notes Timeline</span>
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Historic lessons list for Zoya Khan</p>
            </div>

            <div className="space-y-3">
              {sampleLessonsTimeline.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-750/30 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono text-slate-400">{item.date}</span>
                    <span className="font-bold text-slate-500">{item.tutor}</span>
                  </div>
                  <h5 className="font-bold text-slate-700 dark:text-slate-300 leading-tight">{item.topic}</h5>
                  <p className="text-[10px] text-slate-400 font-medium">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
