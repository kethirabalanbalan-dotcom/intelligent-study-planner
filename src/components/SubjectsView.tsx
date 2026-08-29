import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  RefreshCw,
  BookOpen,
  X,
  Check,
  Award,
  AlertCircle
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { Subject, DifficultyLevel } from '../types';
import { formatDate, differenceInDays, getTodayDateString } from '../utils/dateUtils';

const COLOR_PRESETS = [
  '#6366F1', // Indigo
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#3B82F6'  // Blue
];

export const SubjectsView: React.FC = () => {
  const {
    subjects,
    profile,
    addSubject,
    updateSubject,
    deleteSubject,
    generateSchedule,
    setSelectedSubjectModal,
    setActiveTab
  } = usePlanner();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(50);
  const [estimatedTopics, setEstimatedTopics] = useState<number>(6);
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [topicInput, setTopicInput] = useState('');
  const [topicsList, setTopicsList] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  const todayStr = getTodayDateString();

  const openAddModal = () => {
    setEditingSubject(null);
    setName('');
    setExamDate('2026-09-25');
    setDifficulty('medium');
    setConfidenceLevel(50);
    setEstimatedTopics(6);
    setColor(COLOR_PRESETS[subjects.length % COLOR_PRESETS.length]);
    setTopicsList([]);
    setTopicInput('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    setEditingSubject(sub);
    setName(sub.name);
    setExamDate(sub.examDate);
    setDifficulty(sub.difficulty);
    setConfidenceLevel(sub.confidenceLevel ?? 50);
    setEstimatedTopics(sub.estimatedTopics ?? 6);
    setColor(sub.color || COLOR_PRESETS[0]);
    setTopicsList(sub.topics || []);
    setTopicInput('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleAddTopic = () => {
    if (topicInput.trim()) {
      setTopicsList((prev) => [...prev, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopicsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a subject name.');
      return;
    }
    if (!examDate) {
      setFormError('Please select a valid examination date.');
      return;
    }
    if (differenceInDays(examDate, profile.startDate) < 0) {
      setFormError(`Examination date must be after preparation start date (${profile.startDate}).`);
      return;
    }

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: name.trim(),
        examDate,
        difficulty,
        confidenceLevel,
        estimatedTopics: topicsList.length > 0 ? topicsList.length : estimatedTopics,
        topics: topicsList,
        color
      });
    } else {
      addSubject({
        name: name.trim(),
        examDate,
        difficulty,
        confidenceLevel,
        estimatedTopics: topicsList.length > 0 ? topicsList.length : estimatedTopics,
        topics: topicsList,
        color
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Title & Action CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-display">
            Subject & Examination Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Add all examination subjects, configure difficulty levels and target dates to calculate priority weights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="subjects-generate-plan-btn"
            onClick={generateSchedule}
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition flex items-center gap-2 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 dark:text-indigo-600" />
            Generate Study Plan
          </button>
          <button
            id="subjects-add-btn"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        {subjects.map((sub) => {
          const prio = sub.calculatedPriority;
          const daysLeft = Math.max(0, differenceInDays(sub.examDate, todayStr));

          return (
            <div
              key={sub.id}
              className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: Color bar, Name, and Badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3.5 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <div>
                      <h3
                        onClick={() => setSelectedSubjectModal(sub)}
                        className="text-lg font-bold text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600 transition font-display"
                      >
                        {sub.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Exam: {formatDate(sub.examDate)}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{daysLeft} days remaining</span>
                      </div>
                    </div>
                  </div>

                  {/* Priority Badge */}
                  {prio && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        prio.level === 'high'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : prio.level === 'medium'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      {prio.level} Priority
                    </span>
                  )}
                </div>

                {/* Priority Score & Metrics Breakdown */}
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2 mt-3 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
                    <span>Difficulty: <strong className="capitalize text-slate-900 dark:text-white">{sub.difficulty}</strong> ({prio?.difficultyWeight}x weight)</span>
                    <span>Confidence: <strong className="text-slate-900 dark:text-white">{sub.confidenceLevel ?? 50}%</strong></span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Recommended Prep: <strong className="text-indigo-600 dark:text-indigo-400">{prio?.recommendedTotalHours || 16} hrs</strong></span>
                    <span>Priority Score: <strong className="text-slate-900 dark:text-white">{prio?.score}</strong></span>
                  </div>
                  {prio?.reason && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                      "{prio.reason}"
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  id={`subject-details-btn-${sub.id}`}
                  onClick={() => setSelectedSubjectModal(sub)}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View Details & Topics ({sub.topics?.length || sub.estimatedTopics || 6}) →
                </button>

                <div className="flex items-center gap-1">
                  <button
                    id={`subject-edit-btn-${sub.id}`}
                    onClick={() => openEditModal(sub)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                    title="Edit Subject"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    id={`subject-delete-btn-${sub.id}`}
                    onClick={() => setSubjectToDelete(sub)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                    title="Delete Subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal (Requirement: ID-based deletion, confirmation prompt, Cancel & Delete buttons) */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  Are you sure you want to delete this subject?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  This action will permanently delete{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {subjectToDelete.name}
                  </strong>{' '}
                  ({subjectToDelete.difficulty} difficulty, exam on{' '}
                  {formatDate(subjectToDelete.examDate)}).
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200">
              <span className="font-semibold">⚠️ Automatic Replanning Notice:</span>
              <p className="mt-0.5 text-rose-800 dark:text-rose-300">
                All scheduled study sessions for this subject will be removed, and your remaining study plan and priority rankings will be automatically recalculated and rebalanced.
              </p>
            </div>

            {/* Action Buttons: Cancel and Delete */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                id="delete-subject-cancel-btn"
                onClick={() => setSubjectToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                id="delete-subject-confirm-btn"
                onClick={() => {
                  if (subjectToDelete) {
                    deleteSubject(subjectToDelete.id);
                    setSubjectToDelete(null);
                  }
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  The algorithm will recalculate priorities and recommended hours automatically.
                </p>
              </div>
              <button
                id="subject-form-close-btn"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Subject Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Subject Name *
                </label>
                <input
                  id="subject-form-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics, Physics, Chemistry..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Exam Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Examination Date *
                </label>
                <input
                  id="subject-form-date-input"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Difficulty Level (Requirement 2) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Difficulty Level *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      id={`subject-diff-${level}`}
                      onClick={() => setDifficulty(level)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold capitalize transition border ${
                        difficulty === level
                          ? level === 'hard'
                            ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                            : level === 'medium'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                            : 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {level} {level === 'hard' ? '(3x)' : level === 'medium' ? '(2x)' : '(1x)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence Level Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  <span>Current Confidence / Prep Status</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{confidenceLevel}%</span>
                </div>
                <input
                  id="subject-form-confidence-input"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Needs heavy prep (10%)</span>
                  <span>Average (50%)</span>
                  <span>Mastered (100%)</span>
                </div>
              </div>

              {/* Estimated Topics & Topic Builder */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Topic / Syllabus Breakdown
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                    placeholder="Add topic (e.g. Calculus Fundamentals)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200"
                  >
                    Add
                  </button>
                </div>

                {topicsList.length > 0 && (
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {topicsList.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs"
                      >
                        <span className="truncate text-slate-700 dark:text-slate-300">{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(idx)}
                          className="text-slate-400 hover:text-rose-500 ml-2"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Color Theme */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                        color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="subject-form-submit-btn"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                >
                  {editingSubject ? 'Save Changes' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
