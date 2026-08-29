import {
  Subject,
  SubjectPriority,
  StudentProfile,
  DayPlan,
  StudySession,
  BreakPeriod,
  StudySchedule,
  ReplanEvent,
  PriorityLevel
} from '../types';
import {
  differenceInDays,
  addDaysToDate,
  getDayOfWeekName,
  getDayOfWeekKey,
  formatTime12h,
  parseTimeToMinutes
} from './dateUtils';

function getTopicsForSubject(subject: Subject): string[] {
  if (subject.topics && subject.topics.length > 0) {
    return subject.topics;
  }
  const count = subject.estimatedTopics || 6;
  const list: string[] = [];
  for (let i = 1; i <= count; i++) {
    list.push(`${subject.name} - Unit ${i}: Core Concepts & Problem Solving`);
  }
  list.push(`${subject.name} - Comprehensive Revision & Practice Drill`);
  return list;
}

/**
 * Intelligent Prioritization Algorithm
 * Priority Score = Difficulty Weight + Examination Urgency + Limited Preparation Time Factor
 */
export function calculateSubjectPriority(
  subject: Subject,
  currentDateStr: string
): SubjectPriority {
  const diffDays = Math.max(1, differenceInDays(subject.examDate, currentDateStr));

  // 1. Difficulty Weight (Hard = 3, Medium = 2, Easy = 1)
  const diffWeightMap: Record<string, number> = { hard: 3, medium: 2, easy: 1 };
  const difficultyWeight = diffWeightMap[subject.difficulty] || 2;

  // 2. Exam Urgency Factor
  let urgencyFactor = 1.0;
  if (diffDays <= 3) urgencyFactor = 4.0;
  else if (diffDays <= 7) urgencyFactor = 3.0;
  else if (diffDays <= 14) urgencyFactor = 2.0;
  else if (diffDays <= 21) urgencyFactor = 1.4;
  else urgencyFactor = 1.0;

  // 3. Confidence/Preparation Deficit (if confidence is low, student needs more focus)
  const confidence = subject.confidenceLevel ?? 50;
  const confidenceDeficit = Math.max(0, (100 - confidence) / 100); // 0 to 1

  // 4. Topic Count Factor
  const topicCount = subject.estimatedTopics || (subject.topics ? subject.topics.length : 6);
  const topicFactor = Math.min(3.0, topicCount / 3.5);

  // Raw score calculation
  const score = Number(
    (
      difficultyWeight * 3.5 +
      urgencyFactor * 4.0 +
      confidenceDeficit * 2.5 +
      topicFactor * 1.5
    ).toFixed(1)
  );

  // Priority level categorization
  let level: PriorityLevel = 'medium';
  if (score >= 17.5 || diffDays <= 3) {
    level = 'high';
  } else if (score < 11.5 && diffDays > 10) {
    level = 'low';
  } else {
    level = 'medium';
  }

  // Recommended base hours
  let baseHours = 14;
  if (subject.difficulty === 'hard') baseHours = 26;
  if (subject.difficulty === 'medium') baseHours = 18;
  if (subject.difficulty === 'easy') baseHours = 10;

  // Adjust for topic count & confidence
  const recommendedTotalHours = Math.round(
    baseHours * (0.8 + topicCount * 0.05 + confidenceDeficit * 0.25)
  );

  // Human-readable reason
  let reason = '';
  if (diffDays <= 3) {
    reason = `Urgent: Exam is in only ${diffDays} day${diffDays === 1 ? '' : 's'}!`;
  } else if (subject.difficulty === 'hard' && level === 'high') {
    reason = `Hard subject requiring deep conceptual practice before ${diffDays} days.`;
  } else if (confidence < 40) {
    reason = `Preparation confidence is ${confidence}% - needs prioritized attention.`;
  } else if (level === 'high') {
    reason = `High priority based on exam date (${diffDays} days) and curriculum weight.`;
  } else if (level === 'medium') {
    reason = `Balanced study pace recommended across available days.`;
  } else {
    reason = `Comfortable preparation buffer before exam.`;
  }

  return {
    score,
    level,
    difficultyWeight,
    daysUntilExam: diffDays,
    urgencyFactor,
    recommendedTotalHours,
    reason
  };
}

