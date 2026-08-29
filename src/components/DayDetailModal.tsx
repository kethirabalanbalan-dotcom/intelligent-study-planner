import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  CheckCircle2,
  Circle,
  PlayCircle,
  AlertTriangle,
  Sparkles,
  Coffee,
  Calendar
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { formatLongDate } from '../utils/dateUtils';
import { TaskStatus } from '../types';

export const DayDetailModal: React.FC = () => {
  const {
    selectedDateForDetail,
    setSelectedDateForDetail,
    schedule,
    markSessionStatus,
    markDayMissed
  } = usePlanner();

  if (!selectedDateForDetail || !schedule) return null;

  const day = schedule.days.find((d) => d.date === selectedDateForDetail);

  if (!day) return null;

  const handleStatusChange = (sessionId: string, newStatus: TaskStatus) => {
    markSessionStatus(day.date, sessionId, newStatus);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  {formatLongDate(day.date)}
                </h3>
                {day.isExamDay && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white uppercase tracking-wider">
                    Exam Day
                  </span>
                )}
                {day.isMissed && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                    Missed Day
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Available: <strong>{day.availableHours} hrs</strong> • Allocated: <strong>{day.allocatedHours} hrs</strong> • Progress: <strong>{day.progressPercentage}%</strong>
              </p>
            </div>

            <button
              id="day-modal-close-btn"
              onClick={() => setSelectedDateForDetail(null)}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Goal & Exam Alert */}
          <div className="px-6 pt-4 pb-2 space-y-2">
            {day.dailyGoal && (
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="font-semibold">Goal: {day.dailyGoal}</span>
              </div>
            )}

            {day.isExamDay && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-900 dark:text-rose-200">
                <span className="font-bold flex items-center gap-1.5 mb-0.5">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  Scheduled Examination Today:
                </span>
                <span className="font-medium">
                  {day.examSubjects.map((s) => s.name).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Sessions & Breaks List */}
          <div className="p-6 pt-2 overflow-y-auto flex-1 space-y-3">
            {day.sessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No study sessions scheduled for this day.
              </div>
            ) : (
              day.sessions.map((sess, idx) => {
                const correspondingBreak = day.breaks[idx];
                return (
                  <React.Fragment key={sess.id}>
                    <div
                      className={`p-3.5 rounded-2xl border transition ${
                        sess.status === 'completed'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                          : sess.status === 'in_progress'
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white shadow-xs"
                              style={{ backgroundColor: sess.subjectColor }}
                            >
                              {sess.subjectName}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {sess.startTime} – {sess.endTime} ({sess.durationMinutes}m)
                            </span>
                            {sess.isCarriedForward && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                Carried Forward
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {sess.topic}
                          </h4>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          <button
                            id={`day-status-not-${sess.id}`}
                            onClick={() => handleStatusChange(sess.id, 'not_completed')}
                            className={`p-1.5 rounded-lg text-xs transition ${
                              sess.status === 'not_completed'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                            title="Not Started"
                          >
                            <Circle className="w-4 h-4" />
                          </button>
                          <button
                            id={`day-status-prog-${sess.id}`}
                            onClick={() => handleStatusChange(sess.id, 'in_progress')}
                            className={`p-1.5 rounded-lg text-xs transition ${
                              sess.status === 'in_progress'
                                ? 'bg-amber-500 text-white font-bold shadow-xs'
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                            title="In Progress"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                          <button
                            id={`day-status-comp-${sess.id}`}
                            onClick={() => handleStatusChange(sess.id, 'completed')}
                            className={`p-1.5 rounded-lg text-xs transition ${
                              sess.status === 'completed'
                                ? 'bg-emerald-500 text-white font-bold shadow-xs'
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                            title="Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Break Block if scheduled */}
                    {correspondingBreak && (
                      <div className="flex items-center justify-center gap-2 py-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                        <span className="flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                          <Coffee className="w-3 h-3 text-amber-500" />
                          Break: {correspondingBreak.startTime} - {correspondingBreak.endTime} ({correspondingBreak.durationMinutes}m)
                        </span>
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
            <button
              id="day-modal-mark-missed-btn"
              onClick={() => {
                setSelectedDateForDetail(null);
                markDayMissed(day.date);
              }}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Mark this day as missed / Replan
            </button>

            <button
              id="day-modal-done-btn"
              onClick={() => setSelectedDateForDetail(null)}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
