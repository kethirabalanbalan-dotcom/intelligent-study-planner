import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Calendar,
  BarChart3,
  Sparkles,
  History,
  Settings,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'subjects', label: 'My Subjects', icon: BookOpen },
  { id: 'study-plan', label: 'Study Plan', icon: CalendarDays },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'progress', label: 'Progress & Analytics', icon: BarChart3 },
  { id: 'recommendations', label: 'Smart Recommendations', icon: Sparkles, badge: 'AI' },
  { id: 'history', label: 'Replanning History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, schedule, subjects, replanHistory } = usePlanner();

  const completedCount = schedule?.days.reduce(
    (sum, d) => sum + d.sessions.filter((s) => s.status === 'completed').length,
    0
  ) || 0;

  const totalCount = schedule?.days.reduce(
    (sum, d) => sum + d.sessions.length,
    0
  ) || 0;

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-slate-50/60 dark:bg-slate-900/40 border-r border-slate-200/80 dark:border-slate-800 p-4 min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          // dynamic badges
          let badgeText = item.badge;
          if (item.id === 'subjects') {
            badgeText = String(subjects.length);
          } else if (item.id === 'history' && replanHistory.length > 0) {
            badgeText = String(replanHistory.length);
          }

          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {badgeText && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badge === 'AI'
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {badgeText}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mini Study Progress Card in Sidebar */}
      {schedule && (
        <div className="mt-auto p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Total Prep
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {schedule.overallProgress}%
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${schedule.overallProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            <span>{completedCount} / {totalCount} sessions</span>
            <span>{schedule.totalCompletedHours}h done</span>
          </div>
        </div>
      )}
    </aside>
  );
};
