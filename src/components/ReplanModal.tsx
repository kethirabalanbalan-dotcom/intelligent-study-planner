import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Clock,
  Check,
  History,
  CheckSquare,
  Square,
  AlertCircle,
  Flag,
  ArrowUpRight
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import {
  getTodayDateString,
  formatLongDate,
  formatDate,
  parseTimeToMinutes,
  formatMinutesTo24h
} from '../utils/dateUtils';
import { StudySession, ReplanEvent } from '../types';

interface ManualAssignment {
  sessionId: string;
  originalDate: string;
  newDate: string;
  startTime: string;
  endTime: string;
}

export const ReplanModal: React.FC = () => {
  const {
    isReplanModalOpen,
    setIsReplanModalOpen,
    targetMissedDate,
    setTargetMissedDate,
    schedule,
    subjects,
    profile,
    replanScheduleAuto,
    replanScheduleManual,
    setActiveTab,
    addToast
  } = usePlanner();

  const todayStr = getTodayDateString();
  const [missedDateInput, setMissedDateInput] = useState<string>(
    targetMissedDate || todayStr
  );
  const [reason, setReason] = useState<string>('Missed study day');
  const [replanMode, setReplanMode] = useState<'manual' | 'auto'>('manual');
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [manualAssignments, setManualAssignments] = useState<ManualAssignment[]>([]);
  const [isSuccessStep, setIsSuccessStep] = useState(false);
  const [lastReplanEvent, setLastReplanEvent] = useState<ReplanEvent | null>(null);

  // Update date when modal opens with targetMissedDate
  useEffect(() => {
    if (targetMissedDate) {
      setMissedDateInput(targetMissedDate);
    }
  }, [targetMissedDate]);

  // Find target day sessions
  const dayPlan = schedule?.days.find((d) => d.date === missedDateInput);
  const incompleteSessions =
    dayPlan?.sessions.filter((s) => s.status !== 'completed') || [];
  const completedSessions =
    dayPlan?.sessions.filter((s) => s.status === 'completed') || [];

  // Reset selected sessions and manual assignments when date or incomplete sessions change
  useEffect(() => {
    if (incompleteSessions.length > 0) {
      // Default: select all incomplete sessions
      const allIds = incompleteSessions.map((s) => s.id);
      setSelectedSessionIds(allIds);

      // Calculate next available date (tomorrow from missed date)
      const missedD = new Date(missedDateInput);
      missedD.setDate(missedD.getDate() + 1);
      const defaultNextDate = missedD.toISOString().split('T')[0];

      const initialAssignments: ManualAssignment[] = incompleteSessions.map((s, idx) => {
        // Calculate offset start time if multiple
        const startMin = 9 * 60 + idx * (s.durationMinutes + 15);
        const endMin = startMin + s.durationMinutes;

        return {
          sessionId: s.id,
          originalDate: missedDateInput,
          newDate: defaultNextDate,
          startTime: s.startTime || formatMinutesTo24h(startMin),
          endTime: s.endTime || formatMinutesTo24h(endMin)
        };
      });
      setManualAssignments(initialAssignments);
    } else {
      setSelectedSessionIds([]);
      setManualAssignments([]);
    }
  }, [missedDateInput, schedule]);

  if (!isReplanModalOpen) return null;

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessionIds((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSessionIds.length === incompleteSessions.length) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(incompleteSessions.map((s) => s.id));
    }
  };

  const handleAssignmentChange = (
    sessionId: string,
    field: keyof ManualAssignment,
    value: string
  ) => {
    setManualAssignments((prev) =>
      prev.map((item) =>
        item.sessionId === sessionId ? { ...item, [field]: value } : item
      )
    );
  };

  const applyQuickDateOffset = (sessionId: string, daysOffset: number) => {
    const d = new Date(missedDateInput);
    d.setDate(d.getDate() + daysOffset);
    const dateStr = d.toISOString().split('T')[0];
    handleAssignmentChange(sessionId, 'newDate', dateStr);
  };

  const applyQuickTimeSlot = (sessionId: string, start: string, end: string) => {
    setManualAssignments((prev) =>
      prev.map((item) =>
        item.sessionId === sessionId
          ? { ...item, startTime: start, endTime: end }
          : item
      )
    );
  };

  const handleExecuteReplan = () => {
    if (!schedule) return;

    if (incompleteSessions.length > 0 && selectedSessionIds.length === 0) {
      addToast(
        'warning',
        'No Sessions Selected',
        'Please select at least one incomplete session to reschedule or redistribute.'
      );
      return;
    }

    if (replanMode === 'auto') {
      // Selective auto redistribution for marked incomplete tasks
      const event = replanScheduleAuto([missedDateInput], reason, selectedSessionIds);
      if (event) {
        setLastReplanEvent(event);
        setIsSuccessStep(true);
      }
    } else {
      // Manual Mode
      const activeAssignments = manualAssignments.filter((a) =>
        selectedSessionIds.includes(a.sessionId)
      );

      for (const assignment of activeAssignments) {
        if (!assignment.newDate || !assignment.startTime || !assignment.endTime) {
          addToast(
            'error',
            'Incomplete Rescheduling',
            'Please fill out target date, start time, and end time for all selected sessions.'
          );
          return;
        }

        const startMin = parseTimeToMinutes(assignment.startTime);
        const endMin = parseTimeToMinutes(assignment.endTime);
        if (endMin <= startMin) {
          addToast(
            'error',
            'Invalid Time Slot',
            'End time must be later than start time for each session.'
          );
          return;
        }

        const originalSess = incompleteSessions.find((s) => s.id === assignment.sessionId);
        const targetSub = subjects.find((s) => s.id === originalSess?.subjectId);
        if (targetSub && assignment.newDate > targetSub.examDate) {
          addToast(
            'error',
            'Past Exam Date Violation',
            `Cannot reschedule ${targetSub.name} session to ${formatDate(assignment.newDate)} because its examination is on ${formatDate(targetSub.examDate)}.`
          );
          return;
        }
      }

      const event = replanScheduleManual([missedDateInput], reason, activeAssignments);
      if (event) {
        setLastReplanEvent(event);
        setIsSuccessStep(true);
      }
    }
  };

  const handleClose = () => {
    setIsReplanModalOpen(false);
    setTargetMissedDate(null);
    setIsSuccessStep(false);
    setLastReplanEvent(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white relative shrink-0">
            <button
              id="replan-modal-close-btn"
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-amber-100 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Study Plan Recovery
            </div>
            <h3 className="text-xl font-bold font-display">Missed Study Day / Replan</h3>
            <p className="text-xs text-amber-50 mt-1">
              Never lose progress. Manually reschedule your incomplete sessions or trigger a selective redistribution into available future slots.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {!isSuccessStep ? (
              <>
                {/* Missed Date & Reason Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Missed Study Date
                    </label>
                    <input
                      id="replan-date-input"
                      type="date"
                      value={missedDateInput}
                      onChange={(e) => setMissedDateInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {formatLongDate(missedDateInput)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Reason / Note
                    </label>
                    <input
                      id="replan-reason-input"
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g., Unplanned travel, sickness, exam prep..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Primary Action Prompt & Method Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Choose How to Handle Incomplete Sessions
                    </label>
                    <span className="text-[11px] text-slate-400">Select recovery workflow</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Method 1: Manual Rescheduling (Default) */}
                    <button
                      type="button"
                      id="replan-mode-manual-btn"
                      onClick={() => setReplanMode('manual')}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                        replanMode === 'manual'
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            Manual Reschedule
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs mt-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                          Personally choose custom target dates and time slots for each incomplete session.
                        </p>
                      </div>
                    </button>

                    {/* Method 2: Selective Redistribution */}
                    <button
                      type="button"
                      id="replan-mode-auto-btn"
                      onClick={() => setReplanMode('auto')}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                        replanMode === 'auto'
                          ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500/20 shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            Selective Redistribution
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            Automated
                          </span>
                        </div>
                        <p className="text-xs mt-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                          Redistribute only marked incomplete tasks into upcoming available study slots before exam deadlines.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Incomplete Tasks Selection & Configuration */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Incomplete Sessions to Process
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {selectedSessionIds.length} of {incompleteSessions.length} selected
                      </span>
                    </div>

                    {incompleteSessions.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline self-start sm:self-auto flex items-center gap-1"
                      >
                        {selectedSessionIds.length === incompleteSessions.length ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" /> Deselect All
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5" /> Select All
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {incompleteSessions.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No incomplete study tasks found on {formatDate(missedDateInput)}.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        All planned sessions on this date were completed or none were scheduled.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {incompleteSessions.map((sess) => {
                        const isSelected = selectedSessionIds.includes(sess.id);
                        const assignment = manualAssignments.find((a) => a.sessionId === sess.id);
                        const targetSub = subjects.find((s) => s.id === sess.subjectId);
                        const isExamPast =
                          targetSub && assignment && assignment.newDate > targetSub.examDate;

                        return (
                          <div
                            key={sess.id}
                            className={`p-3.5 rounded-2xl border transition ${
                              isSelected
                                ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-900/60 shadow-xs'
                                : 'bg-slate-100/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                            }`}
                          >
                            {/* Task Header & Selection */}
                            <div className="flex items-start justify-between gap-2">
                              <label className="flex items-center gap-3 cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSessionSelection(sess.id)}
                                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-700"
                                />
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white shadow-2xs"
                                      style={{ backgroundColor: sess.subjectColor }}
                                    >
                                      {sess.subjectName}
                                    </span>
                                    {sess.priority && (
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <Flag className="w-2.5 h-2.5" />
                                        {sess.priority}
                                      </span>
                                    )}
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {sess.durationMinutes} mins
                                    </span>
                                  </div>
                                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                    {sess.topic}
                                  </div>
                                </div>
                              </label>

                              {targetSub && (
                                <div className="text-[11px] text-right shrink-0 text-slate-500 dark:text-slate-400">
                                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                                    Exam: {formatDate(targetSub.examDate)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Method-Specific Controls for Selected Session */}
                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                {replanMode === 'manual' ? (
                                  /* Manual Editor Form */
                                  <div className="space-y-2.5">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                          Rescheduled Date
                                        </label>
                                        <input
                                          type="date"
                                          value={assignment?.newDate || ''}
                                          onChange={(e) =>
                                            handleAssignmentChange(sess.id, 'newDate', e.target.value)
                                          }
                                          className={`w-full px-2.5 py-1.5 text-xs rounded-xl border ${
                                            isExamPast
                                              ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                                              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-amber-500'
                                          }`}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                          Start Time
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="09:00 AM"
                                          value={assignment?.startTime || ''}
                                          onChange={(e) =>
                                            handleAssignmentChange(sess.id, 'startTime', e.target.value)
                                          }
                                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                                          End Time
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="10:30 AM"
                                          value={assignment?.endTime || ''}
                                          onChange={(e) =>
                                            handleAssignmentChange(sess.id, 'endTime', e.target.value)
                                          }
                                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                        />
                                      </div>
                                    </div>

                                    {/* Quick helper shortcuts */}
                                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                      <span className="text-slate-400 font-semibold">Quick shortcuts:</span>
                                      <button
                                        type="button"
                                        onClick={() => applyQuickDateOffset(sess.id, 1)}
                                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition"
                                      >
                                        +1 Day
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => applyQuickDateOffset(sess.id, 2)}
                                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition"
                                      >
                                        +2 Days
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => applyQuickTimeSlot(sess.id, '09:00 AM', '10:30 AM')}
                                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition"
                                      >
                                        Morning (9am)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => applyQuickTimeSlot(sess.id, '02:00 PM', '03:30 PM')}
                                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition"
                                      >
                                        Afternoon (2pm)
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => applyQuickTimeSlot(sess.id, '06:00 PM', '07:30 PM')}
                                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition"
                                      >
                                        Evening (6pm)
                                      </button>
                                    </div>

                                    {isExamPast && (
                                      <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                        Warning: Rescheduled date is after the examination date ({formatDate(targetSub!.examDate)}).
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  /* Selective Redistribution Preview */
                                  <div className="flex items-center justify-between text-xs bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                                      <span>
                                        Will be smartly moved to upcoming free study slots prior to exam deadline ({formatDate(targetSub?.examDate || '')}).
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md shrink-0">
                                      Auto-Place
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {completedSessions.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>{completedSessions.length} completed session(s) on this date are preserved and will not be altered.</span>
                    </div>
                  )}
                </div>

                {/* Modal Footer Controls */}
                <div className="flex items-center justify-between gap-3 pt-2">
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
                    disabled={incompleteSessions.length > 0 && selectedSessionIds.length === 0}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-amber-600/25 transition flex items-center gap-2"
                  >
                    {replanMode === 'manual' ? (
                      <>
                        <Sliders className="w-4 h-4" /> Apply Manual Reschedule ({selectedSessionIds.length})
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" /> Execute Selective Redistribution ({selectedSessionIds.length})
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Success Confirmation Step */
              <div className="text-center space-y-5 py-2">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                    {replanMode === 'manual'
                      ? 'Manual Rescheduling Complete!'
                      : 'Selective Redistribution Applied!'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                    Your study schedule has been updated according to your instructions. Completed tasks were preserved and an audit record was added to your Replanning History.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left space-y-2.5 text-xs">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Applied Changes:
                  </div>
                  {lastReplanEvent?.changesApplied?.map((ch, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{ch}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    id="replan-history-view-btn"
                    onClick={() => {
                      handleClose();
                      setActiveTab('replan-history');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5"
                  >
                    <History className="w-4 h-4" /> View History Log
                  </button>
                  <button
                    id="replan-view-updated-btn"
                    onClick={() => {
                      handleClose();
                      setActiveTab('study-plan');
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
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
