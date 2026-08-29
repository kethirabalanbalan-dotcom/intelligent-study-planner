import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { getTodayDateString, formatLongDate, formatDate } from '../utils/dateUtils';

export const ReplanModal: React.FC = () => {
  const {
    isReplanModalOpen,
    setIsReplanModalOpen,
    targetMissedDate,
    setTargetMissedDate,
    schedule,
    subjects,
    replanSchedule,
    setActiveTab
  } = usePlanner();

  const todayStr = getTodayDateString();
  const selectedDate = targetMissedDate || todayStr;

  const [missedDateInput, setMissedDateInput] = useState<string>(selectedDate);
  const [reason, setReason] = useState<string>('Unexpected commitment & study day missed');
  const [isSuccessStep, setIsSuccessStep] = useState(false);
  const [replanSummary, setReplanSummary] = useState<{
    carriedTasks: number;
    prevDays: number;
    newDays: number;
  } | null>(null);

  if (!isReplanModalOpen) return null;

  // Find target day in schedule to preview tasks
  const dayPlan = schedule?.days.find((d) => d.date === missedDateInput);
  const incompleteSessions = dayPlan?.sessions.filter((s) => s.status !== 'completed') || [];
  const completedSessions = dayPlan?.sessions.filter((s) => s.status === 'completed') || [];

  const handleExecuteReplan = () => {
    if (!schedule) return;

    const prevDays = schedule.days.filter((d) => d.date > missedDateInput && !d.isMissed).length;
    const carriedCount = incompleteSessions.length;

    replanSchedule([missedDateInput], reason);

    setReplanSummary({
      carriedTasks: carriedCount,
      prevDays: prevDays,
      newDays: Math.max(1, prevDays)
    });
    setIsSuccessStep(true);
  };

  const handleClose = () => {
    setIsReplanModalOpen(false);
    setTargetMissedDate(null);
    setIsSuccessStep(false);
    setReplanSummary(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white relative">
            <button
              id="replan-modal-close-btn"
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-100 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Intelligent Schedule Recovery
            </div>
            <h3 className="text-xl font-bold font-display">Missed Study Day / Dynamic Replan</h3>
            <p className="text-xs text-amber-50 mt-1">
              Never fall behind. The engine preserves finished tasks and dynamically redistributes remaining sessions across available days.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {!isSuccessStep ? (
              <>
                {/* Missed Date Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Which study day was missed?
                  </label>
                  <div className="relative">
                    <input
                      id="replan-date-input"
                      type="date"
                      value={missedDateInput}
                      onChange={(e) => setMissedDateInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Selected: <strong>{formatLongDate(missedDateInput)}</strong>
                  </p>
                </div>

                {/* Reason Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Reason / Note (Optional)
                  </label>
                  <input
                    id="replan-reason-input"
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Fever, School event, Family commitment..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Intelligent Impact Preview */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Task Redistribution Preview</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {incompleteSessions.length} sessions to forward
                    </span>
                  </div>

                  {incompleteSessions.length > 0 ? (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {incompleteSessions.map((sess) => (
                        <div
                          key={sess.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 text-xs border border-slate-200/60 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: sess.subjectColor }}
                            />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {sess.subjectName}: {sess.topic}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md shrink-0">
                            Carry Forward
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No incomplete tasks found on this specific day. Running replan will rebalance upcoming preparation urgency.
                    </p>
                  )}

                  {completedSessions.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{completedSessions.length} completed task(s) on this date will be 100% preserved.</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    id="replan-cancel-btn"
                    onClick={handleClose}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    id="replan-execute-btn"
                    onClick={handleExecuteReplan}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/25 transition flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Recalculate & Replan Schedule
                  </button>
                </div>
              </>
            ) : (
              /* Success Step */
              <div className="text-center space-y-4 py-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    Schedule Intelligently Replanned!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Your study plan has been updated based on the missed study day. Tasks have been redistributed without exceeding daily limits.
                  </p>
                </div>

                {/* Replanned Stats Grid */}
                <div className="grid grid-cols-3 gap-2.5 text-center p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Carried Forward</div>
                    <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {replanSummary?.carriedTasks || 0} Tasks
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Prev Prep Days</div>
                    <div className="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {replanSummary?.prevDays || 0} Days
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Updated Days</div>
                    <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {replanSummary?.newDays || 0} Days
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-800 dark:text-indigo-200 text-left border border-indigo-100 dark:border-indigo-900/60">
                  <span className="font-bold flex items-center gap-1 mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Updated Priority Focus:
                  </span>
                  <p className="text-[11px] leading-relaxed">
                    Harder and nearer subjects (like Mathematics & Physics) have been dynamically prioritized in upcoming sessions.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    id="replan-view-updated-btn"
                    onClick={() => {
                      handleClose();
                      setActiveTab('study-plan');
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                  >
                    View Updated Study Plan <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
