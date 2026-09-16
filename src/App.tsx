import React, { useState, useEffect, useCallback } from 'react';
import { Header, ActiveTab } from './components/Header';
import { WeatherDashboard } from './components/WeatherDashboard';
import { QuizArena } from './components/QuizArena';
import { LeaderboardView } from './components/LeaderboardView';
import {
  GeoLocationResult,
  WeatherDataResponse,
  LeaderboardEntry,
  QuizCategory,
  TempUnit,
  SpeedUnit,
} from './types';
import {
  POPULAR_CITIES,
  fetchWeatherRestApi,
} from './services/weatherService';
import {
  getLeaderboard,
  saveLeaderboardEntry,
  resetLeaderboardToDefaults,
  getUserPreferences,
  saveUserPreferences,
  getLastSavedLocation,
  saveLastLocation,
} from './utils/storage';
import {
  CloudSun,
  Zap,
  Trophy,
  Compass,
  ArrowRight,
  Sparkles,
  MapPin,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  // Navigation & Preferences State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [tempUnit, setTempUnit] = useState<TempUnit>('C');
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('kmh');
  const [playerName, setPlayerName] = useState<string>('Scout_1');

  // Weather State (Consuming Public REST API)
  const [currentCity, setCurrentCity] = useState<GeoLocationResult>(POPULAR_CITIES[0]);
  const [weatherData, setWeatherData] = useState<WeatherDataResponse | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Leaderboard State (Local Storage)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizCategoryTarget, setQuizCategoryTarget] = useState<QuizCategory>('meteorology');

  // 1. Initial Local Storage Load
  useEffect(() => {
    const prefs = getUserPreferences();
    setSoundEnabled(prefs.soundEnabled);
    setTempUnit(prefs.tempUnit);
    setSpeedUnit(prefs.speedUnit);
    setPlayerName(prefs.defaultPlayerName);

    const savedLeaderboard = getLeaderboard();
    setLeaderboard(savedLeaderboard);

    const lastLoc = getLastSavedLocation();
    if (lastLoc && lastLoc.latitude && lastLoc.longitude) {
      setCurrentCity(lastLoc);
    }
  }, []);

  // 2. Fetch Weather from Public Open-Meteo REST API
  const loadWeather = useCallback(async (city: GeoLocationResult) => {
    setIsWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await fetchWeatherRestApi(city);
      setWeatherData(data);
      saveLastLocation(city);
    } catch (err: any) {
      console.error('Failed to load REST weather data:', err);
      setWeatherError(
        'Unable to fetch live REST weather data. Please check your internet connection and retry.'
      );
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  // Fetch when city changes
  useEffect(() => {
    loadWeather(currentCity);
  }, [currentCity, loadWeather]);

  // Geolocation quick handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const customLoc: GeoLocationResult = {
          id: Date.now(),
          name: 'My Location',
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
          country: 'Local GPS',
          timezone: 'auto',
        };
        setCurrentCity(customLoc);
      },
      (err) => {
        console.warn('Geolocation denied or failed:', err);
        setIsWeatherLoading(false);
      },
      { timeout: 8000 }
    );
  };

  // Preference update handlers
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    saveUserPreferences({ soundEnabled: next });
  };

  const handleToggleTempUnit = () => {
    const next = tempUnit === 'C' ? 'F' : 'C';
    setTempUnit(next);
    saveUserPreferences({ tempUnit: next });
  };

  const handleUpdatePlayerName = (name: string) => {
    setPlayerName(name);
    saveUserPreferences({ defaultPlayerName: name });
  };

  // Leaderboard handlers
  const handleSaveLeaderboardEntry = (entry: LeaderboardEntry) => {
    const updated = saveLeaderboardEntry(entry);
    setLeaderboard(updated);
  };

  const handleResetLeaderboard = () => {
    const defaults = resetLeaderboardToDefaults();
    setLeaderboard(defaults);
  };

  // Switch to Weather Quiz Challenge directly
  const handleStartWeatherQuiz = () => {
    setQuizCategoryTarget('meteorology');
    setActiveTab('quiz');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sticky Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        tempUnit={tempUnit}
        onToggleTempUnit={handleToggleTempUnit}
        playerName={playerName}
        onUpdatePlayerName={handleUpdatePlayerName}
        apiLatencyMs={weatherData?.fetchLatencyMs}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {/* =========================================================================
            TAB 1: DUAL-PULSE DASHBOARD (SPLIT VIEW COMBINING QUIZ & WEATHER)
           ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Contextual Weather-to-Quiz Synced Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span>Real-Time Weather &amp; Time Interactive Trivia</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    {weatherData
                      ? `Currently in ${weatherData.location.name}: ${weatherData.current.temperature}°C`
                      : 'Connecting to Public Open-Meteo REST API...'}
                  </h2>
                  <p className="mt-1 text-sm text-indigo-200 max-w-xl">
                    Experience live synchronous weather metrics directly from public REST endpoints while testing your knowledge against the timed countdown arena.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    id="btn-detect-gps"
                    onClick={handleDetectLocation}
                    disabled={isWeatherLoading}
                    className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition-all backdrop-blur-xs"
                  >
                    <Compass className="h-4 w-4 text-amber-300" />
                    <span>My Location GPS</span>
                  </button>

                  <button
                    id="btn-hero-launch-quiz"
                    onClick={() => setActiveTab('quiz')}
                    className="flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:scale-[1.02]"
                  >
                    <Zap className="h-4 w-4 fill-current text-amber-300" />
                    <span>Start Timed Quiz</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Split Grid: Left Weather Hub, Right Quiz Arena */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Live Weather Engine (5 cols on lg) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <CloudSun className="h-4 w-4 text-indigo-600" />
                    Live REST Weather Engine
                  </h3>
                  <button
                    onClick={() => setActiveTab('weather')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    Full Forecast <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <WeatherDashboard
                  weatherData={weatherData}
                  isLoading={isWeatherLoading}
                  error={weatherError}
                  onRefreshWeather={() => loadWeather(currentCity)}
                  onSelectCity={(city) => setCurrentCity(city)}
                  tempUnit={tempUnit}
                  speedUnit={speedUnit}
                  onStartWeatherQuiz={handleStartWeatherQuiz}
                />
              </div>

              {/* Right Column: Quiz Arena & Leaderboard Snapshot (6 cols on lg) */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Time Interactive Quiz Arena
                  </h3>
                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    Leaderboard ({leaderboard.length}) <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <QuizArena
                  playerName={playerName}
                  soundEnabled={soundEnabled}
                  onSaveLeaderboard={handleSaveLeaderboardEntry}
                  onViewLeaderboard={() => setActiveTab('leaderboard')}
                  initialCategory={quizCategoryTarget}
                />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: FULL-SCREEN QUIZ ARENA
           ========================================================================= */}
        {activeTab === 'quiz' && (
          <div className="py-2">
            <QuizArena
              playerName={playerName}
              soundEnabled={soundEnabled}
              onSaveLeaderboard={handleSaveLeaderboardEntry}
              onViewLeaderboard={() => setActiveTab('leaderboard')}
              initialCategory={quizCategoryTarget}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 3: FULL-SCREEN SYNCHRONOUS WEATHER DASHBOARD
           ========================================================================= */}
        {activeTab === 'weather' && (
          <div className="py-2 max-w-5xl mx-auto">
            <WeatherDashboard
              weatherData={weatherData}
              isLoading={isWeatherLoading}
              error={weatherError}
              onRefreshWeather={() => loadWeather(currentCity)}
              onSelectCity={(city) => setCurrentCity(city)}
              tempUnit={tempUnit}
              speedUnit={speedUnit}
              onStartWeatherQuiz={handleStartWeatherQuiz}
            />
          </div>
        )}

        {/* =========================================================================
            TAB 4: LOCAL STORAGE LEADERBOARD & ACHIEVEMENTS
           ========================================================================= */}
        {activeTab === 'leaderboard' && (
          <div className="py-2 max-w-5xl mx-auto">
            <LeaderboardView
              entries={leaderboard}
              currentPlayerName={playerName}
              onResetLeaderboard={handleResetLeaderboard}
              onStartQuiz={() => setActiveTab('quiz')}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white/80 py-4 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Timed Interactive Quiz with Local Storage &amp; Live Synchronous Weather Dashboard.
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Powered by Open-Meteo Public REST API</span>
            <span>•</span>
            <span>Zero API Key Required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
