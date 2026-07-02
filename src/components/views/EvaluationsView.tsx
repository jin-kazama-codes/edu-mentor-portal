/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
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
  Edit
} from 'lucide-react';
import { CustomRadarChart } from '../Charts';

export default function EvaluationsView() {
  const [academic, setAcademic] = useState(85);
  const [behaviour, setBehaviour] = useState(90);
  const [attendance, setAttendance] = useState(95);
  const [communication, setCommunication] = useState(82);

  const [tutorComments, setTutorComments] = useState('Zoya remains an outstanding student in our calculus module. She exhibits fantastic analytical speed but sometimes rushes through boundary questions. In social sessions, she has started leading group reviews, which is excellent.');
  const [improvementAreas, setImprovementAreas] = useState('Needs to focus on slowing down during complex derivative steps. High-tension algebra revision recommended.');
  const [goals, setGoals] = useState('1. Solve 10 calculus section C problems weekly.\n2. Read pre-class literature topics ahead.\n3. Achieve 90% or above in upcoming mid-term mock evaluation.');
  
  const [parentFeedback, setParentFeedback] = useState('We are extremely happy with Zoya\'s growth under Aadil sir. She has gained so much confidence in math and physics. We will ensure she does her homework weekly without stress.');
  const [isSigned, setIsSigned] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // Math calculated overall score
  const overallScore = Math.round((academic + behaviour + attendance + communication) / 4);

  const handlePublish = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      
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
            <span className="font-semibold">Evaluation report generated, signed, and published!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Student Evaluations</h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Build diagnostic score cards, adjust academic performance, behavioral, and communication factors</p>
        </div>
        <button
          onClick={handlePublish}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Publish & Dispatch</span>
        </button>
      </div>

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
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg"
              />
            </div>

            {/* Behaviour Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Behaviour & Conduct</span>
                <span className="font-mono text-teal-600 font-bold">{behaviour}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={behaviour}
                onChange={(e) => setBehaviour(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg"
              />
            </div>

            {/* Attendance Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Attendance Ratio</span>
                <span className="font-mono text-indigo-600 font-bold">{attendance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={attendance}
                onChange={(e) => setAttendance(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg"
              />
            </div>

            {/* Communication Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Communication Index</span>
                <span className="font-mono text-purple-600 font-bold">{communication}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={communication}
                onChange={(e) => setCommunication(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg"
              />
            </div>
          </div>

          {/* Overall calculations panel */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-750/30 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Calculated Diagnostic Rating</span>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mt-1.5 leading-none">{overallScore}%</h2>
            <span className="text-[9.5px] text-teal-600 font-extrabold bg-teal-500/10 px-2 py-0.5 rounded-full inline-block mt-2">
              Grade Achievement: {overallScore >= 90 ? 'Grade A+' : overallScore >= 80 ? 'Grade A' : 'Grade B'}
            </span>
          </div>
        </div>

        {/* Middle: Radar Chart & Comments (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Radar Chart Component imported */}
          <CustomRadarChart />

          {/* Tutor comments form */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                <Edit className="w-4.5 h-4.5 text-blue-500" />
                <span>Mentor Remarks</span>
              </h4>
              <span className="text-[9px] text-slate-400 font-mono">By Aadil Bhat</span>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Qualitative comments</label>
                <textarea
                  value={tutorComments}
                  onChange={(e) => setTutorComments(e.target.value)}
                  className="w-full min-h-[90px] p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 leading-normal focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Top Improvement Areas</label>
                <input
                  type="text"
                  value={improvementAreas}
                  onChange={(e) => setImprovementAreas(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 focus:outline-none"
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
              className="w-full min-h-[120px] p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] leading-normal font-medium text-slate-500 dark:text-slate-400 focus:outline-none resize-none font-mono"
            />
          </div>

          {/* Parental signature and comments feedback block */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-50 dark:border-slate-700 pb-2 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-emerald-500" />
                <span>Guardians Endorsement</span>
              </h4>
              <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded ${isSigned ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {isSigned ? 'Signed' : 'Awaiting Signature'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Reply from Tariq Khan (Guardian)</span>
                <p className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] leading-normal font-medium text-slate-500 dark:text-slate-400">
                  {parentFeedback}
                </p>
              </div>

              {/* Sign action toggle button */}
              <button
                type="button"
                onClick={() => setIsSigned(!isSigned)}
                className={`w-full py-2 border rounded-xl text-[10px] font-bold cursor-pointer transition-colors ${
                  isSigned 
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                {isSigned ? 'Remove Guardian Signature' : 'Affix Guardian Signature'}
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
