import { LeaderboardEntry, QuizCategory, UserPreferences } from '../types';

const LEADERBOARD_KEY = 'quiz_pulse_leaderboard_v1';
const PREFERENCES_KEY = 'quiz_pulse_preferences_v1';
const RECENT_LOCATION_KEY = 'quiz_pulse_last_location_v1';

// Benchmark default entries so leaderboard isn't an empty void
const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    playerName: 'StormChaser_Alex',
    score: 980,
    accuracy: 100,
    correctAnswers: 6,
    totalQuestions: 6,
    timeSpentSeconds: 32,
    category: 'meteorology',
    categoryLabel: 'Weather & Climate',
    date: 'Today, 03:15 PM',
    avatarSeed: 'Alex',
    badges: ['Flawless Run', 'Speed Demon', 'Weather Guru'],
  },
  {
    id: 'seed-2',
    playerName: 'DataDynamo',
    score: 840,
    accuracy: 83,
    correctAnswers: 5,
    totalQuestions: 6,
    timeSpentSeconds: 38,
    category: 'tech',
    categoryLabel: 'APIs & Computing',
    date: 'Yesterday',
    avatarSeed: 'Dana',
    badges: ['Tech Savvy', 'Streak Master'],
  },
  {
    id: 'seed-3',
    playerName: 'AtlasExplorer',
    score: 790,
    accuracy: 80,
    correctAnswers: 4,
    totalQuestions: 5,
    timeSpentSeconds: 42,
    category: 'geography',
    categoryLabel: 'World Geography',
    date: '2 days ago',
    avatarSeed: 'Atlas',
    badges: ['Globe Trotter'],
  },
  {
    id: 'seed-4',
    playerName: 'CuriousNova',
    score: 650,
    accuracy: 75,
    correctAnswers: 3,
    totalQuestions: 4,
    timeSpentSeconds: 46,
    category: 'science',
    categoryLabel: 'Physics & Nature',
    date: '3 days ago',
    avatarSeed: 'Nova',
    badges: ['Science Spark'],
  },
];

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
      return DEFAULT_LEADERBOARD;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.sort((a, b) => b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds);
    }
    return DEFAULT_LEADERBOARD;
  } catch (err) {
    console.error('Failed reading leaderboard from localStorage:', err);
    return DEFAULT_LEADERBOARD;
  }
}

export function saveLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  try {
    const current = getLeaderboard();
    const updated = [entry, ...current]
      .sort((a, b) => b.score - a.score || a.timeSpentSeconds - b.timeSpentSeconds)
      .slice(0, 50); // Keep top 50

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed saving leaderboard entry:', err);
    return [];
  }
}

export function resetLeaderboardToDefaults(): LeaderboardEntry[] {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(DEFAULT_LEADERBOARD));
    return DEFAULT_LEADERBOARD;
  } catch (err) {
    console.error('Failed resetting leaderboard:', err);
    return DEFAULT_LEADERBOARD;
  }
}

export function getUserPreferences(): UserPreferences {
  const defaultPrefs: UserPreferences = {
    soundEnabled: true,
    tempUnit: 'C',
    speedUnit: 'kmh',
    defaultPlayerName: 'Player_1',
  };

  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch (err) {
    return defaultPrefs;
  }
}

export function saveUserPreferences(prefs: Partial<UserPreferences>): UserPreferences {
  try {
    const current = getUserPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed saving user preferences:', err);
    return getUserPreferences();
  }
}

export function getLastSavedLocation(): any | null {
  try {
    const raw = localStorage.getItem(RECENT_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLastLocation(location: any) {
  try {
    localStorage.setItem(RECENT_LOCATION_KEY, JSON.stringify(location));
  } catch (err) {
    console.error('Failed saving last location:', err);
  }
}
