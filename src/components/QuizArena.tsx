import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  Zap,
  Award,
  Flame,
  HelpCircle,
  CheckCircle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  FastForward,
  Hourglass,
  Trophy,
  ChevronDown,
  ChevronUp,
  Share2,
} from 'lucide-react';
import {
  QuizQuestion,
  QuizCategory,
  UserAnswerRecord,
  QuizSessionStats,
  LeaderboardEntry,
} from '../types';
import { QUIZ_QUESTIONS, CATEGORY_METADATA } from '../data/quizQuestions';
import { playSound } from '../utils/soundEffects';

interface QuizArenaProps {
  playerName: string;
  soundEnabled: boolean;
  onSaveLeaderboard: (entry: LeaderboardEntry) => void;
  onViewLeaderboard: () => void;
  initialCategory?: QuizCategory;
}

type QuizPhase = 'lobby' | 'playing' | 'answered' | 'completed';

export const QuizArena: React.FC<QuizArenaProps> = ({
  playerName,
  soundEnabled,
  onSaveLeaderboard,
  onViewLeaderboard,
  initialCategory = 'meteorology',
}) => {
  // Config state
  const [selectedCategory, setSelectedCategory] = useState<QuizCategory>(initialCategory);
  const [questionCount, setQuestionCount] = useState<number>(6);
  const [timerDuration, setTimerDuration] = useState<number>(15);

  // Active Game State
  const [phase, setPhase] = useState<QuizPhase>('lobby');
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(timerDuration);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswerRecord[]>([]);

  // Lifelines
  const [hasUsedFiftyFifty, setHasUsedFiftyFifty] = useState<boolean>(false);
  const [hasUsedTimeBoost, setHasUsedTimeBoost] = useState<boolean>(false);
  const [hasUsedSkip, setHasUsedSkip] = useState<boolean>(false);
  const [hiddenOptionIndices, setHiddenOptionIndices] = useState<number[]>([]);

  // Review State
  const [showReviewAccordion, setShowReviewAccordion] = useState<boolean>(false);
  const [hasSavedScore, setHasSavedScore] = useState<boolean>(false);

  // Ref for timer interval
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion: QuizQuestion | undefined = activeQuestions[currentIndex];

  // Helper to start the game
  const startQuiz = (cat: QuizCategory = selectedCategory) => {
    // Filter questions by category
    let pool = QUIZ_QUESTIONS;
    if (cat !== 'all') {
      pool = QUIZ_QUESTIONS.filter((q) => q.category === cat);
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    setActiveQuestions(selected);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setUserAnswers([]);
    setHasUsedFiftyFifty(false);
    setHasUsedTimeBoost(false);
    setHasUsedSkip(false);
    setHiddenOptionIndices([]);
    setSelectedOption(null);
    setTimeLeft(timerDuration);
    setHasSavedScore(false);
    setShowReviewAccordion(false);

    setPhase('playing');
  };

  // Timer Tick Effect
  useEffect(() => {
    if (phase !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }

        // Sound cues for last 4 seconds
        if (prev <= 4) {
          playSound('urgent_tick', soundEnabled);
        } else if (prev <= 6) {
          playSound('tick', soundEnabled);
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentIndex, soundEnabled]);

  // Handle timeout
  const handleTimeOut = () => {
    if (!currentQuestion) return;
    playSound('wrong', soundEnabled);

    const record: UserAnswerRecord = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      options: currentQuestion.options,
      selectedIndex: null,
      correctIndex: currentQuestion.correctAnswerIndex,
      isCorrect: false,
      timeSpentSeconds: timerDuration,
      pointsEarned: 0,
    };

    setUserAnswers((prev) => [...prev, record]);
    setStreak(0);
    setPhase('answered');
  };

  // Handle user selecting an option
  const handleSelectOption = (index: number) => {
    if (phase !== 'playing' || !currentQuestion) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(index);
    const isCorrect = index === currentQuestion.correctAnswerIndex;
    const timeSpent = Math.max(1, timerDuration - timeLeft);

    // Calculate score
    let pointsEarned = 0;
    let newStreak = streak;

    if (isCorrect) {
      playSound('correct', soundEnabled);
      newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      // Multipliers: 1.25x for 2+, 1.5x for 3+, 2.0x for 4+
      const streakMultiplier = newStreak >= 4 ? 2.0 : newStreak === 3 ? 1.5 : newStreak === 2 ? 1.25 : 1.0;
      const speedBonus = Math.round(timeLeft * 12);
      pointsEarned = Math.round((100 + speedBonus) * streakMultiplier);
      setScore((prev) => prev + pointsEarned);

      if (newStreak >= 3) {
        setTimeout(() => playSound('streak', soundEnabled), 200);
      }
    } else {
      playSound('wrong', soundEnabled);
      setStreak(0);
    }

    const record: UserAnswerRecord = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      options: currentQuestion.options,
      selectedIndex: index,
      correctIndex: currentQuestion.correctAnswerIndex,
      isCorrect,
      timeSpentSeconds: timeSpent,
      pointsEarned,
    };

    setUserAnswers((prev) => [...prev, record]);
    setPhase('answered');
  };

  // Lifeline: 50/50
  const handleFiftyFifty = () => {
    if (hasUsedFiftyFifty || phase !== 'playing' || !currentQuestion) return;
    playSound('lifeline', soundEnabled);

    const wrongIndices = currentQuestion.options
      .map((_, idx) => idx)
      .filter((idx) => idx !== currentQuestion.correctAnswerIndex);

    // Pick 2 wrong indices to hide
    const shuffledWrong = wrongIndices.sort(() => 0.5 - Math.random());
    const toHide = shuffledWrong.slice(0, 2);

    setHiddenOptionIndices(toHide);
    setHasUsedFiftyFifty(true);
  };

  // Lifeline: Time Freeze / Boost (+10s)
  const handleTimeBoost = () => {
    if (hasUsedTimeBoost || phase !== 'playing') return;
    playSound('lifeline', soundEnabled);
    setTimeLeft((prev) => prev + 10);
    setHasUsedTimeBoost(true);
  };

  // Lifeline: Skip Question
  const handleSkip = () => {
    if (hasUsedSkip || phase !== 'playing') return;
    playSound('lifeline', soundEnabled);
    setHasUsedSkip(true);
    handleNextQuestion();
  };

  // Move to next question or complete
  const handleNextQuestion = () => {
    setHiddenOptionIndices([]);
    setSelectedOption(null);

    if (currentIndex + 1 < activeQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(timerDuration);
      setPhase('playing');
    } else {
      // Quiz finished
      setPhase('completed');
      playSound('complete', soundEnabled);

      // Trigger confetti if good score
      const correctCount = userAnswers.filter((a) => a.isCorrect).length;
      const acc = Math.round((correctCount / activeQuestions.length) * 100);
      if (acc >= 60) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  // Summary statistics
  const summaryStats = useMemo(() => {
    const total = activeQuestions.length;
    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const totalTimeSpent = userAnswers.reduce((acc, curr) => acc + curr.timeSpentSeconds, 0);

    const badges: string[] = [];
    if (accuracy === 100) badges.push('Flawless 100%');
    if (maxStreak >= 4) badges.push('Streak Titan');
    if (totalTimeSpent < total * 6) badges.push('Lightning Reflexes');
    if (selectedCategory === 'meteorology') badges.push('Weather Wizard');
    if (score >= 800) badges.push('Grandmaster');

    return {
      total,
      correctCount,
      accuracy,
      totalTimeSpent,
      maxStreak,
      badges,
    };
  }, [activeQuestions, userAnswers, maxStreak, selectedCategory, score]);

  // Save to leaderboard
  const handleSaveToLeaderboard = () => {
    if (hasSavedScore) return;

    const entry: LeaderboardEntry = {
      id: `entry-${Date.now()}`,
      playerName: playerName || 'Anonymous Scout',
      score,
      accuracy: summaryStats.accuracy,
      correctAnswers: summaryStats.correctCount,
      totalQuestions: summaryStats.total,
      timeSpentSeconds: summaryStats.totalTimeSpent,
      category: selectedCategory,
      categoryLabel: CATEGORY_METADATA[selectedCategory].label,
      date: 'Just now',
      avatarSeed: playerName,
      badges: summaryStats.badges,
    };

    onSaveLeaderboard(entry);
    setHasSavedScore(true);
  };

  // ==========================================
  // VIEW 1: LOBBY (START SCREEN)
  // ==========================================
  if (phase === 'lobby') {
    return (
      <div className="space-y-6">
        {/* Welcome Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 mb-2">
                <Clock className="h-3.5 w-3.5" />
                <span>Timed Interactive Challenge</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Ready for the Time Challenge, {playerName}?
              </h2>
              <p className="mt-1 text-sm text-slate-500 max-w-xl">
                Beat the countdown clock, activate strategic lifelines, build streak multipliers, and claim your spot on the persistent leaderboard.
              </p>
            </div>
            <button
              id="btn-quick-start"
              onClick={() => startQuiz(selectedCategory)}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-bold text-white shadow-md hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <Zap className="h-5 w-5 fill-current text-amber-300" />
              <span>Launch Quiz Now</span>
            </button>
          </div>

          {/* Category Selector Cards */}
          <div className="pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Select Quiz Category
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(CATEGORY_METADATA) as QuizCategory[]).map((cat) => {
                const meta = CATEGORY_METADATA[cat];
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    id={`btn-category-${cat}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex flex-col text-left rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-800">{meta.label}</span>
                      {isSelected && <CheckCircle className="h-4 w-4 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{meta.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quiz Configuration Rules & Lifelines Preview */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
            {/* Timer Selection */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <span className="text-xs font-bold text-slate-600 block mb-2">
                Countdown Clock per Question
              </span>
              <div className="flex items-center gap-2">
                {[10, 15, 20].map((seconds) => (
                  <button
                    key={seconds}
                    onClick={() => setTimerDuration(seconds)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                      timerDuration === seconds
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {seconds}s {seconds === 10 ? '⚡ Blitz' : seconds === 15 ? '🎯 Normal' : '🧘 Relaxed'}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions Length */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <span className="text-xs font-bold text-slate-600 block mb-2">
                Number of Questions
              </span>
              <div className="flex items-center gap-2">
                {[4, 6, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                      questionCount === count
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Lifelines rules */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <span className="text-xs font-bold text-slate-600 block mb-1">
                In-Game Tactical Lifelines
              </span>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <ShieldAlert className="h-3.5 w-3.5 text-indigo-500" /> 50:50
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <Hourglass className="h-3.5 w-3.5 text-amber-500" /> +10s Freeze
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <FastForward className="h-3.5 w-3.5 text-teal-500" /> Skip Q
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE QUESTION / ANSWERED VIEW
  // ==========================================
  if (phase === 'playing' || phase === 'answered') {
    if (!currentQuestion) return null;

    const timerPercentage = Math.max(0, Math.min(100, (timeLeft / timerDuration) * 100));
    const isUrgent = timeLeft <= 5;
    const isCritical = timeLeft <= 3;

    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {/* Top Control Bar: Progress, Timer, Streak, Score */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between gap-4 mb-3">
            {/* Question Counter */}
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                Q {currentIndex + 1} of {activeQuestions.length}
              </span>
              <span className="text-xs font-semibold text-slate-400 capitalize hidden sm:inline">
                {CATEGORY_METADATA[currentQuestion.category].label}
              </span>
            </div>

            {/* Streak Multiplier */}
            <div className="flex items-center gap-1.5">
              {streak >= 2 ? (
                <div className="flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700 animate-pulse">
                  <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span>{streak}x Streak ({streak >= 4 ? '2.0x' : streak === 3 ? '1.5x' : '1.25x'})</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium hidden sm:block">
                  Streak: {streak}
                </div>
              )}
            </div>

            {/* Current Score */}
            <div className="flex items-center gap-1 text-right">
              <span className="text-xs text-slate-400 font-medium">Score:</span>
              <span className="text-sm font-extrabold text-indigo-600 font-mono">{score}</span>
            </div>
          </div>

          {/* Countdown Clock Strip */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 font-bold text-slate-600">
                <Clock
                  className={`h-3.5 w-3.5 ${
                    isCritical ? 'text-rose-600 animate-spin' : isUrgent ? 'text-amber-500' : 'text-slate-400'
                  }`}
                />
                <span className={isCritical ? 'text-rose-600 font-extrabold' : isUrgent ? 'text-amber-600' : ''}>
                  {phase === 'answered' ? 'Question Answered' : `${timeLeft}s Remaining`}
                </span>
              </div>
              <span className="font-mono text-slate-400 text-[11px]">{Math.round(timerPercentage)}%</span>
            </div>

            {/* Animated Progress Track */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full transition-all duration-300 ease-linear rounded-full ${
                  isCritical ? 'bg-rose-500' : isUrgent ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tactical Lifelines Bar */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5">
          <span className="text-xs font-semibold text-slate-500">Tactical Lifelines:</span>
          <div className="flex items-center gap-2">
            {/* 50/50 */}
            <button
              id="btn-lifeline-fifty-fifty"
              onClick={handleFiftyFifty}
              disabled={hasUsedFiftyFifty || phase !== 'playing'}
              title="Eliminate two incorrect choices"
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                hasUsedFiftyFifty
                  ? 'opacity-40 line-through bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-600 shadow-2xs'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-indigo-500" />
              <span>50:50</span>
            </button>

            {/* +10s Time Freeze */}
            <button
              id="btn-lifeline-time-freeze"
              onClick={handleTimeBoost}
              disabled={hasUsedTimeBoost || phase !== 'playing'}
              title="Add +10 seconds to the clock"
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                hasUsedTimeBoost
                  ? 'opacity-40 line-through bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-amber-300 hover:text-amber-600 shadow-2xs'
              }`}
            >
              <Hourglass className="h-3.5 w-3.5 text-amber-500" />
              <span>+10s Boost</span>
            </button>

            {/* Skip */}
            <button
              id="btn-lifeline-skip"
              onClick={handleSkip}
              disabled={hasUsedSkip || phase !== 'playing'}
              title="Skip this question with zero penalty"
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                hasUsedSkip
                  ? 'opacity-40 line-through bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-600 shadow-2xs'
              }`}
            >
              <FastForward className="h-3.5 w-3.5 text-teal-500" />
              <span>Skip</span>
            </button>
          </div>
        </div>

        {/* Main Question Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              {currentQuestion.difficulty} Difficulty
            </span>
            <h3 className="mt-3 text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, idx) => {
              const isHidden = hiddenOptionIndices.includes(idx);
              if (isHidden) {
                return (
                  <div
                    key={idx}
                    className="flex items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-4 opacity-30 select-none"
                  >
                    <span className="text-xs text-slate-400">Eliminated by 50:50</span>
                  </div>
                );
              }

              let buttonStyle = 'border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50/50 text-slate-800';
              let badgeColor = 'bg-slate-100 text-slate-700';

              if (phase === 'answered') {
                if (idx === currentQuestion.correctAnswerIndex) {
                  buttonStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-500/20';
                  badgeColor = 'bg-emerald-600 text-white';
                } else if (selectedOption === idx) {
                  buttonStyle = 'border-rose-500 bg-rose-50 text-rose-950 font-medium';
                  badgeColor = 'bg-rose-600 text-white';
                } else {
                  buttonStyle = 'border-slate-200 bg-slate-50 opacity-50 text-slate-400';
                }
              }

              const letters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={idx}
                  id={`quiz-option-${idx}`}
                  disabled={phase === 'answered'}
                  onClick={() => handleSelectOption(idx)}
                  className={`group relative flex items-start gap-3 rounded-xl border p-4 text-left text-sm transition-all ${buttonStyle}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-colors ${badgeColor}`}
                  >
                    {letters[idx]}
                  </span>
                  <span className="flex-1 leading-relaxed pt-0.5">{option}</span>

                  {phase === 'answered' && idx === currentQuestion.correctAnswerIndex && (
                    <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 self-center" />
                  )}
                  {phase === 'answered' && selectedOption === idx && idx !== currentQuestion.correctAnswerIndex && (
                    <XCircle className="h-5 w-5 shrink-0 text-rose-600 self-center" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner when answered */}
          {phase === 'answered' && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Scientific Explanation
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                  {currentQuestion.funFact && (
                    <div className="mt-2 rounded-lg bg-amber-50/80 border border-amber-200/80 p-2.5 text-xs text-amber-900">
                      <span className="font-bold">⚡ Fun Fact: </span>
                      {currentQuestion.funFact}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Next Action */}
          {phase === 'answered' && (
            <div className="mt-6 flex items-center justify-end">
              <button
                id="btn-next-question"
                onClick={handleNextQuestion}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-all hover:scale-[1.01]"
              >
                <span>{currentIndex + 1 < activeQuestions.length ? 'Next Question' : 'View Final Results'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: QUIZ RESULTS / COMPLETION SCREEN
  // ==========================================
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        {/* Results Header */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white shadow-md mb-3">
            <Trophy className="h-8 w-8 fill-current" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quiz Completed!
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {summaryStats.accuracy >= 80
              ? 'Outstanding performance! You mastered this challenge.'
              : summaryStats.accuracy >= 50
              ? 'Solid effort! A few more practice rounds and you will top the leaderboard.'
              : 'Keep studying the atmospheric and scientific principles!'}
          </p>
        </div>

        {/* Big Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-center">
            <span className="text-xs font-semibold text-slate-500">Total Score</span>
            <div className="mt-1 text-2xl font-black text-indigo-600 font-mono">{score}</div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-center">
            <span className="text-xs font-semibold text-slate-500">Accuracy</span>
            <div className="mt-1 text-2xl font-black text-slate-800">
              {summaryStats.accuracy}%
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-center">
            <span className="text-xs font-semibold text-slate-500">Correct Answers</span>
            <div className="mt-1 text-2xl font-black text-slate-800">
              {summaryStats.correctCount} / {summaryStats.total}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 text-center">
            <span className="text-xs font-semibold text-slate-500">Peak Streak</span>
            <div className="mt-1 text-2xl font-black text-amber-600">
              {maxStreak}x
            </div>
          </div>
        </div>

        {/* Badges Earned */}
        {summaryStats.badges.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 block mb-2">
              Achievements &amp; Badges Earned
            </span>
            <div className="flex flex-wrap gap-2">
              {summaryStats.badges.map((badge, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100/80 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-900"
                >
                  <Sparkles className="h-3 w-3 text-amber-600" />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Saving Callout */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-indigo-950">
              Save Run to Persistent Local Storage Leaderboard
            </div>
            <p className="text-xs text-indigo-700/80 mt-0.5">
              Logged as <span className="font-semibold">{playerName}</span> • Category:{' '}
              {CATEGORY_METADATA[selectedCategory].label}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-save-to-leaderboard"
              onClick={handleSaveToLeaderboard}
              disabled={hasSavedScore}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                hasSavedScore
                  ? 'bg-emerald-600 text-white shadow-xs cursor-default'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
              }`}
            >
              {hasSavedScore ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Saved to Leaderboard</span>
                </>
              ) : (
                <>
                  <Award className="h-4 w-4" />
                  <span>Record High Score</span>
                </>
              )}
            </button>

            <button
              id="btn-view-leaderboard-from-result"
              onClick={onViewLeaderboard}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              View Leaderboard
            </button>
          </div>
        </div>

        {/* Question-by-Question Review Accordion */}
        <div className="border-t border-slate-100 pt-4">
          <button
            onClick={() => setShowReviewAccordion(!showReviewAccordion)}
            className="flex w-full items-center justify-between py-2 text-left text-xs font-bold text-slate-700 hover:text-slate-900"
          >
            <span>Review All {userAnswers.length} Questions &amp; Answers</span>
            {showReviewAccordion ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showReviewAccordion && (
            <div className="mt-3 space-y-3">
              {userAnswers.map((ans, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border p-3.5 text-xs ${
                    ans.isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800">
                      Q{idx + 1}: {ans.questionText}
                    </span>
                    <span
                      className={`font-semibold rounded px-1.5 py-0.5 text-[10px] ${
                        ans.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {ans.isCorrect ? `+${ans.pointsEarned} pts` : '0 pts (Incorrect)'}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Your choice: <span className="font-semibold">{ans.selectedIndex !== null ? ans.options[ans.selectedIndex] : 'Timed Out'}</span>
                  </div>
                  {!ans.isCorrect && (
                    <div className="text-emerald-800 mt-0.5 font-medium">
                      Correct answer: {ans.options[ans.correctIndex]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-slate-100">
          <button
            id="btn-play-again"
            onClick={() => startQuiz(selectedCategory)}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors w-full sm:w-auto shadow-xs"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Play Again ({CATEGORY_METADATA[selectedCategory].label})</span>
          </button>

          <button
            id="btn-lobby-return"
            onClick={() => setPhase('lobby')}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors w-full sm:w-auto"
          >
            <span>Change Category &amp; Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
