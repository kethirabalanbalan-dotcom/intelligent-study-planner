import React, { useState, useRef, useEffect } from 'react';
import {
  BrainCircuit,
  Bell,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  CheckCheck,
  Flame,
  X,
  AlertTriangle,
  LogOut,
  User,
  Settings,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/dateUtils';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const {
    profile,
    updateProfile,
    schedule,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setIsReplanModalOpen,
    setActiveTab
  } = usePlanner();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = profile.name || currentUser?.name || 'Student';

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Student Welcome */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  StudyPlanner
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Intelligent AI Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Welcome, <span className="font-semibold text-slate-700 dark:text-slate-300">{displayName}</span>! Exam prep on track.
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Replan Action */}
            <button
              type="button"
              id="navbar-replan-btn"
              onClick={() => setIsReplanModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition shadow-xs"
              title="Intelligent Replan for Missed Days"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden xs:inline">Missed Day /</span> Replan
            </button>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                id="navbar-notifications-btn"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Reminders & Alerts</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        id="navbar-mark-all-read-btn"
                        onClick={markAllNotificationsRead}
                        className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-center py-6 text-slate-400 dark:text-slate-500">
                        No notifications yet. You're all caught up!
                      </p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.actionTab) setActiveTab(n.actionTab);
                            setIsNotifOpen(false);
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                            n.read
                              ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                              : 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-slate-800 dark:text-slate-200 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              {n.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                              {n.type === 'info' && <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(n.timestamp.split('T')[0])}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <button
              type="button"
              id="navbar-theme-toggle-btn"
              onClick={() => updateProfile({ darkMode: !profile.darkMode })}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Theme"
            >
              {profile.darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Student Avatar Pill & Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                id="navbar-profile-dropdown-btn"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 pl-2 sm:pl-3 pr-2 py-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                aria-label="User Profile"
              >
                <div
                  className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-xs shrink-0"
                  style={{
                    backgroundColor: currentUser?.avatarColor || '#6366F1'
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left leading-tight hidden lg:block">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                    <Flame className="w-3 h-3 fill-current" /> Study Ready
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Menu Popover */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {displayName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {currentUser?.email || 'Logged in account'}
                    </div>
                  </div>

                  <div className="py-1.5 space-y-0.5 text-xs font-medium">
                    <button
                      type="button"
                      id="navbar-profile-menu-subjects-btn"
                      onClick={() => {
                        setActiveTab('subjects');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span>My Subjects</span>
                    </button>

                    <button
                      type="button"
                      id="navbar-profile-menu-settings-btn"
                      onClick={() => {
                        setActiveTab('settings');
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                    >
                      <Settings className="w-4 h-4 text-indigo-500" />
                      <span>Study Preferences & Settings</span>
                    </button>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      id="navbar-profile-menu-logout-btn"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsLogoutModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition text-left font-bold text-xs"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Navbar Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Log Out of Study Planner?
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to log out? Your personal study schedule and progress for <strong>{displayName}</strong> will remain safely saved in your account.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="navbar-modal-logout-confirm-btn"
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  logout();
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

