export type QuizCategory = 
  | 'meteorology'
  | 'geography'
  | 'science'
  | 'tech'
  | 'all';

export type QuizDifficulty = 'all' | 'easy' | 'medium' | 'hard';

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  funFact?: string;
  timeLimit: number; // in seconds (default 15)
}

export interface UserAnswerRecord {
  questionId: string;
  questionText: string;
  options: string[];
  selectedIndex: number | null; // null if timed out
  correctIndex: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  pointsEarned: number;
}

export interface QuizSessionStats {
  score: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  totalTimeSpent: number;
  maxStreak: number;
  category: QuizCategory;
  completedAt: string;
  badges: string[];
  history: UserAnswerRecord[];
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  accuracy: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  category: QuizCategory;
  categoryLabel: string;
  date: string;
  avatarSeed: string;
  badges: string[];
}

// Weather Types (Consuming Open-Meteo REST API)
export interface GeoLocationResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  country_code?: string;
  timezone: string;
}

export interface WeatherConditionInfo {
  code: number;
  label: string;
  description: string;
  iconName: string;
  bgGradient: string;
}

export interface CurrentWeatherState {
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  surfacePressure: number;
  isDay: boolean;
  uvIndex?: number;
  timestamp: string;
}

export interface HourlyForecastItem {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitationProbability: number;
}

export interface DailyForecastItem {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  uvIndexMax: number;
}

export interface WeatherDataResponse {
  location: GeoLocationResult;
  current: CurrentWeatherState;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  fetchLatencyMs: number;
  lastSyncedAt: string;
}

export type TempUnit = 'C' | 'F';
export type SpeedUnit = 'kmh' | 'mph';

export interface UserPreferences {
  soundEnabled: boolean;
  tempUnit: TempUnit;
  speedUnit: SpeedUnit;
  defaultPlayerName: string;
}
