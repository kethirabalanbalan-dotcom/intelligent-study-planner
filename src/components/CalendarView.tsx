import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { formatDate, getTodayDateString } from '../utils/dateUtils';
import { DayPlan } from '../types';

export const CalendarView: React.FC = () => {
  const { schedule, subjects, setSelectedDateForDetail } = usePlanner();

  // Current view date anchor (default to first schedule day or today)
  const todayStr = getTodayDateString();
  const [currentDate, setCurrentDate] = useState(() => {
    if (schedule && schedule.days.length > 0) {
      const [y, m] = schedule.days[0].date.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = [];

  // Padding days from previous month
  const prevMonthDaysCount = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = prevMonthDaysCount - i;
    const m = month === 0 ? 12 : month;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum, isCurrentMonth: false });
  }

  // Days of current month
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum, isCurrentMonth: true });
  }

  // Padding days for next month
  const totalSlots = Math.ceil(calendarCells.length / 7) * 7;
  const remainingSlots = totalSlots - calendarCells.length;
  for (let dayNum = 1; dayNum <= remainingSlots; dayNum++) {
    const m = month === 11 ? 1 : month + 2;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({ dateStr, dayNum, isCurrentMonth: false });
  }

  // Map schedule days by date for fast lookup
  const scheduleMap = new Map<string, DayPlan>(
    (schedule?.days || []).map((d) => [d.date, d])
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Calendar Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
            Examination & Study Calendar
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Click any date to view sessions, completed goals, or replan missed days.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-1 shadow-xs">
            <button
              id="calendar-prev-month-btn"
              onClick={prevMonth}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 font-bold text-sm text-slate-900 dark:text-white font-display min-w-[140px] text-center">
              {monthName}
            </span>
            <button
              id="calendar-next-month-btn"
              onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <span className="font-bold text-slate-900 dark:text-white">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-rose-500 shadow-xs" />
          <span>Official Exam Day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-indigo-500 shadow-xs" />
          <span>Study Sessions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-xs" />
          <span>Goal Completed (100%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-amber-500 shadow-xs" />
          <span>Missed Day</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
          {calendarCells.map((cell, idx) => {
            const dayPlan = scheduleMap.get(cell.dateStr);
            const isToday = cell.dateStr === todayStr;
            const isExamDay = dayPlan?.isExamDay;
            const isMissed = dayPlan?.isMissed;
            const isComplete = dayPlan && dayPlan.progressPercentage === 100 && dayPlan.sessions.length > 0;

            return (
              <div
                key={idx}
                id={`calendar-day-${cell.dateStr}`}
                onClick={() => {
                  if (dayPlan) setSelectedDateForDetail(cell.dateStr);
                }}
                className={`min-h-[105px] sm:min-h-[125px] p-2 sm:p-2.5 transition-all flex flex-col justify-between ${
                  !cell.isCurrentMonth
                    ? 'opacity-30 bg-slate-50/30 dark:bg-slate-900/30'
                    : dayPlan
                    ? 'hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer'
                    : 'bg-slate-50/10'
                } ${
                  isExamDay
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900'
                    : isMissed
                    ? 'bg-amber-50/40 dark:bg-amber-950/20'
                    : ''
                }`}
              >
                {/* Cell Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-indigo-600 text-white font-bold'
                        : isExamDay
                        ? 'bg-rose-500 text-white font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {isExamDay && (
                    <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Flame className="w-3 h-3 fill-current" /> EXAM
                    </span>
                  )}

                  {isMissed && (
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded-md">
                      MISSED
                    </span>
                  )}
                </div>

                {/* Day Plan Content Mini Pill */}
                {dayPlan ? (
                  <div className="space-y-1 my-1">
                    {/* Exam Name Tag */}
                    {dayPlan.examSubjects.length > 0 && (
                      <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70 p-1 rounded-md truncate">
                        📝 {dayPlan.examSubjects.map((s) => s.name).join(', ')}
                      </div>
                    )}

                    {/* Sessions count & breakdown */}
                    {dayPlan.sessions.length > 0 && (
                      <div className="space-y-0.5">
                        {dayPlan.sessions.slice(0, 2).map((s) => (
                          <div
                            key={s.id}
                            className="text-[10px] p-1 rounded-md truncate flex items-center gap-1 font-semibold"
                            style={{
                              backgroundColor: `${s.subjectColor}15`,
                              color: s.subjectColor
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: s.subjectColor }}
                            />
                            <span className="truncate">{s.subjectName}</span>
                          </div>
                        ))}
                        {dayPlan.sessions.length > 2 && (
                          <div className="text-[9px] text-slate-400 font-medium pl-1">
                            +{dayPlan.sessions.length - 2} more sessions
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                {/* Cell Footer Progress bar */}
                {dayPlan && dayPlan.sessions.length > 0 && (
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full ${
                        isComplete ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${dayPlan.progressPercentage}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
