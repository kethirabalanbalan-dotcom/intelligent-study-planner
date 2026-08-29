import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  StudentProfile,
  Subject,
  StudySchedule,
  ReplanEvent,
  SmartRecommendation,
  AppNotification,
  TaskStatus
} from '../types';
import {
  generateStudySchedule,
  replanScheduleForMissedDays,
  enrichSubjectsWithPriorities,
  calculateDayProgress
} from '../utils/scheduler';
import { generateSmartRecommendations } from '../utils/recommendations';
import { getTodayDateString, differenceInDays } from '../utils/dateUtils';
import { useAuth } from './AuthContext';

const getStorageKeyForUser = (userId: string) => `study_planner_user_data_${userId}`;

const createInitialProfile = (userName: string = 'Student'): StudentProfile => ({
  name: userName,
  startDate: '2026-09-01',
  studyHoursMode: 'uniform',
  defaultDailyHours: 4,
  customDailyHours: {
    monday: 4,
    tuesday: 3,
    wednesday: 5,
    thursday: 2,
    friday: 4,
    saturday: 6,
    sunday: 5
  },
  sessionDurationMinutes: 90,
  breakDurationMinutes: 15,
  startTimeOfDay: '09:00',
  darkMode: false,
  notificationsEnabled: true
});

const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub_math',
    name: 'Mathematics',
    examDate: '2026-09-15',
    difficulty: 'hard',
    confidenceLevel: 45,
    estimatedTopics: 9,
    color: '#6366F1', // Indigo
    topics: [
      'Calculus: Limits & Differentiation',
      'Integral Calculus & Applications',
      'Matrices & Vector Algebra',
      'Coordinate Geometry & Conic Sections',
      'Trigonometric Functions & Proofs',
      'Probability & Combinatorics',
      'Differential Equations Drill',
      'Algebra & Polynomials Mastery',
      'Comprehensive Mathematics Mock Paper'
    ]
  },
  {
    id: 'sub_phys',
    name: 'Physics',
    examDate: '2026-09-18',
    difficulty: 'hard',
    confidenceLevel: 40,
    estimatedTopics: 10,
    color: '#F43F5E', // Rose
    topics: [
      'Newtonian Mechanics & Kinematics',
      'Work, Energy & Momentum Conservation',
      'Rotational Dynamics & Gravity',
      'Thermodynamics & Heat Cycles',
      'Electrostatics & Electric Potential',
      'Current Electricity & Circuits',
      'Magnetic Fields & Induction',
      'Wave Optics & Interference',
      'Modern Physics & Semiconductor Devices',
      'Full Physics Mock & Formula Sheet Drill'
    ]
  },
  {
    id: 'sub_cs',
    name: 'Computer Science',
    examDate: '2026-09-20',
    difficulty: 'medium',
    confidenceLevel: 70,
    estimatedTopics: 8,
    color: '#F59E0B', // Amber
    topics: [
      'Arrays, Linked Lists & Stacks',
      'Trees, Graphs & Search Algorithms',
      'Sorting Algorithms & Time Complexity',
      'Object-Oriented Programming (OOP)',
      'Relational Databases & Complex SQL',
      'Computer Networks & Protocols',
      'Operating Systems & Concurrency',
      'Algorithm Mock Review & Coding Test'
    ]
  },
  {
    id: 'sub_eng',
    name: 'English',
    examDate: '2026-09-22',
    difficulty: 'easy',
    confidenceLevel: 85,
    estimatedTopics: 7,
    color: '#10B981', // Emerald
    topics: [
      'Critical Reading Comprehension',
      'Advanced Grammar & Sentence Structuring',
      'Persuasive Essay & Thesis Formation',
      'Literary Devices & Poetry Critique',
      'Contextual Vocabulary & Idioms',
      'Formal Analytical Writing',
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
  
  // Actions
  updateProfile: (updated: Partial<StudentProfile>) => void;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  generateSchedule: () => void;
  markSessionStatus: (date: string, sessionId: string, status: TaskStatus) => void;
  markDayMissed: (date: string, reason?: string) => void;
  replanSchedule: (missedDates: string[], reason: string) => void;
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
    return enrichSubjectsWithPriorities(INITIAL_SUBJECTS, '2026-09-01');
  });

  const [schedule, setSchedule] = useState<StudySchedule | null>(() => {
    return generateStudySchedule(createInitialProfile(currentUser?.name || 'Student'), INITIAL_SUBJECTS);
  });

  const [replanHistory, setReplanHistory] = useState<ReplanEvent[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif_welcome',
      type: 'info',
      title: 'Welcome to Intelligent Study Planner',
      message: 'Your personalized examination schedule is ready. Track daily sessions and use Replan whenever needed.',
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

  // Load user specific data whenever currentUser changes
  useEffect(() => {
    if (!currentUser) return;

    const userKey = getStorageKeyForUser(currentUser.id);
    try {
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile) {
          // Always ensure the active display name matches currentUser name unless updated
          setProfile({ ...parsed.profile, name: parsed.profile.name || currentUser.name });
        } else {
          setProfile(createInitialProfile(currentUser.name));
        }

        if (parsed.subjects && Array.isArray(parsed.subjects)) {
          const stDate = parsed.profile?.startDate || '2026-09-01';
          setSubjects(enrichSubjectsWithPriorities(parsed.subjects, stDate));
        } else {
          setSubjects(enrichSubjectsWithPriorities(INITIAL_SUBJECTS, '2026-09-01'));
        }

        if (parsed.schedule) {
          setSchedule(parsed.schedule);
        } else {
          const userProf = parsed.profile || createInitialProfile(currentUser.name);
          const userSubs = parsed.subjects || INITIAL_SUBJECTS;
          setSchedule(generateStudySchedule(userProf, userSubs));
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
              message: 'Your personalized examination schedule is ready. Track daily sessions and use Replan whenever needed.',
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

    // Default state for brand new user
    const initialProf = createInitialProfile(currentUser.name);
    const enrichedSubs = enrichSubjectsWithPriorities(INITIAL_SUBJECTS, initialProf.startDate);
    const initialSched = generateStudySchedule(initialProf, enrichedSubs);
    setProfile(initialProf);
    setSubjects(enrichedSubs);
    setSchedule(initialSched);
    setReplanHistory([]);
    setNotifications([
      {
        id: 'notif_welcome_' + Date.now(),
        type: 'info',
        title: `Welcome, ${currentUser.name}!`,
        message: 'Your personalized examination schedule is ready. Track daily sessions and use Replan whenever needed.',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 'notif_prio_' + Date.now(),
        type: 'warning',
        title: 'High Priority Preparation Ready',
        message: 'Calculated urgency weights and difficulty rankings for your subjects.',
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

  // Add Subject
  const addSubject = useCallback((sub: Omit<Subject, 'id'>) => {
    const newId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newSubject: Subject = {
      ...sub,
      id: newId
    };
    const updatedList = enrichSubjectsWithPriorities([...subjects, newSubject], profile.startDate);
    setSubjects(updatedList);

    if (schedule) {
      const updatedSchedule = generateStudySchedule(profile, updatedList);
      setSchedule(updatedSchedule);
    }

    addToast('success', 'Subject Added', `${sub.name} added successfully. Your study plan has been updated.`);
  }, [subjects, profile, schedule, addToast]);

  // Update Subject
  const updateSubject = useCallback((id: string, updated: Partial<Subject>) => {
    const updatedList = subjects.map((s) => (s.id === id ? { ...s, ...updated } : s));
    const enriched = enrichSubjectsWithPriorities(updatedList, profile.startDate);
    setSubjects(enriched);

    if (schedule) {
      const updatedSchedule = generateStudySchedule(profile, enriched);
      setSchedule(updatedSchedule);
    }

    addToast('info', 'Subject Updated', 'Subject updated successfully. Your study plan has been updated.');
  }, [subjects, profile, schedule, addToast]);

  // Delete Subject (Requirement: permanent removal, unique ID, replan remaining schedule, success notification)
  const deleteSubject = useCallback((id: string) => {
    const target = subjects.find((s) => s.id === id);
    if (!target) return;

    const remainingSubjects = subjects.filter((s) => s.id !== id);
    const enrichedRemaining = enrichSubjectsWithPriorities(remainingSubjects, profile.startDate);
    setSubjects(enrichedRemaining);

    // If a study plan exists, intelligently update and regenerate the schedule
    if (schedule) {
      if (enrichedRemaining.length === 0) {
        setSchedule({
          id: 'schedule_' + Date.now(),
          generatedAt: new Date().toISOString(),
          startDate: profile.startDate,
          endDate: profile.startDate,
          days: [],
          overallProgress: 0,
          totalPlannedHours: 0,
          totalCompletedHours: 0,
          isInsufficientTime: false
        });
      } else {
        const updatedSchedule = generateStudySchedule(profile, enrichedRemaining);
        setSchedule(updatedSchedule);
      }
    }

    // Clear detail modal if the deleted subject was selected
    setSelectedSubjectModal((current) => (current?.id === id ? null : current));

    addToast(
      'success',
      'Subject Deleted',
      'Subject deleted successfully. Your study plan has been updated.'
    );
  }, [subjects, profile, schedule, addToast]);

  // Generate Schedule
  const generateSchedule = useCallback(() => {
    const newSchedule = generateStudySchedule(profile, subjects);
    setSchedule(newSchedule);

    // Refresh subjects with priority
    setSubjects(enrichSubjectsWithPriorities(subjects, profile.startDate));

    if (newSchedule.isInsufficientTime) {
      addToast(
        'warning',
        'Study Plan Generated with Notice',
        newSchedule.timeWarningMessage || 'Available hours may be tight before exams.'
      );
    } else {
      addToast('success', 'Study Plan Generated!', 'Day-wise schedule is ready with balanced session distribution.');
    }
  }, [profile, subjects, addToast]);

  // Mark Session Status
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

      // Recalculate overall stats
      let totalPlannedMinutes = 0;
      let totalCompletedMinutes = 0;
      let totalSessions = 0;
      let completedSessions = 0;

      updatedDays.forEach((d) => {
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

      setSchedule({
        ...schedule,
        days: updatedDays,
        overallProgress,
        totalPlannedHours,
        totalCompletedHours
      });

      if (newlyCompleted) {
        if (dayBecame100Percent) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
          addToast('success', 'Daily Goal Achieved! 🎉', '100% of today’s study sessions completed!');
        } else {
          addToast('success', 'Task Completed', 'Progress updated!');
        }
      }
    },
    [schedule, addToast]
  );

  // Mark Day Missed
  const markDayMissed = useCallback(
    (dateStr: string, reason: string = 'Missed study day') => {
      setTargetMissedDate(dateStr);
      setIsReplanModalOpen(true);
    },
    []
  );

  // Replan Schedule for Missed Day
  const replanSchedule = useCallback(
    (missedDates: string[], reason: string) => {
      if (!schedule) return;

      const { updatedSchedule, replanEvent } = replanScheduleForMissedDays(
        schedule,
        missedDates,
        subjects,
        profile,
        reason
      );

      setSchedule(updatedSchedule);
      setReplanHistory((prev) => [replanEvent, ...prev]);

      // Add smart notification
      const newNotif: AppNotification = {
        id: 'notif_replan_' + Date.now(),
        type: 'warning',
        title: 'Schedule Intelligently Replanned',
        message: `Preserved finished sessions and redistributed ${replanEvent.tasksCarriedForward} tasks across remaining days.`,
        timestamp: new Date().toISOString(),
        read: false,
        actionTab: 'study-plan'
      };
      setNotifications((prev) => [newNotif, ...prev]);

      addToast(
        'success',
        'Schedule Replanned Successfully',
        `Your schedule has been dynamically updated based on the missed day.`
      );
    },
    [schedule, subjects, profile, addToast]
  );

  // Reset Schedule
  const resetScheduleOnly = useCallback(() => {
    generateSchedule();
    addToast('info', 'Schedule Reset', 'Study plan refreshed to default baseline.');
  }, [generateSchedule, addToast]);

  // Clear All Data for current user
  const clearAllData = useCallback(() => {
    const userName = currentUser?.name || 'Student';
    if (currentUser) {
      localStorage.removeItem(getStorageKeyForUser(currentUser.id));
    }
    const freshProfile = createInitialProfile(userName);
    const freshSubjects = enrichSubjectsWithPriorities(INITIAL_SUBJECTS, freshProfile.startDate);
    const freshSchedule = generateStudySchedule(freshProfile, freshSubjects);

    setProfile(freshProfile);
    setSubjects(freshSubjects);
    setSchedule(freshSchedule);
    setReplanHistory([]);
    setNotifications([
      {
        id: 'notif_reset_' + Date.now(),
        type: 'info',
        title: `Workspace Refreshed for ${userName}`,
        message: 'Your study plan and subjects have been reset to a fresh baseline.',
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
      version: 1,
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
          if (parsed.schedule) setSchedule(parsed.schedule);
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
        updateProfile,
        addSubject,
        updateSubject,
        deleteSubject,
        generateSchedule,
        markSessionStatus,
        markDayMissed,
        replanSchedule,
        resetScheduleOnly,
        clearAllData,
        markNotificationRead,
        markAllNotificationsRead,
        exportBackupData,
        importBackupData
      }}
    >
      {children}
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
