import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Flame,
  Clock,
  Target,
  Sparkles,
  RotateCcw,
  User,
  Filter,
} from 'lucide-react';
import { LeaderboardEntry, QuizCategory } from '../types';
import { CATEGORY_METADATA } from '../data/quizQuestions';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  currentPlayerName: string;
  onResetLeaderboard: () => void;
  onStartQuiz: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  currentPlayerName,
  onResetLeaderboard,
  onStartQuiz,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<QuizCategory | 'all_cats'>('all_cats');
  const [sortBy, setSortBy] = useState<'score' | 'accuracy' | 'time'>('score');

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let list = [...entries];
    if (categoryFilter !== 'all_cats') {
      list = list.filter((e) => e.category === categoryFilter);
    }

    return list.sort((a, b) => {
      if (sortBy === 'score') {
        return b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds;
      }
      if (sortBy === 'accuracy') {
        return b.accuracy - a.accuracy || b.score - a.score;
      }
      if (sortBy === 'time') {
        return a.timeSpentSeconds - b.timeSpentSeconds || b.score - a.score;
      }
      return 0;
    });
  }, [entries, categoryFilter, sortBy]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    if (entries.length === 0) return { highScore: 0, totalGames: 0, avgAccuracy: 0 };
    const highScore = Math.max(...entries.map((e) => e.score));
    const totalGames = entries.length;
    const avgAccuracy = Math.round(
      entries.reduce((acc, curr) => acc + curr.accuracy, 0) / entries.length
    );
    return { highScore, totalGames, avgAccuracy };
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Top Hero Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              All-Time High Score
            </span>
            <Trophy className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-amber-950 font-mono">
            {aggregateStats.highScore}
          </div>
          <p className="mt-1 text-xs text-amber-700">Highest recorded score</p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              Recorded Quiz Runs
            </span>
            <Target className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-indigo-950 font-mono">
            {aggregateStats.totalGames}
          </div>
          <p className="mt-1 text-xs text-indigo-700">Persisted in Local Storage</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/40 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Average Accuracy
            </span>
            <Sparkles className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-950 font-mono">
            {aggregateStats.avgAccuracy}%
          </div>
          <p className="mt-1 text-xs text-emerald-700">Across all trivia categories</p>
        </div>
      </div>

      {/* Filter and Sorting Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <button
            onClick={() => setCategoryFilter('all_cats')}
            className={`rounded-lg px-2.5 py-1 font-semibold transition-colors shrink-0 ${
              categoryFilter === 'all_cats'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {(Object.keys(CATEGORY_METADATA) as QuizCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-colors shrink-0 ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {CATEGORY_METADATA[cat].label}
            </button>
          ))}
        </div>

        {/* Sort Switcher */}
        <div className="flex items-center gap-2 text-xs self-end sm:self-auto">
          <span className="text-slate-400 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="score">Highest Score</option>
            <option value="accuracy">Top Accuracy</option>
            <option value="time">Fastest Time</option>
          </select>
        </div>
      </div>

      {/* Leaderboard High Scores Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hall of Fame Rankings</h3>
            <p className="text-xs text-slate-500">
              Synced to your browser's local storage engine
            </p>
          </div>
          <button
            id="btn-play-new-quiz"
            onClick={onStartQuiz}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Play to Rank Up
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 sm:px-6">Rank</th>
                <th className="px-4 py-3 sm:px-6">Player</th>
                <th className="px-4 py-3 sm:px-6">Category</th>
                <th className="px-4 py-3 sm:px-6 text-right">Score</th>
                <th className="px-4 py-3 sm:px-6 text-right">Accuracy</th>
                <th className="px-4 py-3 sm:px-6 text-right">Time</th>
                <th className="px-4 py-3 sm:px-6">Badges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((entry, index) => {
                const isCurrentPlayer =
                  entry.playerName.toLowerCase() === currentPlayerName.toLowerCase();
                const rank = index + 1;

                // Medal styles
                let rankBadge = (
                  <span className="font-bold text-slate-400 text-xs">#{rank}</span>
                );
                if (rank === 1) {
                  rankBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-800">
                      <Medal className="h-3.5 w-3.5 text-amber-600 fill-amber-500" />
                      1st
                    </span>
                  );
                } else if (rank === 2) {
                  rankBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-black text-slate-700">
                      <Medal className="h-3.5 w-3.5 text-slate-500" />
                      2nd
                    </span>
                  );
                } else if (rank === 3) {
                  rankBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-black text-amber-900">
                      <Medal className="h-3.5 w-3.5 text-amber-700" />
                      3rd
                    </span>
                  );
                }

                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isCurrentPlayer ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-4 py-3.5 sm:px-6 whitespace-nowrap">{rankBadge}</td>
                    <td className="px-4 py-3.5 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">
                          {entry.playerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">{entry.playerName}</span>
                          {isCurrentPlayer && (
                            <span className="ml-1.5 rounded bg-indigo-200 px-1 py-0.2 text-[10px] font-extrabold text-indigo-800">
                              YOU
                            </span>
                          )}
                          <div className="text-[11px] text-slate-400 font-normal">{entry.date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 whitespace-nowrap">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                        {entry.categoryLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 text-right whitespace-nowrap">
                      <span className="font-mono text-base font-black text-indigo-600">
                        {entry.score}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 text-right whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{entry.accuracy}%</span>
                      <span className="text-[11px] text-slate-400 block">
                        {entry.correctAnswers}/{entry.totalQuestions}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 text-right whitespace-nowrap text-xs text-slate-500 font-mono">
                      {entry.timeSpentSeconds}s
                    </td>
                    <td className="px-4 py-3.5 sm:px-6 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {entry.badges?.map((badge, i) => (
                          <span
                            key={i}
                            className="rounded bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No leaderboard runs recorded yet for this filter. Launch a quiz to claim #1!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          <span>Persisted across browser refreshes via localStorage</span>
          <button
            id="btn-reset-leaderboard"
            onClick={onResetLeaderboard}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to Benchmark Scores</span>
          </button>
        </div>
      </div>
    </div>
  );
};
