import React from 'react';
import {
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Circle,
  ArrowRight,
  TrendingUp,
  Flame,
  Award,
  RefreshCw,
  Plus
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import {
  getTodayDateString,
  formatLongDate,
  formatDate,
  differenceInDays
} from '../utils/dateUtils';
import { TaskStatus } from '../types';

export const DashboardView: React.FC = () => {
  const {
    profile,
    subjects,
    schedule,
    recommendations,
    setActiveTab,
    setSelectedSubjectModal,
    markSessionStatus,
    setIsReplanModalOpen,
    setTargetMissedDate
  } = usePlanner();

  const todayStr = getTodayDateString();

  // Find today's plan, or fallback to first day if before start date
  let todayPlan = schedule?.days.find((d) => d.date === todayStr);
  if (!todayPlan && schedule && schedule.days.length > 0) {
    todayPlan = schedule.days[0];
  }

  // Sorted upcoming exams
  const upcomingExams = [...subjects]
    .map((s) => {
      const daysLeft = differenceInDays(s.examDate, todayStr);
      return {
        ...s,
        daysLeft
      };
    })
    .filter((s) => s.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const nearestExam = upcomingExams[0];

  // Group subjects by priority
  const highPrioritySubjects = subjects.filter(
    (s) => s.calculatedPriority?.level === 'high'
  );
  const mediumPrioritySubjects = subjects.filter(
    (s) => s.calculatedPriority?.level === 'medium'
  );
  const lowPrioritySubjects = subjects.filter(
    (s) => s.calculatedPriority?.level === 'low'
  );

  // High priority recommendations
  const topRec = recommendations[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-500/10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Intelligent Examination Study Planner
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">
              Welcome, {profile.name}! Let's create your personalized study plan.
            </h1>
            <p className="text-sm text-indigo-100/90 leading-relaxed">
              Prioritizing hard concepts, balancing exam countdowns, and automatically adapting if you miss a study day.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="dashboard-study-plan-btn"
              onClick={() => setActiveTab('study-plan')}
              className="px-4 py-2.5 rounded-2xl bg-white text-indigo-900 font-bold text-sm hover:bg-indigo-50 transition shadow-md shadow-black/10 flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-indigo-600" /> View Full Plan
            </button>
            <button
              id="dashboard-replan-banner-btn"
              onClick={() => setIsReplanModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm backdrop-blur-xs transition border border-white/20 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-amber-300" /> Missed Day / Replan
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards (Requirement 9) - Bento Grid Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Subjects */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Total Subjects</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              {subjects.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Enrolled</div>
          </div>
        </div>

        {/* Upcoming Examination */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Next Exam</span>
            <Calendar className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-slate-900 dark:text-white truncate font-display">
              {nearestExam ? nearestExam.name : 'None'}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
              {nearestExam ? formatDate(nearestExam.examDate) : 'All complete'}
            </div>
          </div>
        </div>

        {/* Days Remaining */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Days Remaining</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              {nearestExam ? `${nearestExam.daysLeft}d` : '-'}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">Until first exam</div>
          </div>
        </div>

        {/* Today's Available Study Hours */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Available Today</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              {todayPlan ? `${todayPlan.availableHours}h` : `${profile.defaultDailyHours}h`}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Daily quota</div>
          </div>
        </div>

        {/* Today's Planned Study Time */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Planned Time</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              {todayPlan ? `${todayPlan.allocatedHours}h` : '0h'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {todayPlan?.sessions.length || 0} sessions
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">Overall Progress</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display">
              {schedule ? `${schedule.overallProgress}%` : '0%'}
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${schedule?.overallProgress || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Smart Recommendation Highlight */}
      {topRec && (
        <div
          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
            topRec.type === 'urgent'
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-100'
              : topRec.type === 'replan'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-950 dark:text-amber-100'
              : 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-950 dark:text-indigo-100'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xs shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Smart Study Recommendation
                </span>
                <span className="text-xs font-bold">•</span>
                <span className="text-xs font-bold">{topRec.title}</span>
              </div>
              <p className="text-xs sm:text-sm mt-0.5 opacity-90 leading-relaxed">
                {topRec.message}
              </p>
            </div>
          </div>

          {topRec.actionText && (
            <button
              id="dashboard-recommendation-action-btn"
              onClick={() => {
                if (topRec.actionType === 'replan') setIsReplanModalOpen(true);
                else if (topRec.targetTab) setActiveTab(topRec.targetTab);
                else setActiveTab('recommendations');
              }}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs hover:opacity-90 transition flex items-center gap-1.5"
            >
              {topRec.actionText} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Grid: Today's Schedule & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Interactive Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                    Today's Study Schedule
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {todayPlan ? formatLongDate(todayPlan.date) : 'Today'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Goal: <span className="font-semibold text-slate-700 dark:text-slate-300">{todayPlan?.dailyGoal || 'Follow session plan'}</span>
                </p>
              </div>

              {todayPlan && (
                <div className="flex items-center gap-3">
                  <button
                    id="dashboard-mark-today-missed-btn"
                    onClick={() => {
                      setTargetMissedDate(todayPlan.date);
                      setIsReplanModalOpen(true);
                    }}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:underline flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> I Missed Today's Plan
                  </button>
                </div>
              )}
            </div>

            {/* Daily Progress Bar */}
            {todayPlan && (
              <div className="py-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-slate-600 dark:text-slate-400">
                    Daily Progress: <strong className="text-slate-900 dark:text-white">{todayPlan.progressPercentage}% Completed</strong>
                  </span>
                  <span className="text-xs text-slate-400">
                    {todayPlan.sessions.filter((s) => s.status === 'completed').length} of {todayPlan.sessions.length} sessions done
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${todayPlan.progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Sessions Checklist */}
            <div className="space-y-3 mt-3">
              {!todayPlan || todayPlan.sessions.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No sessions scheduled for today. Take a breather or check upcoming study days!
                </div>
              ) : (
                todayPlan.sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      sess.status === 'completed'
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                        : sess.status === 'in_progress'
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80'
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
                            {sess.startTime} – {sess.endTime} ({sess.durationMinutes}m)
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

                      {/* Interactive Task Status Selector */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                        <button
                          id={`dash-task-not-${sess.id}`}
                          onClick={() => markSessionStatus(todayPlan.date, sess.id, 'not_completed')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            sess.status === 'not_completed'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          <Circle className="w-3.5 h-3.5" /> Not Done
                        </button>
                        <button
                          id={`dash-task-prog-${sess.id}`}
                          onClick={() => markSessionStatus(todayPlan.date, sess.id, 'in_progress')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            sess.status === 'in_progress'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-400 hover:text-amber-600'
                          }`}
                        >
                          <PlayCircle className="w-3.5 h-3.5" /> In Progress
                        </button>
                        <button
                          id={`dash-task-comp-${sess.id}`}
                          onClick={() => markSessionStatus(todayPlan.date, sess.id, 'completed')}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            sess.status === 'completed'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-slate-400 hover:text-emerald-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Weekly Study Distribution Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-display mb-3">
              Upcoming 7 Days Snapshot
            </h3>
            <div className="grid grid-cols-7 gap-2 text-center">
              {schedule?.days.slice(0, 7).map((d) => {
                const isSelected = d.date === todayPlan?.date;
                const completedSessions = d.sessions.filter((s) => s.status === 'completed').length;
                return (
                  <div
                    key={d.date}
                    onClick={() => setActiveTab('study-plan')}
                    className={`p-2.5 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/20'
                        : d.isMissed
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50'
                        : d.isExamDay
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      {d.dayName.slice(0, 3)}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {d.date.split('-')[2]}
                    </div>
                    <div className="mt-2 text-[10px] font-semibold">
                      {d.isExamDay ? (
                        <span className="text-rose-500">Exam</span>
                      ) : d.isMissed ? (
                        <span className="text-amber-500">Missed</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">
                          {completedSessions}/{d.sessions.length}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Priority Section & Upcoming Exams Countdown */}
        <div className="space-y-6">
          {/* Priority Section (Requirement 4 & 9) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Intelligent Priority Ranking
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Algorithm combines difficulty & exam urgency
                </p>
              </div>
              <button
                id="dash-manage-subjects-btn"
                onClick={() => setActiveTab('subjects')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2.5">
              {subjects
                .sort(
                  (a, b) =>
                    (b.calculatedPriority?.score || 0) -
                    (a.calculatedPriority?.score || 0)
                )
                .map((sub) => {
                  const prio = sub.calculatedPriority;
                  const daysLeft = Math.max(0, differenceInDays(sub.examDate, todayStr));
                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubjectModal(sub)}
                      className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 cursor-pointer transition flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-8 rounded-full"
                          style={{ backgroundColor: sub.color }}
                        />
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                            {sub.name}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="capitalize">{sub.difficulty}</span>
                            <span>•</span>
                            <span>{daysLeft}d left</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {prio && (
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              prio.level === 'high'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                : prio.level === 'medium'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                            }`}
                          >
                            {prio.level} Priority
                          </span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Score: {prio?.score}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Upcoming Exams Countdown Cards */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" /> Exam Countdowns
              </h3>
              <span className="text-xs text-slate-400">Chronological</span>
            </div>

            <div className="space-y-2.5">
              {upcomingExams.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {s.name} Exam
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formatDate(s.examDate)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                        s.daysLeft <= 3
                          ? 'bg-rose-500 text-white animate-pulse'
                          : s.daysLeft <= 7
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {s.daysLeft === 0 ? 'Today!' : `${s.daysLeft} Days Remaining`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
