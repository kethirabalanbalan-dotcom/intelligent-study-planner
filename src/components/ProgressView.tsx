import React from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  PieChart,
  ArrowUpRight
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { formatDate, differenceInDays, getTodayDateString } from '../utils/dateUtils';

export const ProgressView: React.FC = () => {
  const { schedule, subjects, setSelectedSubjectModal } = usePlanner();

  const todayStr = getTodayDateString();

  if (!schedule) {
    return <div className="text-center py-12 text-slate-400">Generate a study plan to view progress analytics.</div>;
  }

  // Calculate subject-wise completion stats
  const subjectStats = subjects.map((sub) => {
    let plannedMinutes = 0;
    let completedMinutes = 0;
    let totalSessions = 0;
    let completedSessions = 0;

    schedule.days.forEach((d) => {
      d.sessions.forEach((s) => {
        if (s.subjectId === sub.id) {
          plannedMinutes += s.durationMinutes;
          totalSessions++;
          if (s.status === 'completed') {
            completedMinutes += s.durationMinutes;
            completedSessions++;
          }
        }
      });
    });

    const plannedHours = Number((plannedMinutes / 60).toFixed(1));
    const completedHours = Number((completedMinutes / 60).toFixed(1));
    const remainingHours = Math.max(0, Number((plannedHours - completedHours).toFixed(1)));
    const percent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    const daysLeft = Math.max(0, differenceInDays(sub.examDate, todayStr));

    return {
      ...sub,
      plannedHours,
      completedHours,
      remainingHours,
      percent,
      totalSessions,
      completedSessions,
      daysLeft
    };
  });

  // Global counts
  let totalSessionsGlobal = 0;
  let completedSessionsGlobal = 0;
  let inProgressSessionsGlobal = 0;
  let notStartedSessionsGlobal = 0;

  schedule.days.forEach((d) => {
    d.sessions.forEach((s) => {
      totalSessionsGlobal++;
      if (s.status === 'completed') completedSessionsGlobal++;
      else if (s.status === 'in_progress') inProgressSessionsGlobal++;
      else notStartedSessionsGlobal++;
    });
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
          Preparation Progress & Study Analytics
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Detailed metrics tracking your syllabus completion, planned study hours, and exam countdowns.
        </p>
      </div>

      {/* Main Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Completion Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/15 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                Overall Examination Readiness
              </span>
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div className="text-4xl font-extrabold font-display mt-2">
              {schedule.overallProgress}%
            </div>
            <p className="text-xs text-indigo-100 mt-1">
              {completedSessionsGlobal} of {totalSessionsGlobal} study sessions finished
            </p>
          </div>

          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mt-4">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${schedule.overallProgress}%` }}
            />
          </div>
        </div>

        {/* Study Time Hours Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Hours Completed</span>
              <Clock className="w-5 h-5 text-indigo-500" />
            </div>
            <div className="text-4xl font-extrabold font-display text-slate-900 dark:text-white mt-2">
              {schedule.totalCompletedHours} <span className="text-lg font-normal text-slate-400">/ {schedule.totalPlannedHours} hrs</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {Math.max(0, Number((schedule.totalPlannedHours - schedule.totalCompletedHours).toFixed(1)))} hours remaining across schedule
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mt-4">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Active Tracker
            </span>
            <span>•</span>
            <span>{schedule.days.length} Total Prep Days</span>
          </div>
        </div>

        {/* Session Status Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Task Breakdown</span>
            <PieChart className="w-5 h-5 text-purple-500" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center my-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{completedSessionsGlobal}</div>
              <div className="text-[10px] text-emerald-600">Completed</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
              <div className="text-xs font-bold text-amber-700 dark:text-amber-300">{inProgressSessionsGlobal}</div>
              <div className="text-[10px] text-amber-600">In Progress</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{notStartedSessionsGlobal}</div>
              <div className="text-[10px] text-slate-500">Upcoming</div>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center">
            {schedule.days.filter((d) => d.isMissed).length} Missed Days Recorded
          </p>
        </div>
      </div>

      {/* Subject-Wise Progress Cards (Requirement 6, 9 & 11) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
          Subject-Wise Syllabus & Hours Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectStats.map((sub) => (
            <div
              key={sub.id}
              onClick={() => setSelectedSubjectModal(sub)}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition font-display">
                        {sub.name}
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Exam: {formatDate(sub.examDate)} ({sub.daysLeft} days remaining)
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {sub.percent}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden my-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${sub.percent}%`,
                      backgroundColor: sub.color
                    }}
                  />
                </div>

                {/* Hours Stats Row */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="text-[10px] text-slate-400">Planned</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">{sub.plannedHours} hrs</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30">
                    <div className="text-[10px] text-emerald-600">Done</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{sub.completedHours} hrs</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/30">
                    <div className="text-[10px] text-amber-600">Remaining</div>
                    <div className="font-bold text-amber-700 dark:text-amber-300 mt-0.5">{sub.remainingHours} hrs</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <span>{sub.completedSessions} of {sub.totalSessions} sessions completed</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                  View Details <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
