import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import confetti from 'canvas-confetti';
import {
  StudentProfile,
  Subject,
  StudySchedule,
  DayPlan,
  StudySession,
  TaskStatus,
  ReplanEvent,
  SmartRecommendation,
  AppNotification,
  ManualSessionInput,
  PriorityLevel
} from '../types';
import {
  calculateSubjectPriority,
  enrichSubjectsWithPriorities,
  generateStudySchedule,
  replanScheduleForMissedDays,
  calculateDayProgress
} from '../utils/scheduler';
import { generateSmartRecommendations } from '../utils/recommendations';
import {
  getTodayDateString,
  getDayOfWeekName,
  getDayOfWeekKey,
  parseTimeToMinutes,
  formatTime12h,
  formatDate
} from '../utils/dateUtils';
import { useAuth } from './AuthContext';
import { StudySessionModal } from '../components/StudySessionModal';

// Storage key helper scoped to user
const getStorageKeyForUser = (userId: string) => `study_planner_user_data_${userId}`;

// Initial Profile Template
const createInitialProfile = (name: string): StudentProfile => ({
  name: name || 'Student',
  startDate: getTodayDateString(),
  defaultDailyHours: 4,
  studyHoursMode: 'uniform',
  customDailyHours: {
    monday: 4,
    tuesday: 4,
    wednesday: 4,
    thursday: 4,
    friday: 4,
    saturday: 6,
    sunday: 6
  },
  sessionDurationMinutes: 120,
  breakDurationMinutes: 15,
  startTimeOfDay: '09:00',
  darkMode: false,
  notificationsEnabled: true
});

