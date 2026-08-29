import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Award
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { formatDate, differenceInDays, getTodayDateString } from '../utils/dateUtils';

export const SubjectDetailsModal: React.FC = () => {
  const {
    selectedSubjectModal,
    setSelectedSubjectModal,
    schedule,
    setActiveTab
  } = usePlanner();

  if (!selectedSubjectModal) return null;

  const sub = selectedSubjectModal;
  const todayStr = getTodayDateString();
  const daysLeft = Math.max(0, differenceInDays(sub.examDate, todayStr));

  // Compute stats from schedule
  let totalPlannedMinutes = 0;
  let totalCompletedMinutes = 0;
  let totalSessions = 0;
  let completedSessions = 0;

  if (schedule) {
    schedule.days.forEach((d) => {
      d.sessions.forEach((s) => {
        if (s.subjectId === sub.id) {
          totalPlannedMinutes += s.durationMinutes;
          totalSessions++;
          if (s.status === 'completed') {
            totalCompletedMinutes += s.durationMinutes;
            completedSessions++;
          }
        }
      });
    });
  }

  const plannedHours = Number((totalPlannedMinutes / 60).toFixed(1));
  const completedHours = Number((totalCompletedMinutes / 60).toFixed(1));
  const remainingHours = Math.max(0, Number((plannedHours - completedHours).toFixed(1)));
  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const prio = sub.calculatedPriority;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Header Bar with Subject Color */}
          <div
            className="p-6 text-white relative overflow-hidden"
            style={{ backgroundColor: sub.color || '#4F46E5' }}
          >
            <div className="absolute top-0 right-0 p-4">
              <button
                id="subject-modal-close-btn"
                onClick={() => setSelectedSubjectModal(null)}
                className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs">
                {sub.difficulty} Difficulty
              </span>
              {prio && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    prio.level === 'high'
                      ? 'bg-rose-500 text-white'
                      : prio.level === 'medium'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-emerald-400 text-slate-950'
                  }`}
                >
                  {prio.level} Priority
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold font-display">{sub.name}</h2>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/90">
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-xl">
                <Calendar className="w-4 h-4" />
                <span>Exam: {formatDate(sub.examDate)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-xl font-semibold">
                <Clock className="w-4 h-4" />
                <span>{daysLeft} Days Remaining</span>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Progress Metrics Grid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Preparation Progress
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {progressPercent}% Completed
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: sub.color || '#4F46E5'
                  }}
                />
              </div>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">Planned Hours</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{plannedHours} hrs</div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                <div className="text-xs text-emerald-600 dark:text-emerald-400">Completed</div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{completedHours} hrs</div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
                <div className="text-xs text-amber-600 dark:text-amber-400">Remaining</div>
                <div className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">{remainingHours} hrs</div>
              </div>
            </div>

            {/* Prioritization Analysis Card */}
            {prio && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Prioritization Assessment
                  </span>
                  <span className="font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                    Priority Score: {prio.score}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {prio.reason}
                </p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <span>Difficulty Weight: <strong>{prio.difficultyWeight}x</strong></span>
                  <span>Urgency Multiplier: <strong>{prio.urgencyFactor}x</strong></span>
                  {sub.confidenceLevel !== undefined && (
                    <span>Confidence: <strong>{sub.confidenceLevel}%</strong></span>
                  )}
                </div>
              </div>
            )}

            {/* Topics Covered / Syllabus */}
            {sub.topics && sub.topics.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Core Topics & Syllabus ({sub.topics.length})
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {sub.topics.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                id="subject-modal-done-btn"
                onClick={() => setSelectedSubjectModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Close
              </button>
              <button
                id="subject-modal-view-plan-btn"
                onClick={() => {
                  setSelectedSubjectModal(null);
                  setActiveTab('study-plan');
                }}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" /> View in Study Plan
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
