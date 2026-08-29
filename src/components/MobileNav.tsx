import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Calendar,
  Sparkles,
  Settings
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';

const MOBILE_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'study-plan', label: 'Plan', icon: CalendarDays },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'recommendations', label: 'AI Tips', icon: Sparkles },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = usePlanner();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