// Default starting subjects for new user
const INITIAL_SUBJECTS: Omit<Subject, 'id' | 'calculatedPriority'>[] = [
  {
    name: 'Mathematics',
    examDate: '2026-09-15',
    difficulty: 'hard',
    confidenceLevel: 35,
    estimatedTopics: 9,
    color: '#6366F1', // Indigo
    topics: [
      'Algebra & Quadratic Equations',
      'Calculus & Differentiation',
      'Integral Calculus & Applications',
      'Trigonometric Identities & Graphs',
      'Coordinate Geometry & Vectors',
      'Probability Distributions & Statistics',
      'Matrices & Systems of Linear Equations',
      'Differential Equations & Modeling',
      'Comprehensive Mathematics Mock Paper'
    ]
  },
  {
    name: 'Physics',
    examDate: '2026-09-18',
    difficulty: 'hard',
    confidenceLevel: 45,
    estimatedTopics: 8,
    color: '#EC4899', // Pink
    topics: [
      'Kinematics & Newton Laws of Motion',
      'Work, Energy & Conservation Principles',
      'Rotational Dynamics & Gravitation',
      'Thermodynamics & Heat Cycles',
      'Oscillations & Mechanical Waves',
      'Electrostatics & Electric Currents',
      'Optics & Wave Nature of Light',
      'Modern Physics & Quantum Formulas'
    ]
  },
  {
    name: 'Computer Science',
    examDate: '2026-09-25',
    difficulty: 'medium',
    confidenceLevel: 70,
    estimatedTopics: 6,
    color: '#3B82F6', // Blue
    topics: [
      'Data Structures: Arrays, Stacks, Queues',
      'Algorithms: Sorting, Searching & Big-O',
      'Object-Oriented Programming & Principles',
      'Relational Databases & Complex SQL',
      'Computer Networks & Protocols',
      'Operating Systems & Concurrency'
    ]
  },
  {
    name: 'English',
    examDate: '2026-09-22',
    difficulty: 'easy',
    confidenceLevel: 85,
    estimatedTopics: 6,
    color: '#10B981', // Emerald
    topics: [
      'Critical Reading Comprehension',
      'Advanced Grammar & Sentence Structuring',
      'Persuasive Essay & Thesis Formation',
      'Literary Devices & Poetry Critique',
      'Contextual Vocabulary & Idioms',
      'Timed Past Exam Paper Drill'
    ]
  }
];

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface PlannerContextType {
  profile: StudentProfile;
  subjects: Subject[];
  schedule: StudySchedule | null;
  replanHistory: ReplanEvent[];
  recommendations: SmartRecommendation[];
  notifications: AppNotification[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedSubjectModal: Subject | null;
  setSelectedSubjectModal: (sub: Subject | null) => void;
  selectedDateForDetail: string | null;
  setSelectedDateForDetail: (date: string | null) => void;
  isReplanModalOpen: boolean;
  setIsReplanModalOpen: (open: boolean) => void;
  targetMissedDate: string | null;
  setTargetMissedDate: (date: string | null) => void;
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Manual Session Modal Controls
  openAddSessionModal: (date?: string, subjectId?: string) => void;
  openEditSessionModal: (session: StudySession, date: string) => void;
  closeSessionModal: () => void;

  // Actions
  updateProfile: (updated: Partial<StudentProfile>) => void;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  // Manual Session Management
  addManualSession: (data: ManualSessionInput) => boolean;
  updateManualSession: (sessionId: string, originalDate: string, data: ManualSessionInput) => boolean;
  deleteManualSession: (date: string, sessionId: string) => void;
  markSessionStatus: (date: string, sessionId: string, status: TaskStatus) => void;

  // Missed Day / Replan
  markDayMissed: (date: string, reason?: string) => void;
  replanSchedule: (missedDates: string[], reason: string) => void;
  replanScheduleAuto: (missedDates: string[], reason: string, selectedSessionIds?: string[]) => ReplanEvent | null;
  replanScheduleManual: (
    missedDates: string[],
    reason: string,
    assignments: { sessionId: string; originalDate: string; newDate: string; startTime: string; endTime: string }[]
  ) => ReplanEvent | null;

  // General Actions
  generateSchedule: () => void;
  resetScheduleOnly: () => void;
  clearAllData: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  exportBackupData: () => string;
  importBackupData: (jsonStr: string) => boolean;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateCurrentUserProfile } = useAuth();

  const [profile, setProfile] = useState<StudentProfile>(() => {
    return createInitialProfile(currentUser?.name || 'Student');
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    return enrichSubjectsWithPriorities(
      INITIAL_SUBJECTS.map((s, idx) => ({ ...s, id: `sub_${idx + 1}` })),
      getTodayDateString()
    );
  });

  // Schedule is null by default on first load — NO auto-generation on first use!
  const [schedule, setSchedule] = useState<StudySchedule | null>(null);

  const [replanHistory, setReplanHistory] = useState<ReplanEvent[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif_welcome',
      type: 'info',
      title: 'Welcome to Intelligent Study Planner',
      message: "Create your personalized study plan manually by clicking '+ Add Study Plan'.",
      timestamp: new Date().toISOString(),
      read: false
    }
  ]);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSubjectModal, setSelectedSubjectModal] = useState<Subject | null>(null);
  const [selectedDateForDetail, setSelectedDateForDetail] = useState<string | null>(null);
  const [isReplanModalOpen, setIsReplanModalOpen] = useState<boolean>(false);
  const [targetMissedDate, setTargetMissedDate] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Manual Session Modal State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [sessionModalDate, setSessionModalDate] = useState<string | undefined>(undefined);
  const [sessionModalSubjectId, setSessionModalSubjectId] = useState<string | undefined>(undefined);
  const [sessionToEdit, setSessionToEdit] = useState<{ session: StudySession; date: string } | null>(null);

  // Modal open/close helpers
  const openAddSessionModal = useCallback((date?: string, subjectId?: string) => {
    setSessionToEdit(null);
    setSessionModalDate(date || getTodayDateString());
    setSessionModalSubjectId(subjectId);
    setIsSessionModalOpen(true);
  }, []);

  const openEditSessionModal = useCallback((session: StudySession, date: string) => {
    setSessionToEdit({ session, date });
    setSessionModalDate(date);
    setSessionModalSubjectId(session.subjectId);
    setIsSessionModalOpen(true);
  }, []);

  const closeSessionModal = useCallback(() => {
    setIsSessionModalOpen(false);
    setSessionToEdit(null);
    setSessionModalDate(undefined);
    setSessionModalSubjectId(undefined);
  }, []);

  // Load user specific data whenever currentUser changes
  useEffect(() => {
    if (!currentUser) return;

    const userKey = getStorageKeyForUser(currentUser.id);
    try {
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile) {
          setProfile({ ...parsed.profile, name: parsed.profile.name || currentUser.name });
        } else {
          setProfile(createInitialProfile(currentUser.name));
        }

        if (parsed.subjects && Array.isArray(parsed.subjects)) {
          const stDate = parsed.profile?.startDate || getTodayDateString();
          setSubjects(enrichSubjectsWithPriorities(parsed.subjects, stDate));
        } else {
          const mappedInit = INITIAL_SUBJECTS.map((s, idx) => ({ ...s, id: `sub_${idx + 1}` }));
          setSubjects(enrichSubjectsWithPriorities(mappedInit, getTodayDateString()));
        }

        // Only load schedule if user already created one
        if (parsed.schedule && parsed.schedule.days) {
          setSchedule(parsed.schedule);
        } else {
          setSchedule(null);
        }

        if (Array.isArray(parsed.replanHistory)) {
          setReplanHistory(parsed.replanHistory);
        } else {
          setReplanHistory([]);
        }

        if (Array.isArray(parsed.notifications)) {
          setNotifications(parsed.notifications);
        } else {
          setNotifications([
            {
              id: 'notif_welcome_' + Date.now(),
              type: 'info',
              title: `Welcome, ${currentUser.name}!`,
              message: "Click '+ Add Study Plan' to create your personalized study sessions.",
              timestamp: new Date().toISOString(),
              read: false
            }
          ]);
        }
        return;
      }
    } catch (e) {
      console.error('Failed to load user study data:', e);
    }

    // Default state for brand new user — DO NOT auto-generate a schedule!
    const initialProf = createInitialProfile(currentUser.name);
    const mappedInit = INITIAL_SUBJECTS.map((s, idx) => ({ ...s, id: `sub_${idx + 1}` }));
    const enrichedSubs = enrichSubjectsWithPriorities(mappedInit, initialProf.startDate);

    setProfile(initialProf);
    setSubjects(enrichedSubs);
    setSchedule(null); // Explicit empty schedule on first use!
    setReplanHistory([]);
    setNotifications([
      {
        id: 'notif_welcome_' + Date.now(),
        type: 'info',
        title: `Welcome, ${currentUser.name}!`,
        message: "Your workspace is ready. Click '+ Add Study Plan' to schedule your first manual study session.",
        timestamp: new Date().toISOString(),
        read: false
      }
    ]);
  }, [currentUser]);

  // Dark mode effect
  useEffect(() => {
    if (profile.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [profile.darkMode]);

  // Persist user-specific state to localStorage
  useEffect(() => {
    if (!currentUser) return;
    try {
      const userKey = getStorageKeyForUser(currentUser.id);
      const state = {
        profile,
        subjects,
        schedule,
        replanHistory,
        notifications
      };
      localStorage.setItem(userKey, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save user data to localStorage:', e);
    }
  }, [currentUser, profile, subjects, schedule, replanHistory, notifications]);

  // Toast helper
  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Recalculate schedule stats helper
  const calculateScheduleStats = useCallback((days: DayPlan[]) => {
    let totalPlannedMinutes = 0;
    let totalCompletedMinutes = 0;
    let totalSessions = 0;
    let completedSessions = 0;

    days.forEach((d) => {
      d.sessions.forEach((s) => {
        totalPlannedMinutes += s.durationMinutes;
        totalSessions++;
        if (s.status === 'completed') {
          totalCompletedMinutes += s.durationMinutes;
          completedSessions++;
        }
      });
    });

    const overallProgress =
      totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    const totalPlannedHours = Number((totalPlannedMinutes / 60).toFixed(1));
    const totalCompletedHours = Number((totalCompletedMinutes / 60).toFixed(1));

    return {
      totalPlannedHours,
      totalCompletedHours,
      overallProgress
    };
  }, []);

  // Update Profile
  const updateProfile = useCallback((updated: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      if (updated.name && updateCurrentUserProfile) {
        updateCurrentUserProfile({ name: updated.name });
      }
      return next;
    });
    addToast('success', 'Settings Updated', 'Your profile and study preferences have been saved.');
  }, [updateCurrentUserProfile, addToast]);

  // Add Subject (does NOT auto-generate a schedule)
  const addSubject = useCallback((sub: Omit<Subject, 'id'>) => {
    const newId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newSubject: Subject = {
      ...sub,
      id: newId
    };
    const updatedList = enrichSubjectsWithPriorities([...subjects, newSubject], profile.startDate);
    setSubjects(updatedList);

    addToast('success', 'Subject Added', `${sub.name} added successfully. You can now schedule manual study plans for it.`);
  }, [subjects, profile.startDate, addToast]);

  // Update Subject
  const updateSubject = useCallback((id: string, updated: Partial<Subject>) => {
    const updatedList = subjects.map((s) => (s.id === id ? { ...s, ...updated } : s));
    const enriched = enrichSubjectsWithPriorities(updatedList, profile.startDate);
    setSubjects(enriched);

    // Update subject name & color in any existing schedule sessions
    if (schedule) {
      const targetSub = enriched.find((s) => s.id === id);
      if (targetSub) {
        const updatedDays = schedule.days.map((day) => ({
          ...day,
          sessions: day.sessions.map((sess) =>
            sess.subjectId === id
              ? { ...sess, subjectName: targetSub.name, subjectColor: targetSub.color }
              : sess
          )
        }));
        setSchedule({ ...schedule, days: updatedDays });
      }
    }

    addToast('info', 'Subject Updated', 'Subject details updated successfully.');
  }, [subjects, profile.startDate, schedule, addToast]);

  // Delete Subject
  const deleteSubject = useCallback((id: string) => {
    const target = subjects.find((s) => s.id === id);
    if (!target) return;

    const remainingSubjects = subjects.filter((s) => s.id !== id);
    const enrichedRemaining = enrichSubjectsWithPriorities(remainingSubjects, profile.startDate);
    setSubjects(enrichedRemaining);

    // Remove deleted subject's sessions from existing schedule
    if (schedule) {
      const updatedDays = schedule.days.map((day) => {
        const remainingSessions = day.sessions.filter((s) => s.subjectId !== id);
        return {
          ...day,
          sessions: remainingSessions,
          progressPercentage: calculateDayProgress(remainingSessions),
          allocatedHours: Number(
            (remainingSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1)
          )
        };
      });

      const stats = calculateScheduleStats(updatedDays);
      setSchedule({
        ...schedule,
        days: updatedDays,
        ...stats
      });
    }

    setSelectedSubjectModal((current) => (current?.id === id ? null : current));
    addToast('success', 'Subject Deleted', `${target.name} removed successfully.`);
  }, [subjects, profile.startDate, schedule, calculateScheduleStats, addToast]);

  // ADD MANUAL STUDY SESSION
  const addManualSession = useCallback((data: ManualSessionInput): boolean => {
    const targetSubject = subjects.find((s) => s.id === data.subjectId);
    if (!targetSubject) {
      addToast('error', 'Subject Not Found', 'Please choose a valid subject.');
      return false;
    }

    const newSession: StudySession = {
      id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      subjectId: targetSubject.id,
      subjectName: targetSubject.name,
      subjectColor: targetSubject.color,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes,
      status: data.status || 'not_completed',
      topic: data.topic,
      priority: data.priority || 'medium',
      notes: data.notes,
      sessionType: 'study'
    };

    // Find available daily hours for profile
    const dayKey = getDayOfWeekKey(data.date);
    const availableHours =
      profile.studyHoursMode === 'custom' && profile.customDailyHours
        ? profile.customDailyHours[dayKey] || profile.defaultDailyHours || 4
        : profile.defaultDailyHours || 4;

    const currentDays = schedule?.days ? [...schedule.days] : [];
    const dayIndex = currentDays.findIndex((d) => d.date === data.date);

    if (dayIndex >= 0) {
      // Day already exists
      const existingDay = currentDays[dayIndex];
      const updatedSessions = [...existingDay.sessions, newSession].sort(
        (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
      );

      const allocatedMinutes = updatedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

      currentDays[dayIndex] = {
        ...existingDay,
        sessions: updatedSessions,
        allocatedHours: Number((allocatedMinutes / 60).toFixed(1)),
        progressPercentage: calculateDayProgress(updatedSessions)
      };
    } else {
      // Create new DayPlan
      const isExamDay = subjects.some((s) => s.examDate === data.date);
      const examSubjects = subjects.filter((s) => s.examDate === data.date);

      const newDay: DayPlan = {
        date: data.date,
        dayName: getDayOfWeekName(data.date),
        availableHours,
        allocatedHours: Number((data.durationMinutes / 60).toFixed(1)),
        isMissed: false,
        isExamDay,
        examSubjects,
        sessions: [newSession],
        breaks: [],
        dailyGoal: `Complete ${targetSubject.name}: ${data.topic}`,
        progressPercentage: data.status === 'completed' ? 100 : 0
      };

      currentDays.push(newDay);
      // Sort days chronologically
      currentDays.sort((a, b) => a.date.localeCompare(b.date));
    }

    const stats = calculateScheduleStats(currentDays);
    const minDate = currentDays[0]?.date || data.date;
    const maxDate = currentDays[currentDays.length - 1]?.date || data.date;

    setSchedule({
      id: schedule?.id || 'schedule_manual_' + Date.now(),
      generatedAt: schedule?.generatedAt || new Date().toISOString(),
      startDate: minDate,
      endDate: maxDate,
      days: currentDays,
      ...stats,
      isInsufficientTime: false
    });

    addToast(
      'success',
      'Study Plan Added',
      `"${data.topic}" scheduled for ${formatDate(data.date)} (${data.startTime} - ${data.endTime}).`
    );
    return true;
  }, [subjects, profile, schedule, calculateScheduleStats, addToast]);

  // UPDATE MANUAL STUDY SESSION
  const updateManualSession = useCallback(
    (sessionId: string, originalDate: string, data: ManualSessionInput): boolean => {
      const targetSubject = subjects.find((s) => s.id === data.subjectId);
      if (!targetSubject) {
        addToast('error', 'Subject Not Found', 'Please choose a valid subject.');
        return false;
      }

      if (!schedule) return false;

      let currentDays = [...schedule.days];

      if (originalDate === data.date) {
        // Date did not change
        const dayIndex = currentDays.findIndex((d) => d.date === originalDate);
        if (dayIndex >= 0) {
          const day = currentDays[dayIndex];
          const updatedSessions = day.sessions
            .map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    subjectId: targetSubject.id,
                    subjectName: targetSubject.name,
                    subjectColor: targetSubject.color,
                    date: data.date,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    durationMinutes: data.durationMinutes,
                    topic: data.topic,
                    priority: data.priority,
                    notes: data.notes,
                    status: data.status || s.status
                  }
                : s
            )
            .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

          const allocatedMinutes = updatedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

          currentDays[dayIndex] = {
            ...day,
            sessions: updatedSessions,
            allocatedHours: Number((allocatedMinutes / 60).toFixed(1)),
            progressPercentage: calculateDayProgress(updatedSessions)
          };
        }
      } else {
        // Date changed: remove from original date, add to new date
        let sessionToMove: StudySession | null = null;

        // Remove from original date
        currentDays = currentDays.map((day) => {
          if (day.date === originalDate) {
            const found = day.sessions.find((s) => s.id === sessionId);
            if (found) sessionToMove = found;
            const remaining = day.sessions.filter((s) => s.id !== sessionId);
            return {
              ...day,
              sessions: remaining,
              allocatedHours: Number(
                (remaining.reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1)
              ),
              progressPercentage: calculateDayProgress(remaining)
            };
          }
          return day;
        });

        const updatedSession: StudySession = {
          id: sessionId,
          subjectId: targetSubject.id,
          subjectName: targetSubject.name,
          subjectColor: targetSubject.color,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          durationMinutes: data.durationMinutes,
          topic: data.topic,
          priority: data.priority,
          notes: data.notes,
          status: data.status || sessionToMove?.status || 'not_completed',
          sessionType: sessionToMove?.sessionType || 'study'
        };

        // Add to new date
        const newDayIndex = currentDays.findIndex((d) => d.date === data.date);
        if (newDayIndex >= 0) {
          const day = currentDays[newDayIndex];
          const updatedSessions = [...day.sessions, updatedSession].sort(
            (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
          );
          currentDays[newDayIndex] = {
            ...day,
            sessions: updatedSessions,
            allocatedHours: Number(
              (updatedSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1)
            ),
            progressPercentage: calculateDayProgress(updatedSessions)
          };
        } else {
          const dayKey = getDayOfWeekKey(data.date);
          const availableHours =
            profile.studyHoursMode === 'custom' && profile.customDailyHours
              ? profile.customDailyHours[dayKey] || profile.defaultDailyHours || 4
              : profile.defaultDailyHours || 4;

          const isExamDay = subjects.some((s) => s.examDate === data.date);
          const examSubjects = subjects.filter((s) => s.examDate === data.date);

          currentDays.push({
            date: data.date,
            dayName: getDayOfWeekName(data.date),
            availableHours,
            allocatedHours: Number((data.durationMinutes / 60).toFixed(1)),
            isMissed: false,
            isExamDay,
            examSubjects,
            sessions: [updatedSession],
            breaks: [],
            dailyGoal: `Complete ${targetSubject.name}: ${data.topic}`,
            progressPercentage: updatedSession.status === 'completed' ? 100 : 0
          });
          currentDays.sort((a, b) => a.date.localeCompare(b.date));
        }
      }

      const stats = calculateScheduleStats(currentDays);
      setSchedule({
        ...schedule,
        days: currentDays,
        ...stats
      });

      addToast('success', 'Study Session Updated', 'Changes saved successfully.');
      return true;
    },
    [subjects, profile, schedule, calculateScheduleStats, addToast]
  );

  // DELETE MANUAL STUDY SESSION
  const deleteManualSession = useCallback(
    (dateStr: string, sessionId: string) => {
      if (!schedule) return;

      const updatedDays = schedule.days.map((day) => {
        if (day.date === dateStr) {
          const remaining = day.sessions.filter((s) => s.id !== sessionId);
          const allocatedMinutes = remaining.reduce((sum, s) => sum + s.durationMinutes, 0);
          return {
            ...day,
            sessions: remaining,
            allocatedHours: Number((allocatedMinutes / 60).toFixed(1)),
            progressPercentage: calculateDayProgress(remaining)
          };
        }
        return day;
      });

      const stats = calculateScheduleStats(updatedDays);
      setSchedule({
        ...schedule,
        days: updatedDays,
        ...stats
      });

      addToast('info', 'Session Removed', 'Study session deleted from your plan.');
    },
    [schedule, calculateScheduleStats, addToast]
  );

  // MARK SESSION STATUS (Completed, In Progress, Not Completed)
  const markSessionStatus = useCallback(
    (dateStr: string, sessionId: string, status: TaskStatus) => {
      if (!schedule) return;

      let newlyCompleted = false;
      let dayBecame100Percent = false;

      const updatedDays = schedule.days.map((day) => {
        if (day.date === dateStr) {
          const updatedSessions = day.sessions.map((sess) => {
            if (sess.id === sessionId) {
              if (status === 'completed' && sess.status !== 'completed') {
                newlyCompleted = true;
              }
              return {
                ...sess,
                status,
                completedAt: status === 'completed' ? new Date().toISOString() : undefined
              };
            }
            return sess;
          });

          const newProgress = calculateDayProgress(updatedSessions);
          if (newProgress === 100 && day.progressPercentage < 100) {
            dayBecame100Percent = true;
          }

          return {
            ...day,
            sessions: updatedSessions,
            progressPercentage: newProgress
          };
        }
        return day;
      });

      const stats = calculateScheduleStats(updatedDays);

      setSchedule({
        ...schedule,
        days: updatedDays,
        ...stats
      });

      if (newlyCompleted) {
        if (dayBecame100Percent) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
          addToast('success', 'Daily Goal Achieved! 🎉', '100% of study sessions completed for this day!');
        } else {
          addToast('success', 'Session Completed', 'Progress updated!');
        }
      }
    },
    [schedule, calculateScheduleStats, addToast]
  );

  // Mark Day Missed
  const markDayMissed = useCallback((dateStr: string, reason: string = 'Missed study day') => {
    setTargetMissedDate(dateStr);
    setIsReplanModalOpen(true);
  }, []);

  // REPLAN: SELECTIVE REDISTRIBUTION MODE
  const replanScheduleAuto = useCallback(
    (missedDates: string[], reason: string, selectedSessionIds?: string[]): ReplanEvent | null => {
      if (!schedule) return null;

      const missedSet = new Set(missedDates);
      const incompleteSessions: StudySession[] = [];

      // Mark missed days and extract selectively targeted unfinished tasks
      const updatedDays: DayPlan[] = schedule.days.map((day) => {
        if (missedSet.has(day.date)) {
          const remainingSessions: StudySession[] = [];

          day.sessions.forEach((sess) => {
            const isTargeted = !selectedSessionIds || selectedSessionIds.includes(sess.id);
            if (sess.status !== 'completed' && isTargeted) {
              incompleteSessions.push({ ...sess, date: day.date, isCarriedForward: true });
            } else {
              remainingSessions.push(sess);
            }
          });

          return {
            ...day,
            isMissed: true,
            missedReason: reason,
            sessions: remainingSessions,
            allocatedHours: Number(
              (remainingSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1)
            ),
            progressPercentage: calculateDayProgress(remainingSessions)
          };
        }
        return day;
      });

      const latestMissedDate = missedDates.sort()[missedDates.length - 1];

      // Distribute selectively targeted incomplete sessions into upcoming available days before each subject's exam date
      incompleteSessions.forEach((sess) => {
        const targetSub = subjects.find((s) => s.id === sess.subjectId);
        const maxDate = targetSub ? targetSub.examDate : '2099-12-31';

        // Find candidate day
        let targetDay = updatedDays.find(
          (d) => d.date > latestMissedDate && !d.isMissed && d.date < maxDate
        );

        if (!targetDay) {
          // If no existing future day before exam, find candidate future day
          targetDay = updatedDays.find((d) => d.date > latestMissedDate && !d.isMissed);
        }

        if (targetDay) {
          const lastSess = targetDay.sessions[targetDay.sessions.length - 1];
          let startMin = 9 * 60;
          if (lastSess) {
            startMin = parseTimeToMinutes(lastSess.endTime) + 15;
          }
          const endMin = startMin + sess.durationMinutes;

          const carriedSession: StudySession = {
            ...sess,
            id: 'carried_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            date: targetDay.date,
            startTime: formatTime12h(startMin),
            endTime: formatTime12h(endMin),
            isCarriedForward: true
          };

          targetDay.sessions.push(carriedSession);
          targetDay.sessions.sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
          targetDay.allocatedHours = Number(
            (targetDay.sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1)
          );
          targetDay.progressPercentage = calculateDayProgress(targetDay.sessions);
        } else {
          // If no future day exists, add the next date
          const d = new Date(latestMissedDate);
          d.setDate(d.getDate() + 1);
          const nextDateStr = d.toISOString().split('T')[0];
          const isExamDay = subjects.some((s) => s.examDate === nextDateStr);
          const examSubjects = subjects.filter((s) => s.examDate === nextDateStr);

          const carriedSession: StudySession = {
            ...sess,
            id: 'carried_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            date: nextDateStr,
            startTime: '09:00 AM',
            endTime: formatTime12h(9 * 60 + sess.durationMinutes),
            isCarriedForward: true
          };

          updatedDays.push({
            date: nextDateStr,
            dayName: getDayOfWeekName(nextDateStr),
            availableHours: profile.defaultDailyHours || 4,
            allocatedHours: Number((carriedSession.durationMinutes / 60).toFixed(1)),
            isMissed: false,
            isExamDay,
            examSubjects,
            sessions: [carriedSession],
            breaks: [],
            dailyGoal: `Study ${carriedSession.topic}`,
            progressPercentage: 0
          });
          updatedDays.sort((a, b) => a.date.localeCompare(b.date));
        }
      });

      const stats = calculateScheduleStats(updatedDays);
      const updatedSchedule: StudySchedule = {
        ...schedule,
        days: updatedDays,
        ...stats
      };

      const replanEvent: ReplanEvent = {
        id: 'replan_' + Date.now(),
        date: getTodayDateString(),
        timestamp: new Date().toISOString(),
        missedDates,
        reason,
        tasksCarriedForward: incompleteSessions.length,
        prevRemainingDays: schedule.days.filter((d) => d.date > latestMissedDate && !d.isMissed).length,
        updatedRemainingDays: updatedDays.filter((d) => d.date > latestMissedDate && !d.isMissed).length,
        changesApplied: [
          `Preserved completed sessions on missed day(s).`,
          `Selectively redistributed ${incompleteSessions.length} marked incomplete tasks to upcoming study sessions before exam deadlines.`
        ]
      };

      setSchedule(updatedSchedule);
      setReplanHistory((prev) => [replanEvent, ...prev]);

      const newNotif: AppNotification = {
        id: 'notif_replan_' + Date.now(),
        type: 'warning',
        title: 'Selective Redistribution Applied',
        message: `Redistributed ${incompleteSessions.length} incomplete tasks to upcoming days.`,
        timestamp: new Date().toISOString(),
        read: false,
        actionTab: 'study-plan'
      };
      setNotifications((prev) => [newNotif, ...prev]);

      addToast(
        'success',
        'Selective Redistribution Complete',
        `Redistributed ${incompleteSessions.length} incomplete session(s) into future study slots.`
      );
      return replanEvent;
    },
    [schedule, subjects, profile, calculateScheduleStats, addToast]
  );

  // REPLAN: MANUAL MODE
  const replanScheduleManual = useCallback(
    (
      missedDates: string[],
      reason: string,
      assignments: { sessionId: string; originalDate: string; newDate: string; startTime: string; endTime: string }[]
    ): ReplanEvent | null => {
      if (!schedule) return null;

      const missedSet = new Set(missedDates);
      let currentDays = [...schedule.days];

      // Mark missed days
      currentDays = currentDays.map((day) => {
        if (missedSet.has(day.date)) {
          return {
            ...day,
            isMissed: true,
            missedReason: reason
          };
        }
        return day;
      });

      // Move each assigned session
      assignments.forEach((assignment) => {
        let sessionData: StudySession | null = null;

        // Remove from original date
        currentDays = currentDays.map((day) => {
          if (day.date === assignment.originalDate) {
            const found = day.sessions.find((s) => s.id === assignment.sessionId);
            if (found) sessionData = found;
            const remaining = day.sessions.filter((s) => s.id !== assignment.sessionId);
            return {
              ...day,
              sessions: remaining,
              allocatedHours: Number(
                (remaining.reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1)
              ),
              progressPercentage: calculateDayProgress(remaining)
            };
          }
          return day;
        });

        if (sessionData) {
          const duration =
            parseTimeToMinutes(assignment.endTime) - parseTimeToMinutes(assignment.startTime);

          const movedSession: StudySession = {
            ...sessionData,
            id: 'reassigned_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            date: assignment.newDate,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            durationMinutes: duration > 0 ? duration : sessionData.durationMinutes,
            isCarriedForward: true
          };

          const targetDayIndex = currentDays.findIndex((d) => d.date === assignment.newDate);
          if (targetDayIndex >= 0) {
            const day = currentDays[targetDayIndex];
            const updatedSessions = [...day.sessions, movedSession].sort(
              (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
            );
            currentDays[targetDayIndex] = {
              ...day,
              sessions: updatedSessions,
              allocatedHours: Number(
                (updatedSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60).toFixed(1)
              ),
              progressPercentage: calculateDayProgress(updatedSessions)
            };
          } else {
            const isExamDay = subjects.some((s) => s.examDate === assignment.newDate);
            const examSubjects = subjects.filter((s) => s.examDate === assignment.newDate);

            currentDays.push({
              date: assignment.newDate,
              dayName: getDayOfWeekName(assignment.newDate),
              availableHours: profile.defaultDailyHours || 4,
              allocatedHours: Number((movedSession.durationMinutes / 60).toFixed(1)),
              isMissed: false,
              isExamDay,
              examSubjects,
              sessions: [movedSession],
              breaks: [],
              dailyGoal: `Study ${movedSession.topic}`,
              progressPercentage: 0
            });
            currentDays.sort((a, b) => a.date.localeCompare(b.date));
          }
        }
      });

      const stats = calculateScheduleStats(currentDays);
      const updatedSchedule: StudySchedule = {
        ...schedule,
        days: currentDays,
        ...stats
      };

      const replanEvent: ReplanEvent = {
        id: 'replan_manual_' + Date.now(),
        date: getTodayDateString(),
        timestamp: new Date().toISOString(),
        missedDates,
        reason,
        tasksCarriedForward: assignments.length,
        prevRemainingDays: currentDays.length,
        updatedRemainingDays: currentDays.length,
        changesApplied: [
          `Preserved finished sessions on missed date.`,
          `Manually reassigned ${assignments.length} missed sessions to custom dates.`
        ]
      };

      setSchedule(updatedSchedule);
      setReplanHistory((prev) => [replanEvent, ...prev]);

      addToast(
        'success',
        'Manual Replanning Complete',
        `Reassigned ${assignments.length} study sessions.`
      );
      return replanEvent;
    },
    [schedule, subjects, profile, calculateScheduleStats, addToast]
  );

  // Generic replanSchedule caller (defaults to auto)
  const replanSchedule = useCallback(
    (missedDates: string[], reason: string) => {
      replanScheduleAuto(missedDates, reason);
    },
    [replanScheduleAuto]
  );

  // Legacy Generate Schedule (manual trigger only if user explicitly wants auto-generation)
  const generateSchedule = useCallback(() => {
    const newSchedule = generateStudySchedule(profile, subjects);
    setSchedule(newSchedule);
    setSubjects(enrichSubjectsWithPriorities(subjects, profile.startDate));
    addToast('success', 'Study Plan Generated!', 'Day-wise baseline schedule created.');
  }, [profile, subjects, addToast]);

  // Reset Schedule
  const resetScheduleOnly = useCallback(() => {
    setSchedule(null);
    addToast('info', 'Study Plan Cleared', 'All scheduled sessions have been cleared. You can manually add new ones.');
  }, [addToast]);

  // Clear All Data for current user
  const clearAllData = useCallback(() => {
    const userName = currentUser?.name || 'Student';
    if (currentUser) {
      localStorage.removeItem(getStorageKeyForUser(currentUser.id));
    }
    const freshProfile = createInitialProfile(userName);
    const mappedInit = INITIAL_SUBJECTS.map((s, idx) => ({ ...s, id: `sub_${idx + 1}` }));
    const freshSubjects = enrichSubjectsWithPriorities(mappedInit, freshProfile.startDate);

    setProfile(freshProfile);
    setSubjects(freshSubjects);
    setSchedule(null);
    setReplanHistory([]);
    setNotifications([
      {
        id: 'notif_reset_' + Date.now(),
        type: 'info',
        title: `Workspace Refreshed for ${userName}`,
        message: "Your study plan has been reset. Click '+ Add Study Plan' to begin.",
        timestamp: new Date().toISOString(),
        read: false
      }
    ]);
    addToast('warning', 'Data Reset', 'All study data restored to initial baseline.');
  }, [currentUser, addToast]);

  // Notification actions
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  // Export / Import
  const exportBackupData = useCallback(() => {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      profile,
      subjects,
      schedule,
      replanHistory
    };
    return JSON.stringify(data, null, 2);
  }, [profile, subjects, schedule, replanHistory]);

  const importBackupData = useCallback(
    (jsonStr: string): boolean => {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.profile && parsed.subjects) {
          setProfile(parsed.profile);
          setSubjects(parsed.subjects);
          setSchedule(parsed.schedule || null);
          if (parsed.replanHistory) setReplanHistory(parsed.replanHistory);
          addToast('success', 'Data Restored', 'Backup loaded successfully.');
          return true;
        }
      } catch (e) {
        console.error(e);
      }
      addToast('error', 'Import Failed', 'Invalid backup JSON file.');
      return false;
    },
    [addToast]
  );

  // Recommendations calculated dynamically
  const recommendations = generateSmartRecommendations(
    subjects,
    schedule,
    getTodayDateString()
  );

  return (
    <PlannerContext.Provider
      value={{
        profile,
        subjects,
        schedule,
        replanHistory,
        recommendations,
        notifications,
        activeTab,
        setActiveTab,
        selectedSubjectModal,
        setSelectedSubjectModal,
        selectedDateForDetail,
        setSelectedDateForDetail,
        isReplanModalOpen,
        setIsReplanModalOpen,
        targetMissedDate,
        setTargetMissedDate,
        toasts,
        addToast,
        removeToast,
        openAddSessionModal,
        openEditSessionModal,
        closeSessionModal,
        updateProfile,
        addSubject,
        updateSubject,
        deleteSubject,
        addManualSession,
        updateManualSession,
        deleteManualSession,
        markSessionStatus,
        markDayMissed,
        replanSchedule,
        replanScheduleAuto,
        replanScheduleManual,
        generateSchedule,
        resetScheduleOnly,
        clearAllData,
        markNotificationRead,
        markAllNotificationsRead,
        exportBackupData,
        importBackupData
      }}
    >
      {children}
      {/* Global Study Session Modal */}
      <StudySessionModal
        isOpen={isSessionModalOpen}
        onClose={closeSessionModal}
        initialDate={sessionModalDate}
        initialSubjectId={sessionModalSubjectId}
        sessionToEdit={sessionToEdit}
      />
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (!context) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
};
