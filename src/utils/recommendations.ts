import { Subject, StudySchedule, SmartRecommendation } from '../types';
import { differenceInDays, getTodayDateString } from './dateUtils';

export function generateSmartRecommendations(
  subjects: Subject[],
  schedule: StudySchedule | null,
  currentDateStr: string = getTodayDateString()
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];

  if (subjects.length === 0) {
    recommendations.push({
      id: 'rec_no_subjects',
      type: 'tip',
      title: 'Personalized Study Recommendations',
      message: 'Add your subjects and examination dates to receive personalized study recommendations.',
      actionText: '+ Add Subject',
      actionType: 'navigate',
      targetTab: 'subjects'
    });
    return recommendations;
  }

  if (!schedule || schedule.days.length === 0) {
    recommendations.push({
      id: 'rec_no_schedule',
      type: 'tip',
      title: 'Create Your Study Plan',
      message: 'Schedule your daily study sessions with your subjects, topics, and target exam deadlines.',
      actionText: '+ Add Study Plan',
      actionType: 'navigate',
      targetTab: 'study-plan'
    });
    return recommendations;
  }

  // 1. Check for Missed Days or Incomplete Past Days needing replan
  const pastIncompleteDays = schedule.days.filter(
    (d) => d.date < currentDateStr && d.sessions.some((s) => s.status !== 'completed') && !d.isMissed
  );

  const missedDaysCount = schedule.days.filter((d) => d.isMissed).length;

  if (pastIncompleteDays.length > 0) {
    recommendations.push({
      id: 'rec_missed_sessions',
      type: 'replan',
      title: 'Unfinished Past Sessions Detected',
      message: `You have ${pastIncompleteDays.length} past study day${pastIncompleteDays.length > 1 ? 's' : ''} with pending tasks. Run Replan to redistribute them evenly into your upcoming schedule without stress.`,
      actionText: 'Replan Schedule Now',
      actionType: 'replan',
      targetTab: 'study-plan'
    });
  }

  // 2. Exam Urgency Recommendations
  const sortedSubjectsByExam = [...subjects].sort(
    (a, b) => differenceInDays(a.examDate, currentDateStr) - differenceInDays(b.examDate, currentDateStr)
  );

  const nearestSubject = sortedSubjectsByExam.find(
    (s) => differenceInDays(s.examDate, currentDateStr) >= 0
  );

  if (nearestSubject) {
    const daysLeft = differenceInDays(nearestSubject.examDate, currentDateStr);
    if (daysLeft <= 3) {
      recommendations.push({
        id: `rec_urgent_${nearestSubject.id}`,
        type: 'urgent',
        title: `Crucial Countdown: ${nearestSubject.name} in ${daysLeft === 0 ? 'Today' : `${daysLeft} day${daysLeft > 1 ? 's' : ''}`}`,
        message: `Focus heavily on ${nearestSubject.name} high-yield formula reviews, past question papers, and quick recall drills. Avoid learning brand new complex concepts at this stage.`,
        subjectId: nearestSubject.id,
        subjectName: nearestSubject.name,
        actionText: 'View Subject Details',
        actionType: 'view_subject'
      });
    } else if (daysLeft <= 7) {
      recommendations.push({
        id: `rec_approaching_${nearestSubject.id}`,
        type: 'warning',
        title: `${nearestSubject.name} Examination in ${daysLeft} Days`,
        message: `Your ${nearestSubject.name} exam is approaching this week. Ensure all foundational units are completed so you can transition into full mock test simulations.`,
        subjectId: nearestSubject.id,
        subjectName: nearestSubject.name,
        actionText: 'Check Tasks',
        actionType: 'navigate',
        targetTab: 'study-plan'
      });
    }
  }

  // 3. Hard Subject Progress Check
  const hardSubjects = subjects.filter((s) => s.difficulty === 'hard');
  hardSubjects.forEach((sub) => {
    // calculate subject completion
    let totalSubSessions = 0;
    let completedSubSessions = 0;

    schedule.days.forEach((d) => {
      d.sessions.forEach((sess) => {
        if (sess.subjectId === sub.id) {
          totalSubSessions++;
          if (sess.status === 'completed') {
            completedSubSessions++;
          }
        }
      });
    });

    const completionRate = totalSubSessions > 0 ? (completedSubSessions / totalSubSessions) * 100 : 0;
    const daysLeft = differenceInDays(sub.examDate, currentDateStr);

    if (daysLeft > 3 && completionRate < 40 && totalSubSessions > 0) {
      recommendations.push({
        id: `rec_hard_focus_${sub.id}`,
        type: 'warning',
        title: `Pace Acceleration Recommended for ${sub.name}`,
        message: `${sub.name} is categorized as Hard with ${Math.round(completionRate)}% completed so far. Dedicate your prime morning focus blocks to this subject for maximum retention.`,
        subjectId: sub.id,
        subjectName: sub.name,
        actionText: 'View Subject',
        actionType: 'view_subject'
      });
    } else if (completionRate >= 75 && totalSubSessions > 3) {
      recommendations.push({
        id: `rec_praise_${sub.id}`,
        type: 'praise',
        title: `${sub.name} Preparation is Strong (${Math.round(completionRate)}% Complete)`,
        message: `Outstanding consistency on ${sub.name}! Maintain this rhythm with light flashcard review while directing extra available hours to remaining subjects.`,
        subjectId: sub.id,
        subjectName: sub.name
      });
    }
  });

  // 4. Time Availability Capacity Check
  if (schedule.isInsufficientTime) {
    recommendations.push({
      id: 'rec_capacity_warning',
      type: 'urgent',
      title: 'Increase Daily Study Budget',
      message: 'Your total scheduled hours fall short of the recommended syllabus coverage. Increasing your daily study time by 1.0 to 1.5 hours will comfortably bridge the gap.',
      actionText: 'Adjust Study Hours in Settings',
      actionType: 'navigate',
      targetTab: 'settings'
    });
  } else {
    recommendations.push({
      id: 'rec_healthy_pace',
      type: 'tip',
      title: 'Balanced Cognitive Rhythm',
      message: 'Remember to utilize the 15-minute active breaks between intensive sessions. Stepping away from screens boosts memory consolidation by up to 20%.',
      actionText: 'View Today\'s Plan',
      actionType: 'navigate',
      targetTab: 'study-plan'
    });
  }

  return recommendations;
}
