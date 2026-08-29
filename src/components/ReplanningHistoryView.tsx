import React from 'react';
import {
  History,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { formatDate, formatLongDate } from '../utils/dateUtils';

export const ReplanningHistoryView: React.FC = () => {
  const { replanHistory, setIsReplanModalOpen, setActiveTab } = usePlanner();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              Schedule Replanning History
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              {replanHistory.length} Events Recorded
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit log of all automatic recalculations, preserved sessions, and redistributed study workloads.
          </p>
        </div>

        <button
          id="history-replan-btn"
          onClick={() => setIsReplanModalOpen(true)}
          className="px-4 py-2.5 rounded-xl font-bold text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Trigger New Replan
        </button>
      </div>

      {/* History Timeline */}
      {replanHistory.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
            No Replanning Events Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Whenever you mark a study day as missed, the engine will record the recalculation stats, carried tasks, and priority adjustments here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {replanHistory.map((event) => (
            <div
              key={event.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
            >
              {/* Event Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                      {event.reason || 'Study day missed – Schedule regenerated'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Triggered on: {formatLongDate(event.date)}</span>
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 self-start sm:self-center">
                  Schedule Rebalanced
                </span>
              </div>

              {/* Stat Pills */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px]">Tasks Carried Forward</div>
                  <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {event.tasksCarriedForward} sessions
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px]">Previous Prep Days</div>
                  <div className="text-base font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {event.prevRemainingDays} days
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  <div className="text-slate-400 text-[11px]">Updated Prep Days</div>
                  <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {event.updatedRemainingDays} days
                  </div>
                </div>
              </div>

              {/* Priority Updates List */}
              {event.updatedPrioritySubjects && event.updatedPrioritySubjects.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Dynamic Subject Adjustments
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {event.updatedPrioritySubjects.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800 text-xs flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.subjectName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.changeDescription}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Notes */}
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                "{event.summaryNotes}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
