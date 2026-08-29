import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  PlayCircle,
  Circle,
  AlertTriangle,
  Sparkles,
  Filter,
  Coffee,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Award
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { formatLongDate, formatDate, getTodayDateString } from '../utils/dateUtils';
import { TaskStatus } from '../types';

export const StudyPlanView: React.FC = () => {
  const {
    schedule,
    subjects,
    profile,
    generateSchedule,
    markSessionStatus,
    markDayMissed,
    setSelectedSubjectModal,
    setIsReplanModalOpen
  } = usePlanner();

  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'completed' | 'missed'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const todayStr = getTodayDateString();

  if (!schedule || schedule.days.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold font-display text-slate-900 dark:text-white">
          No Study Plan Generated Yet
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Generate your personalized day-wise preparation plan based on your subjects, available study hours, and exam dates.
        </p>
        <button
          id="study-plan-generate-first-btn"
          onClick={generateSchedule}
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition"
        >
          Generate Study Plan
        </button>
      </div>
    );
  }

  // Filter days
  const filteredDays = schedule.days.filter((day) => {
    // Subject filter
    if (selectedSubjectFilter !== 'all') {
      const hasSubject = day.sessions.some((s) => s.subjectId === selectedSubjectFilter);
      const hasExam = day.examSubjects.some((s) => s.id === selectedSubjectFilter);
      if (!hasSubject && !hasExam) return false;
    }

    // Status filter
    if (filterType === 'completed') return day.progressPercentage === 100;
    if (filterType === 'missed') return day.isMissed;
    if (filterType === 'upcoming') return day.date >= todayStr && !day.isMissed && day.progressPercentage < 100;
    return true;
  });

  const toggleExpand = (date: string) => {
    setExpandedDays((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              Day-Wise Examination Study Plan
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {schedule.days.length} Days Plan
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Intelligently distributed from {formatDate(schedule.startDate)} to {formatDate(schedule.endDate)}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="plan-replan-cta-btn"
            onClick={() => setIsReplanModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
            Missed Day / Replan
          </button>
          <button
            id="plan-refresh-btn"
            onClick={generateSchedule}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Regenerate Plan
          </button>
        </div>
      </div>

      {/* Insufficient Time Warning Banner (Requirement 13) */}
      {schedule.isInsufficientTime && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Insufficient Preparation Time Warning</h4>
            <p className="leading-relaxed opacity-95">
              {schedule.timeWarningMessage ||
                'Warning: Your available study hours may not be sufficient to complete the recommended preparation plan before the examination. Consider increasing your daily study hours.'}
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Quick Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: 'all', label: 'All Days' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Completed' },
              { id: 'missed', label: 'Missed' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              id={`plan-filter-${tab.id}`}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subject dropdown filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Subject:</span>
          <select
            id="plan-subject-filter-select"
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Day Plans List */}
      <div className="space-y-4">
        {filteredDays.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
            No study days match your filter.
          </div>
        ) : (
          filteredDays.map((day) => {
            const isExpanded = expandedDays[day.date] !== false; // default expanded
            const isToday = day.date === todayStr;

            return (
              <div
                key={day.date}
                className={`rounded-3xl border transition-all ${
                  isToday
                    ? 'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                    : day.isMissed
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    : day.isExamDay
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                }`}
              >
                {/* Day Header Bar */}
                <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                        {formatLongDate(day.date)}
                      </h3>

                      {isToday && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                          Today
                        </span>
                      )}

                      {day.isExamDay && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white uppercase tracking-wider">
                          Exam Day
                        </span>
                      )}

                      {day.isMissed && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                          Missed Day
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>Available: <strong>{day.availableHours} hrs</strong></span>
                      <span>•</span>
                      <span>Allocated: <strong>{day.allocatedHours} hrs</strong></span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Goal: {day.dailyGoal}
                      </span>
                    </div>
                  </div>

                  {/* Day Progress & Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* Progress percentage pill */}
                    <div className="flex items-center gap-2">
                      <div className="text-right text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {day.progressPercentage}%
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {day.sessions.filter((s) => s.status === 'completed').length}/{day.sessions.length} done
                        </div>
                      </div>
                      <div className="w-12 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${day.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Mark Day Missed Trigger */}
                    {!day.isMissed && (
                      <button
                        id={`plan-mark-missed-${day.date}`}
                        onClick={() => markDayMissed(day.date)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition"
                        title="Mark this day missed to dynamically replan remaining schedule"
                      >
                        Missed Day
                      </button>
                    )}

                    <button
                      id={`plan-toggle-expand-${day.date}`}
                      onClick={() => toggleExpand(day.date)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Day Sessions Content (Expandable) */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 space-y-3">
                    {/* Exam banner on this date */}
                    {day.isExamDay && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs sm:text-sm text-rose-900 dark:text-rose-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-rose-500" />
                            Official Examination Today:
                          </span>
                          <span className="font-semibold">{day.examSubjects.map((s) => s.name).join(', ')}</span>
                        </div>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          Best of luck!
                        </span>
                      </div>
                    )}

                    {day.sessions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">
                        No study sessions allocated for this day.
                      </p>
                    ) : (
                      day.sessions.map((sess, idx) => {
                        const nextBreak = day.breaks[idx];
                        return (
                          <React.Fragment key={sess.id}>
                            <div
                              className={`p-3.5 rounded-2xl border transition ${
                                sess.status === 'completed'
                                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                                  : sess.status === 'in_progress'
                                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                                  : 'bg-slate-50/40 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
                                      style={{ backgroundColor: sess.subjectColor }}
                                    >
                                      {sess.subjectName}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {sess.startTime} – {sess.endTime} ({sess.durationMinutes} mins)
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                      {sess.sessionType.replace('_', ' ')}
                                    </span>
                                    {sess.isCarriedForward && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                        Carried Forward
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {sess.topic}
                                  </h4>
                                </div>

                                {/* Task Completion Controls */}
                                <div className="flex items-center gap-1.5 self-end sm:self-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                                  <button
                                    id={`plan-status-not-${sess.id}`}
                                    onClick={() => markSessionStatus(day.date, sess.id, 'not_completed')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                      sess.status === 'not_completed'
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                                        : 'text-slate-400 hover:text-slate-700'
                                    }`}
                                  >
                                    <Circle className="w-3.5 h-3.5" /> Not Done
                                  </button>
                                  <button
                                    id={`plan-status-prog-${sess.id}`}
                                    onClick={() => markSessionStatus(day.date, sess.id, 'in_progress')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                      sess.status === 'in_progress'
                                        ? 'bg-amber-500 text-white font-bold'
                                        : 'text-slate-400 hover:text-amber-600'
                                    }`}
                                  >
                                    <PlayCircle className="w-3.5 h-3.5" /> In Progress
                                  </button>
                                  <button
                                    id={`plan-status-comp-${sess.id}`}
                                    onClick={() => markSessionStatus(day.date, sess.id, 'completed')}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                      sess.status === 'completed'
                                        ? 'bg-emerald-500 text-white font-bold'
                                        : 'text-slate-400 hover:text-emerald-600'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Break period card */}
                            {nextBreak && (
                              <div className="flex items-center justify-center gap-2 py-1 text-[11px] text-slate-500 dark:text-slate-400">
                                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                                <span className="flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-0.5 rounded-full">
                                  <Coffee className="w-3 h-3 text-amber-500" />
                                  Break: {nextBreak.startTime} – {nextBreak.endTime} ({nextBreak.durationMinutes}m active rest)
                                </span>
                                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
