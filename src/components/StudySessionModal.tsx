import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Flag,
  AlertCircle
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import {
  formatDate,
  formatLongDate,
  parseTimeToMinutes,
  formatMinutesTo24h,
  formatTime12h,
  getTodayDateString,
  getDayOfWeekKey
} from '../utils/dateUtils';
import { PriorityLevel, TaskStatus, StudySession, ManualSessionInput } from '../types';

interface StudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialSubjectId?: string;
  sessionToEdit?: {
    session: StudySession;
    date: string;
  } | null;
}

export const StudySessionModal: React.FC<StudySessionModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialSubjectId,
  sessionToEdit
}) => {
  const {
    subjects,
    profile,
    schedule,
    addManualSession,
    updateManualSession,
    setActiveTab
  } = usePlanner();

  const todayStr = getTodayDateString();

  const [subjectId, setSubjectId] = useState<string>('');
  const [date, setDate] = useState<string>(todayStr);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('11:00');
  const [topic, setTopic] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [notes, setNotes] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>('not_completed');

  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Initialize or reset modal fields when opened
  useEffect(() => {
    if (!isOpen) return;

    setFormErrors([]);

    if (sessionToEdit) {
      setSubjectId(sessionToEdit.session.subjectId);
      setDate(sessionToEdit.date);
      // Convert formatted 12h or 24h to 24h for time inputs
      const startMin = parseTimeToMinutes(sessionToEdit.session.startTime);
      const endMin = parseTimeToMinutes(sessionToEdit.session.endTime);
      setStartTime(formatMinutesTo24h(startMin));
      setEndTime(formatMinutesTo24h(endMin));
      setTopic(sessionToEdit.session.topic);
      setPriority(sessionToEdit.session.priority || 'medium');
      setNotes(sessionToEdit.session.notes || '');
      setStatus(sessionToEdit.session.status || 'not_completed');
    } else {
      // Defaults for new session
      const targetDate = initialDate || todayStr;
      setDate(targetDate);
      const chosenSubject =
        initialSubjectId || (subjects.length > 0 ? subjects[0].id : '');
      setSubjectId(chosenSubject);

      // Default time based on profile or 09:00 - 11:00
      const defaultStartMin = parseTimeToMinutes(profile.startTimeOfDay || '09:00');
      const duration = profile.sessionDurationMinutes || 120;
      setStartTime(formatMinutesTo24h(defaultStartMin));
      setEndTime(formatMinutesTo24h(defaultStartMin + duration));
      setTopic('');
      setPriority('medium');
      setNotes('');
      setStatus('not_completed');
    }
  }, [isOpen, sessionToEdit, initialDate, initialSubjectId, subjects, profile, todayStr]);

  // Selected subject object
  const selectedSubject = useMemo(() => {
    return subjects.find((s) => s.id === subjectId) || null;
  }, [subjects, subjectId]);

  // Real-time duration calculation
  const calculatedDurationMinutes = useMemo(() => {
    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    if (endMin > startMin) {
      return endMin - startMin;
    }
    return 0;
  }, [startTime, endTime]);

  const formattedDurationText = useMemo(() => {
    if (calculatedDurationMinutes <= 0) return '0 minutes';
    const hours = Math.floor(calculatedDurationMinutes / 60);
    const mins = calculatedDurationMinutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours} hr ${mins} min (${calculatedDurationMinutes} mins)`;
    }
    if (hours > 0) {
      return `${hours} hr${hours > 1 ? 's' : ''} (${calculatedDurationMinutes} mins)`;
    }
    return `${mins} mins`;
  }, [calculatedDurationMinutes]);

  // Available daily hours for the chosen date from user profile
  const availableDailyHours = useMemo(() => {
    if (profile.studyHoursMode === 'custom' && profile.customDailyHours) {
      const dayKey = getDayOfWeekKey(date);
      return profile.customDailyHours[dayKey] || profile.defaultDailyHours || 4;
    }
    return profile.defaultDailyHours || 4;
  }, [profile, date]);

  // Overlap and Daily limit validation
  const { isOverlapping, overlappingSession, exceedsDailyHours, isAfterExamDate } = useMemo(() => {
    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);

    let isOverlapping = false;
    let overlappingSession: StudySession | null = null;

    // Check existing sessions on this date in current schedule
    const dayPlan = schedule?.days.find((d) => d.date === date);
    let totalMinutesOnDay = calculatedDurationMinutes;

    if (dayPlan) {
      dayPlan.sessions.forEach((s) => {
        // Skip comparing against self when editing
        if (sessionToEdit && s.id === sessionToEdit.session.id) {
          return;
        }

        const sStart = parseTimeToMinutes(s.startTime);
        const sEnd = parseTimeToMinutes(s.endTime);
        totalMinutesOnDay += s.durationMinutes;

        // Overlap condition: startA < endB && endA > startB
        if (startMin < sEnd && endMin > sStart) {
          isOverlapping = true;
          overlappingSession = s;
        }
      });
    }

    const exceedsDailyHours = totalMinutesOnDay > availableDailyHours * 60;

    // Subject exam date check
    let isAfterExamDate = false;
    if (selectedSubject && selectedSubject.examDate) {
      isAfterExamDate = date > selectedSubject.examDate;
    }

    return { isOverlapping, overlappingSession, exceedsDailyHours, isAfterExamDate };
  }, [
    startTime,
    endTime,
    date,
    schedule,
    sessionToEdit,
    calculatedDurationMinutes,
    availableDailyHours,
    selectedSubject
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (!subjectId) {
      errors.push('Please select a subject for this study session.');
    }

    if (!topic.trim()) {
      errors.push('Please enter a study topic or task.');
    }

    if (!date) {
      errors.push('Please select a valid study date.');
    }

    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);

    if (endMin <= startMin) {
      errors.push('End time must be later than start time.');
    }

    if (isAfterExamDate && selectedSubject) {
      errors.push(
        `Cannot schedule study session after examination date (${selectedSubject.name} examination is on ${formatDate(selectedSubject.examDate)}).`
      );
    }

    if (isOverlapping && overlappingSession) {
      errors.push(
        `Time range overlaps with existing session "${overlappingSession.topic}" (${overlappingSession.startTime} - ${overlappingSession.endTime}).`
      );
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    const sessionData: ManualSessionInput = {
      subjectId,
      date,
      startTime: formatTime12h(startMin),
      endTime: formatTime12h(endMin),
      durationMinutes: endMin - startMin,
      topic: topic.trim(),
      priority,
      notes: notes.trim() || undefined,
      status
    };

    if (sessionToEdit) {
      updateManualSession(sessionToEdit.session.id, sessionToEdit.date, sessionData);
    } else {
      addManualSession(sessionData);
    }

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                {sessionToEdit ? <Sparkles className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  {sessionToEdit ? 'Edit Study Session' : 'Add Manual Study Plan'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {sessionToEdit
                    ? 'Modify your study session details, times, and priority.'
                    : 'Customize your study schedule by choosing subject, date, time, and topic.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="session-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content / Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Validation Errors Notice */}
            {formErrors.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs space-y-1.5 animate-in fade-in duration-150">
                <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Please resolve the following errors:
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  {formErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Subject Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Subject <span className="text-rose-500">*</span></span>
                {selectedSubject && (
                  <span className="text-[11px] font-normal text-slate-500">
                    Exam Date: <strong className="text-indigo-600 dark:text-indigo-400">{formatDate(selectedSubject.examDate)}</strong>
                  </span>
                )}
              </label>

              {subjects.length === 0 ? (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>No subjects added yet. Please add a subject first.</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setActiveTab('subjects');
                    }}
                    className="font-bold underline text-indigo-600 dark:text-indigo-400 hover:opacity-80"
                  >
                    Go to Subjects
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="session-subject-select"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="" disabled>Select Subject...</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} (Exam: {formatDate(sub.examDate)} • {sub.difficulty.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Study Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="session-date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Selected: <strong>{formatLongDate(date)}</strong>
              </p>
            </div>

            {/* Time Pickers (Start & End Time) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> Start Time <span className="text-rose-500">*</span>
                </label>
                <input
                  id="session-start-time-input"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" /> End Time <span className="text-rose-500">*</span>
                </label>
                <input
                  id="session-end-time-input"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Calculated Study Duration Display */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Calculated Duration:
                </span>
              </div>
              <span className="font-bold text-indigo-700 dark:text-indigo-300 font-display">
                {formattedDurationText}
              </span>
            </div>

            {/* Study Topic or Task */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Study Topic / Task <span className="text-rose-500">*</span>
              </label>
              <input
                id="session-topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Algebra Revision, Calculus Problem Set, Chapter 4 Notes..."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Priority Level Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-indigo-500" /> Priority Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { level: 'high', label: 'High Priority', color: 'border-rose-500 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40' },
                    { level: 'medium', label: 'Medium Priority', color: 'border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40' },
                    { level: 'low', label: 'Low Priority', color: 'border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40' }
                  ] as const
                ).map((p) => (
                  <button
                    key={p.level}
                    type="button"
                    id={`session-priority-${p.level}-btn`}
                    onClick={() => setPriority(p.level)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      priority === p.level
                        ? `${p.color} ring-2 ring-indigo-500/20 shadow-xs`
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.level === 'high'
                          ? 'bg-rose-500'
                          : p.level === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span>{p.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Status (For Editing or Updating) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Session Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { val: 'not_completed', label: 'Not Completed' },
                    { val: 'in_progress', label: 'In Progress' },
                    { val: 'completed', label: 'Completed' }
                  ] as const
                ).map((st) => (
                  <button
                    key={st.val}
                    type="button"
                    id={`session-status-${st.val}-btn`}
                    onClick={() => setStatus(st.val)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition ${
                      status === st.val
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Optional Notes & Goals
              </label>
              <textarea
                id="session-notes-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Focus on past exam papers, review formula sheet, complete 10 practice questions..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>

            {/* Real-time Warnings */}
            {isAfterExamDate && selectedSubject && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Exam Date Restriction:</strong>
                  {selectedSubject.name} examination is on {formatDate(selectedSubject.examDate)}. Study sessions cannot be scheduled after the examination date.
                </div>
              </div>
            )}

            {isOverlapping && overlappingSession && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Time Overlap Detected:</strong>
                  This time overlaps with another planned session: <strong>"{overlappingSession.topic}"</strong> ({overlappingSession.startTime} - {overlappingSession.endTime}).
                </div>
              </div>
            )}

            {exceedsDailyHours && !isOverlapping && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Daily Study Limit Notice:</strong>
                  Total planned study time on this day exceeds your preferred limit of {availableDailyHours} hours. You can still save it if you plan to study extra.
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                id="session-modal-cancel-btn"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="session-modal-save-btn"
                disabled={subjects.length === 0}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{sessionToEdit ? 'Save Changes' : 'Add Study Session'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
