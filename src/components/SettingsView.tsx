import React, { useState } from 'react';
import {
  User,
  Clock,
  Calendar,
  Sparkles,
  Moon,
  Sun,
  Bell,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Check,
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { DayOfWeek, StudyHoursMode } from '../types';

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
];

export const SettingsView: React.FC = () => {
  const {
    profile,
    updateProfile,
    generateSchedule,
    resetScheduleOnly,
    clearAllData,
    exportBackupData,
    importBackupData,
    addToast
  } = usePlanner();

  // Local form states
  const [name, setName] = useState(profile.name);
  const [startDate, setStartDate] = useState(profile.startDate);
  const [studyHoursMode, setStudyHoursMode] = useState<StudyHoursMode>(profile.studyHoursMode);
  const [defaultDailyHours, setDefaultDailyHours] = useState(profile.defaultDailyHours);
  const [customDailyHours, setCustomDailyHours] = useState(profile.customDailyHours);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(profile.sessionDurationMinutes);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(profile.breakDurationMinutes);
  const [startTimeOfDay, setStartTimeOfDay] = useState(profile.startTimeOfDay || '09:00');
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile.notificationsEnabled);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || 'Student',
      startDate,
      studyHoursMode,
      defaultDailyHours,
      customDailyHours,
      sessionDurationMinutes,
      breakDurationMinutes,
      startTimeOfDay,
      notificationsEnabled
    });
  };

  const handleCustomHourChange = (day: DayOfWeek, val: number) => {
    const clamped = Math.max(1, Math.min(14, val));
    setCustomDailyHours((prev) => ({ ...prev, [day]: clamped }));
  };

  const handleExport = () => {
    const jsonStr = exportBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyPlanner_Backup_${profile.name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Backup Exported', 'Downloaded study plan configuration file.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        importBackupData(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
          Study Preferences & Student Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your study cadence, break intervals, daily availability hours, and appearance.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Student Profile Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Student Profile & Start Date
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Student Name
              </label>
              <input
                id="settings-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Preparation Start Date
              </label>
              <input
                id="settings-start-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Available Study Hours Per Day (Requirement 3) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Daily Available Study Hours
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              The schedule engine will never allocate study time exceeding your designated daily hours.
            </p>
          </div>

          {/* Mode Selector Option 1 vs Option 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              id="settings-mode-uniform"
              onClick={() => setStudyHoursMode('uniform')}
              className={`p-4 rounded-2xl border text-left transition ${
                studyHoursMode === 'uniform'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="font-bold text-sm">Option 1: Same Hours Every Day</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Uniform daily study budget (e.g. 4 Hours per day).
              </div>
            </button>

            <button
              type="button"
              id="settings-mode-custom"
              onClick={() => setStudyHoursMode('custom')}
              className={`p-4 rounded-2xl border text-left transition ${
                studyHoursMode === 'custom'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="font-bold text-sm">Option 2: Custom Daily Availability</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Specify different study hours for different days of the week.
              </div>
            </button>
          </div>

          {/* Option 1 Input */}
          {studyHoursMode === 'uniform' ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Hours Per Day: <span className="text-indigo-600 dark:text-indigo-400">{defaultDailyHours} Hours</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="settings-default-hours-range"
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={defaultDailyHours}
                  onChange={(e) => setDefaultDailyHours(Number(e.target.value))}
                  className="flex-1 accent-indigo-600 cursor-pointer"
                />
                <span className="font-bold text-lg text-slate-900 dark:text-white w-14 text-right">
                  {defaultDailyHours}h
                </span>
              </div>
            </div>
          ) : (
            /* Option 2 Input Table */
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Custom Weekday Schedule
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {DAYS_OF_WEEK.map((d) => (
                  <div
                    key={d.key}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center"
                  >
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{d.label.slice(0, 3)}</div>
                    <input
                      id={`custom-hours-${d.key}`}
                      type="number"
                      min="1"
                      max="14"
                      step="0.5"
                      value={customDailyHours[d.key]}
                      onChange={(e) => handleCustomHourChange(d.key, parseFloat(e.target.value) || 1)}
                      className="w-full text-center mt-1 font-bold text-sm text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">hours</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cadence & Break Intervals */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Session Durations & Breaks
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Study Session Length
              </label>
              <select
                id="settings-session-length-select"
                value={sessionDurationMinutes}
                onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value={45}>45 Minutes (High Focus)</option>
                <option value={60}>60 Minutes (Standard)</option>
                <option value={90}>90 Minutes (Deep Work)</option>
                <option value={120}>120 Minutes (Intense Drill)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Active Break Length
              </label>
              <select
                id="settings-break-length-select"
                value={breakDurationMinutes}
                onChange={(e) => setBreakDurationMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value={10}>10 Minutes (Quick Stretch)</option>
                <option value={15}>15 Minutes (Recommended)</option>
                <option value={20}>20 Minutes (Relaxation)</option>
                <option value={30}>30 Minutes (Meal / Walk)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Daily Study Start Time
              </label>
              <input
                id="settings-start-time-input"
                type="time"
                value={startTimeOfDay}
                onChange={(e) => setStartTimeOfDay(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications & System Preferences */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Smart Exam Reminders</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Receive notifications when exams approach or when replanning is recommended.
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              id="settings-notif-toggle"
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            id="settings-save-btn"
            className="px-6 py-3 rounded-2xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition"
          >
            Save All Preferences & Re-sync Plan
          </button>
        </div>
      </form>

      {/* Backup & Recovery */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
          Backup & Data Portability
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Save a copy of your study plan to your device or restore from a previous JSON backup.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            id="settings-export-btn"
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Study Plan JSON
          </button>

          <label
            htmlFor="settings-import-input"
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Import Backup JSON
            <input
              id="settings-import-input"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Danger Zone (Requirement 17) */}
      <div className="p-6 rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
          <ShieldAlert className="w-5 h-5" /> Danger Zone
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Resetting will regenerate the plan based on current subjects. Clearing data will restore original demo settings.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            id="settings-reset-plan-btn"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset Study Plan
          </button>

          <button
            type="button"
            id="settings-clear-data-btn"
            onClick={() => setIsClearConfirmOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Clear All Data
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white font-display">
              Reset Study Plan?
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              This will regenerate all day-wise sessions from scratch using your subjects and availability hours. Completed session checkmarks will be refreshed.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                id="settings-reset-confirm-btn"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  resetScheduleOnly();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700"
              >
                Yes, Reset Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-rose-600 dark:text-rose-400 font-display">
              Clear All Data & Restore Demo?
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              This will erase all custom subjects, replanning history, and progress records, restoring the initial student workspace for Ari.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                id="settings-clear-confirm-btn"
                onClick={() => {
                  setIsClearConfirmOpen(false);
                  clearAllData();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700"
              >
                Yes, Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