export function enrichSubjectsWithPriorities(
  subjects: Subject[],
  startDate: string
): Subject[] {
  return subjects.map((sub) => ({
    ...sub,
    calculatedPriority: calculateSubjectPriority(sub, startDate)
  }));
}

/**
 * Generate a complete, balanced day-wise study schedule
 */
export function generateStudySchedule(
  profile: StudentProfile,
  rawSubjects: Subject[]
): StudySchedule {
  if (rawSubjects.length === 0) {
    return {
      id: 'schedule_' + Date.now(),
      generatedAt: new Date().toISOString(),
      startDate: profile.startDate,
      endDate: profile.startDate,
      days: [],
      overallProgress: 0,
      totalPlannedHours: 0,
      totalCompletedHours: 0,
      isInsufficientTime: false
    };
  }

  const subjects = enrichSubjectsWithPriorities(rawSubjects, profile.startDate);

  // Find max examination date
  let maxExamDate = subjects[0].examDate;
  subjects.forEach((s) => {
    if (s.examDate > maxExamDate) {
      maxExamDate = s.examDate;
    }
  });

  const totalCalendarDays = Math.max(1, differenceInDays(maxExamDate, profile.startDate) + 1);

  // Build subject topic queues and tracked remaining needed hours
  const topicQueues: Record<string, string[]> = {};
  const topicIndexTracker: Record<string, number> = {};
  const remainingHoursTracker: Record<string, number> = {};
  let totalRecommendedHours = 0;

  subjects.forEach((sub) => {
    topicQueues[sub.id] = getTopicsForSubject(sub);
    topicIndexTracker[sub.id] = 0;
    const hours = sub.calculatedPriority?.recommendedTotalHours || 16;
    remainingHoursTracker[sub.id] = hours;
    totalRecommendedHours += hours;
  });

  const days: DayPlan[] = [];
  let totalAvailableHoursAcrossPlan = 0;
  let totalPlannedMinutesAcrossPlan = 0;

  const sessionDuration = profile.sessionDurationMinutes || 60;
  const breakDuration = profile.breakDurationMinutes || 15;
  const startMinuteBase = parseTimeToMinutes(profile.startTimeOfDay || '09:00');

  // Generate each day
  for (let dayOffset = 0; dayOffset < totalCalendarDays; dayOffset++) {
    const dateStr = addDaysToDate(profile.startDate, dayOffset);
    const dayName = getDayOfWeekName(dateStr);
    const dayKey = getDayOfWeekKey(dateStr);

    // Available study hours for this day
    const availableHours =
      profile.studyHoursMode === 'custom'
        ? profile.customDailyHours[dayKey] ?? profile.defaultDailyHours
        : profile.defaultDailyHours;

    totalAvailableHoursAcrossPlan += availableHours;

    // Check which exams occur on this date
    const examsToday = subjects
      .filter((s) => s.examDate === dateStr)
      .map((s) => ({ id: s.id, name: s.name, color: s.color }));

    const isExamDay = examsToday.length > 0;

    // Active subjects that can be studied on this day:
    // ONLY subjects whose exam is strictly in the future (examDate > dateStr)
    const eligibleSubjects = subjects
      .filter((s) => s.examDate > dateStr)
      .map((s) => {
        const livePriority = calculateSubjectPriority(s, dateStr);
        return {
          ...s,
          livePriority
        };
      })
      .sort((a, b) => b.livePriority.score - a.livePriority.score);

    const availableMinutes = availableHours * 60;
    const maxSessionsForDay = Math.max(
      1,
      Math.floor(availableMinutes / (sessionDuration + breakDuration / 2))
    );

    const daySessions: StudySession[] = [];
    const dayBreaks: BreakPeriod[] = [];
    let currentMinute = startMinuteBase;
    let allocatedMinutesForDay = 0;

    if (eligibleSubjects.length > 0 && availableHours > 0) {
      // Pick 1 to 3 subjects for this day to keep variety and high priority focus
      const subjectsForDay: Subject[] = [];

      // Always include top priority subject
      subjectsForDay.push(eligibleSubjects[0]);

      if (eligibleSubjects.length > 1 && maxSessionsForDay >= 2) {
        subjectsForDay.push(eligibleSubjects[1]);
      }
      if (eligibleSubjects.length > 2 && maxSessionsForDay >= 4) {
        subjectsForDay.push(eligibleSubjects[2]);
      }

      let subIdx = 0;
      for (let s = 0; s < maxSessionsForDay; s++) {
        if (allocatedMinutesForDay + sessionDuration > availableMinutes) {
          // If a partial session of at least 30 mins can fit
          const remainingMin = availableMinutes - allocatedMinutesForDay;
          if (remainingMin >= 30) {
            const chosenSub = subjectsForDay[subIdx % subjectsForDay.length];
            const tQueue = topicQueues[chosenSub.id] || [];
            const tIndex = topicIndexTracker[chosenSub.id] % tQueue.length;
            const topic = tQueue[tIndex];
            topicIndexTracker[chosenSub.id] = tIndex + 1;

            const startTime = formatTime12h(currentMinute);
            const endTime = formatTime12h(currentMinute + remainingMin);

            daySessions.push({
              id: `sess_${dateStr}_${s}`,
              subjectId: chosenSub.id,
              subjectName: chosenSub.name,
              subjectColor: chosenSub.color,
              startTime,
              endTime,
              durationMinutes: remainingMin,
              status: 'not_completed',
              topic: `${topic} (Focused Drill)`,
              sessionType: s === maxSessionsForDay - 1 ? 'revision' : 'study'
            });

            allocatedMinutesForDay += remainingMin;
            currentMinute += remainingMin;
          }
          break;
        }

        const chosenSub = subjectsForDay[subIdx % subjectsForDay.length];
        subIdx++;

        const tQueue = topicQueues[chosenSub.id] || [];
        const tIndex = topicIndexTracker[chosenSub.id] % tQueue.length;
        const topic = tQueue[tIndex];
        topicIndexTracker[chosenSub.id] = tIndex + 1;

        // Session type determination
        const daysLeft = differenceInDays(chosenSub.examDate, dateStr);
        let sessionType: StudySession['sessionType'] = 'study';
        if (daysLeft <= 2) sessionType = 'mock_review';
        else if (daysLeft <= 4) sessionType = 'practice_test';
        else if (s >= 2) sessionType = 'revision';

        const startTime = formatTime12h(currentMinute);
        const endTime = formatTime12h(currentMinute + sessionDuration);

        daySessions.push({
          id: `sess_${dateStr}_${s}`,
          subjectId: chosenSub.id,
          subjectName: chosenSub.name,
          subjectColor: chosenSub.color,
          startTime,
          endTime,
          durationMinutes: sessionDuration,
          status: 'not_completed',
          topic,
          sessionType
        });

        allocatedMinutesForDay += sessionDuration;
        currentMinute += sessionDuration;

        // Add break if there's another session coming and time allows
        if (
          s < maxSessionsForDay - 1 &&
          allocatedMinutesForDay + breakDuration + 30 <= availableMinutes
        ) {
          const breakStart = formatTime12h(currentMinute);
          const breakEnd = formatTime12h(currentMinute + breakDuration);
          dayBreaks.push({
            id: `break_${dateStr}_${s}`,
            startTime: breakStart,
            endTime: breakEnd,
            durationMinutes: breakDuration
          });
          currentMinute += breakDuration;
        }
      }
    }

    // Daily goal text
    let dailyGoal = 'Rest and recharge';
    if (isExamDay && daySessions.length === 0) {
      dailyGoal = `Good luck on ${examsToday.map((e) => e.name).join(' & ')} Examination!`;
    } else if (daySessions.length > 0) {
      const distinctSubNames = Array.from(new Set(daySessions.map((s) => s.subjectName)));
      if (distinctSubNames.length === 1) {
        dailyGoal = `Deep Mastery & Practice: ${distinctSubNames[0]}`;
      } else {
        dailyGoal = `Complete Core Modules: ${distinctSubNames.join(' & ')}`;
      }
    }

    const allocatedHours = Number((allocatedMinutesForDay / 60).toFixed(1));
    totalPlannedMinutesAcrossPlan += allocatedMinutesForDay;

    days.push({
      date: dateStr,
      dayName,
      availableHours,
      allocatedHours,
      isMissed: false,
      isExamDay,
      examSubjects: examsToday,
      sessions: daySessions,
      breaks: dayBreaks,
      dailyGoal,
      progressPercentage: 0
    });
  }

  const totalPlannedHours = Number((totalPlannedMinutesAcrossPlan / 60).toFixed(1));

  // Check if study time is insufficient
  const isInsufficientTime =
    totalAvailableHoursAcrossPlan < totalRecommendedHours * 0.75;
  const timeWarningMessage = isInsufficientTime
    ? `Warning: Your total available study hours (${totalAvailableHoursAcrossPlan} hrs) may not be sufficient to complete the recommended preparation plan (${totalRecommendedHours} hrs) before the examinations. Consider increasing your daily study hours or starting preparation earlier.`
    : undefined;

  return {
    id: 'schedule_' + Date.now(),
    generatedAt: new Date().toISOString(),
    startDate: profile.startDate,
    endDate: maxExamDate,
    days,
    overallProgress: 0,
    totalPlannedHours,
    totalCompletedHours: 0,
    isInsufficientTime,
    timeWarningMessage
  };
}

