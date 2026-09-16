import React from 'react';
import {
  Zap,
  CloudSun,
  Trophy,
  LayoutDashboard,
  Volume2,
  VolumeX,
  User,
  Activity,
} from 'lucide-react';
import { TempUnit } from '../types';

export type ActiveTab = 'dashboard' | 'quiz' | 'weather' | 'leaderboard';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  tempUnit: TempUnit;
  onToggleTempUnit: () => void;
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  apiLatencyMs?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  soundEnabled,
  onToggleSound,
  tempUnit,
  onToggleTempUnit,
  playerName,
  onUpdatePlayerName,
  apiLatencyMs,
}) => {
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [tempName, setTempName] = React.useState(playerName);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onUpdatePlayerName(tempName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Live Sync Tag */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                QuizPulse <span className="font-light text-slate-400">×</span> ClimaSync
              </h1>
              <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                REST API Live
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Timed Interactive Trivia &amp; Synchronous Weather Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </button>

          <button
            id="nav-tab-quiz"
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'quiz'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Quiz</span>
          </button>

          <button
            id="nav-tab-weather"
            onClick={() => setActiveTab('weather')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'weather'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudSun className="h-4 w-4" />
            <span>Weather</span>
          </button>

          <button
            id="nav-tab-leaderboard"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
        </nav>

        {/* Global Controls: Audio, Units, Player Name */}
        <div className="flex items-center gap-2">
          {/* Latency badge */}
          {apiLatencyMs !== undefined && (
            <div
              title={`Public Open-Meteo REST API latency: ${apiLatencyMs}ms`}
              className="hidden lg:flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600 font-mono"
            >
              <Activity className="h-3 w-3 text-emerald-600" />
              <span>{apiLatencyMs}ms</span>
            </div>
          )}

          {/* Unit Toggle */}
          <button
            id="btn-unit-toggle"
            onClick={onToggleTempUnit}
            title={`Switch to °${tempUnit === 'C' ? 'F' : 'C'}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-xs"
          >
            °{tempUnit}
          </button>

          {/* Sound Toggle */}
          <button
            id="btn-sound-toggle"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors shadow-xs ${
              soundEnabled
                ? 'border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100'
                : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Player Name Pill */}
          {isEditingName ? (
            <form onSubmit={handleSaveName} className="flex items-center">
              <input
                id="input-player-name"
                type="text"
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => setIsEditingName(false)}
                className="w-24 rounded-lg border border-indigo-400 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500"
                maxLength={14}
              />
            </form>
          ) : (
            <button
              id="btn-player-profile"
              onClick={() => setIsEditingName(true)}
              title="Click to rename player"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <User className="h-3.5 w-3.5 text-indigo-600" />
              <span className="max-w-[80px] truncate sm:max-w-[120px]">{playerName}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
