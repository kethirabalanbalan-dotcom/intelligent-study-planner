import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  BookOpen,
  Calendar
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';

export const RecommendationsView: React.FC = () => {
  const {
    recommendations,
    subjects,
    setActiveTab,
    setIsReplanModalOpen,
    setSelectedSubjectModal
  } = usePlanner();

  const handleAction = (rec: (typeof recommendations)[0]) => {
    if (rec.actionType === 'replan') {
      setIsReplanModalOpen(true);
    } else if (rec.actionType === 'view_subject' && rec.subjectId) {
      const sub = subjects.find((s) => s.id === rec.subjectId);
      if (sub) setSelectedSubjectModal(sub);
    } else if (rec.targetTab) {
      setActiveTab(rec.targetTab);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
              Smart Study Recommendations
            </h2>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Dynamic Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time rule-based cognitive advice tailored to your subject difficulty, exam dates, and task completion velocity.
          </p>
        </div>
      </div>

      {/* Recommendations Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {recommendations.map((rec) => {
          const isUrgent = rec.type === 'urgent';
          const isReplan = rec.type === 'replan';
          const isWarning = rec.type === 'warning';
          const isPraise = rec.type === 'praise';

          return (
            <div
              key={rec.id}
              className={`p-6 rounded-3xl border flex flex-col justify-between transition-all ${
                isUrgent
                  ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 shadow-xs'
                  : isReplan
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 shadow-xs'
                  : isWarning
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40'
                  : isPraise
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
              }`}
            >
              <div>
                {/* Header tag */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {isUrgent && <Flame className="w-5 h-5 text-rose-500 shrink-0" />}
                    {isReplan && <RefreshCw className="w-5 h-5 text-amber-500 shrink-0" />}
                    {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
                    {isPraise && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {!isUrgent && !isReplan && !isWarning && !isPraise && (
                      <Lightbulb className="w-5 h-5 text-indigo-500 shrink-0" />
                    )}

                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isUrgent
                          ? 'text-rose-700 dark:text-rose-300'
                          : isReplan
                          ? 'text-amber-700 dark:text-amber-300'
                          : isWarning
                          ? 'text-amber-700 dark:text-amber-300'
                          : isPraise
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-indigo-700 dark:text-indigo-300'
                      }`}
                    >
                      {isUrgent
                        ? 'High Urgency Alert'
                        : isReplan
                        ? 'Schedule Adaptation'
                        : isWarning
                        ? 'Study Alert'
                        : isPraise
                        ? 'Milestone Achieved'
                        : 'Optimization Tip'}
                    </span>
                  </div>

                  {rec.subjectName && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      {rec.subjectName}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display mb-2">
                  {rec.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {rec.message}
                </p>
              </div>

              {/* Action CTA */}
              {rec.actionText && (
                <div className="pt-4 mt-4 border-t border-black/5 dark:border-white/5 flex justify-end">
                  <button
                    id={`rec-action-${rec.id}`}
                    onClick={() => handleAction(rec)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                      isUrgent || isReplan
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {rec.actionText} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
