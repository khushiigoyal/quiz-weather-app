import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  RefreshCw,
  Wind,
  Droplets,
  Gauge,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  Snowflake,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  Moon,
  Compass,
  ArrowUpRight,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  GeoLocationResult,
  WeatherDataResponse,
  TempUnit,
  SpeedUnit,
} from '../types';
import {
  POPULAR_CITIES,
  getWeatherConditionInfo,
  searchCitiesRestApi,
  fetchWeatherRestApi,
  convertTemp,
  convertSpeed,
  getWindDirectionLabel,
} from '../services/weatherService';

interface WeatherDashboardProps {
  weatherData: WeatherDataResponse | null;
  isLoading: boolean;
  error: string | null;
  onRefreshWeather: () => void;
  onSelectCity: (city: GeoLocationResult) => void;
  tempUnit: TempUnit;
  speedUnit: SpeedUnit;
  onStartWeatherQuiz?: () => void;
}

export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  weatherData,
  isLoading,
  error,
  onRefreshWeather,
  onSelectCity,
  tempUnit,
  speedUnit,
  onStartWeatherQuiz,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeoLocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search on public geocoding REST API
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchCitiesRestApi(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
        setShowDropdown(true);
      }, 350);
    } else {
      setSearchResults([]);
      setIsSearching(false);
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  // Click outside listener for search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = (city: GeoLocationResult) => {
    onSelectCity(city);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Helper to render weather icon
  const renderWeatherIcon = (iconName: string, className: string = 'h-6 w-6') => {
    switch (iconName) {
      case 'Sun':
        return <Sun className={`${className} text-amber-400`} />;
      case 'Moon':
        return <Moon className={`${className} text-indigo-200`} />;
      case 'CloudSun':
        return <CloudSun className={`${className} text-amber-300`} />;
      case 'Cloud':
        return <Cloud className={`${className} text-slate-300`} />;
      case 'CloudRain':
        return <CloudRain className={`${className} text-blue-400`} />;
      case 'CloudDrizzle':
        return <CloudDrizzle className={`${className} text-cyan-300`} />;
      case 'Snowflake':
        return <Snowflake className={`${className} text-sky-200`} />;
      case 'CloudLightning':
        return <CloudLightning className={`${className} text-yellow-300`} />;
      case 'CloudFog':
        return <CloudFog className={`${className} text-slate-300`} />;
      default:
        return <Cloud className={`${className} text-slate-300`} />;
    }
  };

  const condition = weatherData
    ? getWeatherConditionInfo(weatherData.current.weatherCode, weatherData.current.isDay)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Controls: Search Bar & Preset Quick-Select Cities */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Live REST Search Bar */}
          <div className="relative flex-1" ref={dropdownRef}>
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                id="input-weather-search"
                type="text"
                placeholder="Search any global city (REST API geocoding)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              {isSearching && (
                <div className="absolute right-3.5">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                </div>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {searchResults.map((city) => (
                  <button
                    key={`${city.id}-${city.name}`}
                    onClick={() => handleCitySelect(city)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-800">{city.name}</span>
                      {city.admin1 && (
                        <span className="text-xs text-slate-500">, {city.admin1}</span>
                      )}
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {city.country}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sync Button */}
          <button
            id="btn-sync-weather"
            onClick={onRefreshWeather}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Sync Live'}</span>
          </button>
        </div>

        {/* Quick Popular Cities Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="font-medium text-slate-400 shrink-0">Popular:</span>
          {POPULAR_CITIES.map((city) => {
            const isCurrent = weatherData?.location.name === city.name;
            return (
              <button
                key={city.id}
                onClick={() => onSelectCity(city)}
                className={`rounded-lg px-2.5 py-1 font-medium transition-colors shrink-0 ${
                  isCurrent
                    ? 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-400'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {city.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Synchronous REST API Status Bar */}
      {weatherData && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-700">Open-Meteo REST API</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono">Latency: {weatherData.fetchLatencyMs}ms</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>Synchronized at {weatherData.lastSyncedAt}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Weather Card */}
      {weatherData && condition && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          {/* Hero Banner with Dynamic Gradient & Weather State */}
          <div
            className={`relative p-6 sm:p-8 text-white bg-gradient-to-r ${condition.bgGradient}`}
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-white/90 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-semibold tracking-wide uppercase">
                    {weatherData.location.name}
                    {weatherData.location.country && `, ${weatherData.location.country}`}
                  </span>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl sm:text-6xl font-extrabold tracking-tight">
                    {convertTemp(weatherData.current.temperature, tempUnit)}°{tempUnit}
                  </span>
                  <div className="text-sm text-white/80">
                    <div>Feels like {convertTemp(weatherData.current.apparentTemperature, tempUnit)}°</div>
                    <div>
                      H: {convertTemp(weatherData.daily[0]?.tempMax ?? weatherData.current.temperature, tempUnit)}° • 
                      L: {convertTemp(weatherData.daily[0]?.tempMin ?? weatherData.current.temperature, tempUnit)}°
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-sm font-semibold">
                    {condition.label}
                  </span>
                  <span className="text-xs text-white/80">{condition.description}</span>
                </div>
              </div>

              {/* Weather Graphic */}
              <div className="flex flex-col items-center justify-center self-start md:self-auto rounded-2xl bg-white/10 p-4 backdrop-blur-xs border border-white/20">
                {renderWeatherIcon(condition.iconName, 'h-16 w-16')}
                <span className="mt-2 text-xs font-semibold text-white/90 capitalize">
                  {condition.label}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Atmospheric Telemetry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 sm:p-6 bg-slate-50 border-t border-slate-100">
            {/* Humidity */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Humidity</span>
                <Droplets className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-xl font-bold text-slate-800">
                {weatherData.current.relativeHumidity}%
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {weatherData.current.relativeHumidity > 70
                  ? 'High humidity'
                  : weatherData.current.relativeHumidity < 35
                  ? 'Dry atmosphere'
                  : 'Normal comfort'}
              </p>
            </div>

            {/* Wind */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Wind</span>
                <Wind className="h-4 w-4 text-teal-500" />
              </div>
              <div className="text-xl font-bold text-slate-800">
                {convertSpeed(weatherData.current.windSpeed, speedUnit)}{' '}
                <span className="text-xs font-normal text-slate-500">{speedUnit}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                <Compass className="h-3 w-3" />
                {getWindDirectionLabel(weatherData.current.windDirection)} ({weatherData.current.windDirection}°)
              </p>
            </div>

            {/* Pressure */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">Air Pressure</span>
                <Gauge className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-xl font-bold text-slate-800">
                {Math.round(weatherData.current.surfacePressure)} <span className="text-xs font-normal text-slate-500">hPa</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {weatherData.current.surfacePressure > 1013 ? 'High pressure (fair)' : 'Low pressure (active)'}
              </p>
            </div>

            {/* UV Index / Precipitation */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-semibold">UV Index</span>
                <Sun className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-xl font-bold text-slate-800">
                {weatherData.current.uvIndex?.toFixed(1) ?? '3.5'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {(weatherData.current.uvIndex ?? 3.5) > 6
                  ? 'High radiation (protect eyes)'
                  : 'Moderate index'}
              </p>
            </div>
          </div>

          {/* 24-Hour Forecast Scrollable Strip */}
          <div className="border-t border-slate-200 p-5 sm:p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              Next 24 Hours Synchronous Forecast
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {weatherData.hourly.map((hour, idx) => {
                const hourTime = new Date(hour.time).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                const cond = getWeatherConditionInfo(hour.weatherCode, true);
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-3 min-w-[80px] text-center hover:bg-slate-100/80 transition-colors shrink-0"
                  >
                    <span className="text-[11px] font-medium text-slate-500">
                      {idx === 0 ? 'Now' : hourTime}
                    </span>
                    <div className="my-2">
                      {renderWeatherIcon(cond.iconName, 'h-6 w-6')}
                    </div>
                    <span className="text-sm font-bold text-slate-800">
                      {convertTemp(hour.temperature, tempUnit)}°
                    </span>
                    {hour.precipitationProbability > 0 && (
                      <span className="mt-1 rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700">
                        {hour.precipitationProbability}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7-Day Outlook */}
          <div className="border-t border-slate-200 p-5 sm:p-6 bg-slate-50/40">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              7-Day Synoptic Outlook
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {weatherData.daily.slice(0, 7).map((day, idx) => {
                const dayDate = new Date(day.date);
                const dayName =
                  idx === 0
                    ? 'Today'
                    : idx === 1
                    ? 'Tomorrow'
                    : dayDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                const cond = getWeatherConditionInfo(day.weatherCode, true);

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      {renderWeatherIcon(cond.iconName, 'h-5 w-5')}
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{dayName}</div>
                        <div className="text-[11px] text-slate-500">{cond.label}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800">
                        {convertTemp(day.tempMax, tempUnit)}°
                        <span className="ml-1 text-slate-400 font-normal">
                          {convertTemp(day.tempMin, tempUnit)}°
                        </span>
                      </div>
                      {day.precipitationProbability > 0 && (
                        <div className="text-[10px] font-medium text-blue-600">
                          {day.precipitationProbability}% rain
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Trivia Link Banner */}
      {onStartWeatherQuiz && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-indigo-50 p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shrink-0 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Weather &amp; Atmospheric Science Trivia Challenge
              </h4>
              <p className="text-xs text-slate-600">
                Test your meteorological instincts with timed questions on barometers, clouds, and storms.
              </p>
            </div>
          </div>
          <button
            id="btn-trigger-weather-quiz"
            onClick={onStartWeatherQuiz}
            className="flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2 text-xs font-bold text-white hover:bg-sky-800 transition-colors shadow-xs shrink-0"
          >
            <Zap className="h-4 w-4 text-amber-300" />
            <span>Play Weather Quiz</span>
          </button>
        </div>
      )}
    </div>
  );
};
