export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type PriorityLevel = 'high' | 'medium' | 'low';
export type TaskStatus = 'not_completed' | 'in_progress' | 'completed';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type StudyHoursMode = 'uniform' | 'custom';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatarColor?: string;
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  rememberMe: boolean;
  loggedInAt: string;
}

export interface Subject {
  id: string;
  name: string;
  examDate: string; // YYYY-MM-DD
  difficulty: DifficultyLevel;
  confidenceLevel?: number; // 0 to 100%
  estimatedTopics?: number;
  topics?: string[];
  color: string; // Hex or tailwind color class
  calculatedPriority?: SubjectPriority;
}

export interface SubjectPriority {
  score: number;
  level: PriorityLevel;
  difficultyWeight: number;
  daysUntilExam: number;
  urgencyFactor: number;
  recommendedTotalHours: number;
  reason: string;
}

export interface StudentProfile {
  name: string;
  startDate: string; // YYYY-MM-DD
  studyHoursMode: StudyHoursMode;
  defaultDailyHours: number;
  customDailyHours: Record<DayOfWeek, number>;
  sessionDurationMinutes: number;
  breakDurationMinutes: number;
  startTimeOfDay: string; // "09:00"
  darkMode: boolean;
  notificationsEnabled: boolean;
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  date?: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: TaskStatus;
  topic: string;
  priority?: PriorityLevel;
  sessionType?: 'study' | 'revision' | 'practice_test' | 'mock_review';
  completedAt?: string;
  notes?: string;
  isCarriedForward?: boolean;
}

export interface ManualSessionInput {
  subjectId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "18:00" or "06:00 PM"
  endTime: string; // e.g. "20:00" or "08:00 PM"
  durationMinutes: number;
  topic: string;
  priority: PriorityLevel;
  notes?: string;
  status?: TaskStatus;
}

export interface BreakPeriod {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  dayName: string; // e.g. "Monday"
  availableHours: number;
  allocatedHours: number;
  isMissed: boolean;
  missedReason?: string;
  isExamDay: boolean;
  examSubjects: { id: string; name: string; color: string }[];
  sessions: StudySession[];
  breaks: BreakPeriod[];
  dailyGoal: string;
  progressPercentage: number;
}

export interface StudySchedule {
  id: string;
  generatedAt: string;
  startDate: string;
  endDate: string;
  days: DayPlan[];
  overallProgress: number;
  totalPlannedHours: number;
  totalCompletedHours: number;
  isInsufficientTime: boolean;
  timeWarningMessage?: string;
}

export interface ReplanEvent {
  id: string;
  date: string; // date replan was triggered
  timestamp: string;
  reason: string;
  missedDates: string[];
  tasksCarriedForward: number;
  prevRemainingDays: number;
  updatedRemainingDays: number;
  updatedPrioritySubjects?: {
    subjectName: string;
    priority: PriorityLevel;
    changeDescription: string;
  }[];
  changesApplied?: string[];
  summaryNotes?: string;
}

export interface SmartRecommendation {
  id: string;
  type: 'urgent' | 'warning' | 'tip' | 'praise' | 'replan';
  title: string;
  message: string;
  subjectId?: string;
  subjectName?: string;
  actionText?: string;
  actionType?: 'navigate' | 'replan' | 'edit_hours' | 'view_subject';
  targetTab?: string;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionTab?: string;
}