/**
 * Intelligent Missed Day / Schedule Replanner
 */
export function replanScheduleForMissedDays(
  currentSchedule: StudySchedule,
  missedDateStrings: string[],
  subjects: Subject[],
  profile: StudentProfile,
  reason: string = 'Study day missed'
): { updatedSchedule: StudySchedule; replanEvent: ReplanEvent } {
  const missedSet = new Set(missedDateStrings);

  // 1. Gather all unfinished tasks up to the latest missed date
  const incompleteCarriedForwardSessions: StudySession[] = [];
  let tasksCarriedForwardCount = 0;

  // Clone days
  const updatedDays: DayPlan[] = currentSchedule.days.map((day) => {
    if (missedSet.has(day.date)) {
      // Mark as missed
      const missedDaySessions: StudySession[] = day.sessions.map((sess) => {
        if (sess.status !== 'completed') {
          incompleteCarriedForwardSessions.push({
            ...sess,
            isCarriedForward: true
          });
          tasksCarriedForwardCount++;
          return { ...sess, status: 'not_completed' as const };
        }
        return sess;
      });

      return {
        ...day,
        isMissed: true,
        missedReason: reason,
        sessions: missedDaySessions,
        progressPercentage: calculateDayProgress(missedDaySessions)
      };
    }
    return day;
  });

  // 2. Identify the first date that can receive redistributed tasks (the earliest non-missed upcoming day)
  const todayStr = missedDateStrings.sort()[missedDateStrings.length - 1];
  const remainingDaysList = updatedDays.filter(
    (d) => d.date > todayStr && !d.isMissed
  );

  const prevRemainingDays = remainingDaysList.length;

  // 3. Recalculate subject priorities with updated remaining days from todayStr
  const updatedSubjectPriorities = subjects.map((sub) => {
    const updatedPrio = calculateSubjectPriority(sub, todayStr);
    const prevLevel = sub.calculatedPriority?.level || 'medium';
    return {
      subject: { ...sub, calculatedPriority: updatedPrio },
      changeDescription:
        prevLevel !== updatedPrio.level
          ? `Elevated from ${prevLevel.toUpperCase()} to ${updatedPrio.level.toUpperCase()} priority`
          : `Maintained ${updatedPrio.level.toUpperCase()} priority (${updatedPrio.daysUntilExam} days left)`
    };
  });

  // 4. Intelligently redistribute incomplete tasks into upcoming days
  // Group carried sessions by subject
  const carriedBySubject: Record<string, StudySession[]> = {};
  incompleteCarriedForwardSessions.forEach((sess) => {
    if (!carriedBySubject[sess.subjectId]) {
      carriedBySubject[sess.subjectId] = [];
    }
    carriedBySubject[sess.subjectId].push(sess);
  });

  // Find capacity in remaining days before each subject's exam
  const sessionDuration = profile.sessionDurationMinutes || 60;
  const breakDuration = profile.breakDurationMinutes || 15;

  for (let i = 0; i < updatedDays.length; i++) {
    const day = updatedDays[i];
    if (day.date <= todayStr || day.isMissed) continue;

    const availableMinutes = day.availableHours * 60;
    let allocatedMinutes = day.sessions.reduce(
      (sum, s) => sum + s.durationMinutes,
      0
    );

    // Can we fit additional sessions or replace low priority sessions with carried high priority sessions?
    for (const [subId, pendingSessList] of Object.entries(carriedBySubject)) {
      if (pendingSessList.length === 0) continue;
      const targetSub = subjects.find((s) => s.id === subId);
      if (!targetSub || targetSub.examDate <= day.date) continue; // Never after or on exam day

      while (
        pendingSessList.length > 0 &&
        allocatedMinutes + sessionDuration <= availableMinutes
      ) {
        const carriedSess = pendingSessList.shift()!;
        const sessIndex = day.sessions.length;

        // Calculate time slot
        const startMinute =
          parseTimeToMinutes(profile.startTimeOfDay || '09:00') +
          allocatedMinutes +
          day.breaks.length * breakDuration;

        const startTime = formatTime12h(startMinute);
        const endTime = formatTime12h(startMinute + carriedSess.durationMinutes);

        day.sessions.push({
          ...carriedSess,
          id: `carried_${day.date}_${sessIndex}_${Date.now()}`,
          startTime,
          endTime,
          isCarriedForward: true,
          status: 'not_completed'
        });

        allocatedMinutes += carriedSess.durationMinutes;

        // Add break if space permits
        if (allocatedMinutes + breakDuration + 30 <= availableMinutes) {
          day.breaks.push({
            id: `break_${day.date}_carried_${sessIndex}`,
            startTime: endTime,
            endTime: formatTime12h(startMinute + carriedSess.durationMinutes + breakDuration),
            durationMinutes: breakDuration
          });
        }
      }
    }

    day.allocatedHours = Number((allocatedMinutes / 60).toFixed(1));
    day.progressPercentage = calculateDayProgress(day.sessions);
  }

  // 5. Calculate new overall stats
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

  const updatedSchedule: StudySchedule = {
    ...currentSchedule,
    generatedAt: new Date().toISOString(),
    days: updatedDays,
    overallProgress,
    totalPlannedHours,
    totalCompletedHours
  };

  const replanEvent: ReplanEvent = {
    id: 'replan_' + Date.now(),
    date: todayStr,
    timestamp: new Date().toISOString(),
    reason,
    missedDates: missedDateStrings,
    tasksCarriedForward: tasksCarriedForwardCount,
    prevRemainingDays,
    updatedRemainingDays: remainingDaysList.length,
    updatedPrioritySubjects: updatedSubjectPriorities.map((item) => ({
      subjectName: item.subject.name,
      priority: item.subject.calculatedPriority!.level,
      changeDescription: item.changeDescription
    })),
    summaryNotes: `Preserved all completed tasks, carried forward ${tasksCarriedForwardCount} pending study sessions, and dynamically rebalanced remaining schedule across ${remainingDaysList.length} days.`
  };

  return { updatedSchedule, replanEvent };
}

export function calculateDayProgress(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;
  const completed = sessions.filter((s) => s.status === 'completed').length;
  return Math.round((completed / sessions.length) * 100);
}
