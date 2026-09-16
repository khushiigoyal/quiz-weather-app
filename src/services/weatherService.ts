import {
  GeoLocationResult,
  WeatherDataResponse,
  WeatherConditionInfo,
  CurrentWeatherState,
  HourlyForecastItem,
  DailyForecastItem,
} from '../types';

// Pre-defined quick cities with coordinates for instant loading or offline fallback
export const POPULAR_CITIES: GeoLocationResult[] = [
  {
    id: 1850147,
    name: 'Tokyo',
    latitude: 35.6895,
    longitude: 139.6917,
    country: 'Japan',
    admin1: 'Tokyo',
    country_code: 'JP',
    timezone: 'Asia/Tokyo',
  },
  {
    id: 2643743,
    name: 'London',
    latitude: 51.5085,
    longitude: -0.1257,
    country: 'United Kingdom',
    admin1: 'England',
    country_code: 'GB',
    timezone: 'Europe/London',
  },
  {
    id: 5128581,
    name: 'New York',
    latitude: 40.7143,
    longitude: -74.006,
    country: 'United States',
    admin1: 'New York',
    country_code: 'US',
    timezone: 'America/New_York',
  },
  {
    id: 2988507,
    name: 'Paris',
    latitude: 48.8534,
    longitude: 2.3488,
    country: 'France',
    admin1: 'Île-de-France',
    country_code: 'FR',
    timezone: 'Europe/Paris',
  },
  {
    id: 2147714,
    name: 'Sydney',
    latitude: -33.8678,
    longitude: 151.2073,
    country: 'Australia',
    admin1: 'New South Wales',
    country_code: 'AU',
    timezone: 'Australia/Sydney',
  },
  {
    id: 360630,
    name: 'Cairo',
    latitude: 30.0626,
    longitude: 31.2497,
    country: 'Egypt',
    admin1: 'Cairo',
    country_code: 'EG',
    timezone: 'Africa/Cairo',
  },
];

// WMO Weather interpretation code mapping
export function getWeatherConditionInfo(code: number, isDay: boolean = true): WeatherConditionInfo {
  switch (code) {
    case 0:
      return {
        code,
        label: isDay ? 'Clear Sky' : 'Clear Night',
        description: 'Bright and cloudless atmospheric conditions.',
        iconName: isDay ? 'Sun' : 'Moon',
        bgGradient: isDay
          ? 'from-sky-400 to-blue-600'
          : 'from-slate-900 to-indigo-950',
      };
    case 1:
      return {
        code,
        label: 'Mainly Clear',
        description: 'Scattered thin cirrus clouds with abundant sunlight.',
        iconName: isDay ? 'SunMedium' : 'MoonStar',
        bgGradient: isDay
          ? 'from-sky-500 to-blue-600'
          : 'from-slate-800 to-indigo-900',
      };
    case 2:
      return {
        code,
        label: 'Partly Cloudy',
        description: 'Intermittent fair-weather cumulus clouds.',
        iconName: 'CloudSun',
        bgGradient: 'from-blue-500 to-slate-600',
      };
    case 3:
      return {
        code,
        label: 'Overcast',
        description: 'Continuous solid cloud cover obstructing direct solar radiation.',
        iconName: 'Cloud',
        bgGradient: 'from-slate-600 to-slate-800',
      };
    case 45:
    case 48:
      return {
        code,
        label: 'Fog / Mist',
        description: 'Suspended water droplets reducing surface visibility.',
        iconName: 'CloudFog',
        bgGradient: 'from-slate-500 to-zinc-700',
      };
    case 51:
    case 53:
    case 55:
      return {
        code,
        label: 'Drizzle',
        description: 'Uniform light droplets under 0.5 mm in diameter.',
        iconName: 'CloudDrizzle',
        bgGradient: 'from-cyan-600 to-slate-700',
      };
    case 61:
    case 63:
    case 65:
      return {
        code,
        label: 'Rainfall',
        description: 'Atmospheric condensation precipitated as liquid water.',
        iconName: 'CloudRain',
        bgGradient: 'from-blue-700 to-indigo-900',
      };
    case 71:
    case 73:
    case 75:
      return {
        code,
        label: 'Snowfall',
        description: 'Crystalline water ice falling from upper cloud layers.',
        iconName: 'Snowflake',
        bgGradient: 'from-slate-400 to-sky-700',
      };
    case 80:
    case 81:
    case 82:
      return {
        code,
        label: 'Rain Showers',
        description: 'Rapid onset and termination of convective rain.',
        iconName: 'CloudRainWind',
        bgGradient: 'from-blue-600 to-slate-900',
      };
    case 95:
    case 96:
    case 99:
      return {
        code,
        label: 'Thunderstorm',
        description: 'Deep convection with electrical lightning discharges.',
        iconName: 'CloudLightning',
        bgGradient: 'from-purple-900 via-slate-900 to-black',
      };
    default:
      return {
        code,
        label: 'Moderate Conditions',
        description: 'Typical temperate atmospheric state.',
        iconName: 'Cloud',
        bgGradient: 'from-blue-500 to-slate-700',
      };
  }
}

// REST API Geocoding search (public, no key required)
export async function searchCitiesRestApi(query: string): Promise<GeoLocationResult[]> {
  if (!query || query.trim().length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query.trim()
  )}&count=6&language=en&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geocoding HTTP error: ${response.status}`);
    }
    const data = await response.json();
    return data.results || [];
  } catch (err) {
    console.error('REST API city search failed:', err);
    return [];
  }
}

// REST API Weather Forecast (public, no key required)
export async function fetchWeatherRestApi(
  location: GeoLocationResult
): Promise<WeatherDataResponse> {
  const startTime = performance.now();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather REST API responded with status ${response.status}`);
  }

  const data = await response.json();
  const endTime = performance.now();
  const fetchLatencyMs = Math.round(endTime - startTime);

  // Parse current weather
  const current: CurrentWeatherState = {
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    relativeHumidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    weatherCode: data.current.weather_code,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    surfacePressure: data.current.surface_pressure,
    isDay: Boolean(data.current.is_day),
    uvIndex: data.daily?.uv_index_max?.[0] || 4.2,
    timestamp: data.current.time,
  };

  // Parse next 24 hours
  const hourly: HourlyForecastItem[] = [];
  if (data.hourly && data.hourly.time) {
    // Take the next 24 hourly steps starting around current hour
    const nowIso = new Date().toISOString().slice(0, 13);
    let startIndex = data.hourly.time.findIndex((t: string) => t.startsWith(nowIso));
    if (startIndex < 0) startIndex = 0;

    const sliceTimes = data.hourly.time.slice(startIndex, startIndex + 24);
    for (let i = 0; i < sliceTimes.length; i++) {
      const idx = startIndex + i;
      hourly.push({
        time: sliceTimes[i],
        temperature: data.hourly.temperature_2m[idx],
        weatherCode: data.hourly.weather_code[idx],
        precipitationProbability: data.hourly.precipitation_probability?.[idx] ?? 0,
      });
    }
  }

  // Parse 7-day daily forecast
  const daily: DailyForecastItem[] = [];
  if (data.daily && data.daily.time) {
    for (let i = 0; i < data.daily.time.length; i++) {
      daily.push({
        date: data.daily.time[i],
        weatherCode: data.daily.weather_code[i],
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        precipitationProbability: data.daily.precipitation_probability_max?.[i] ?? 0,
        uvIndexMax: data.daily.uv_index_max?.[i] ?? 0,
      });
    }
  }

  return {
    location,
    current,
    hourly,
    daily,
    fetchLatencyMs,
    lastSyncedAt: new Date().toLocaleTimeString(),
  };
}

// Unit conversion helpers
export function convertTemp(celsius: number, unit: 'C' | 'F'): number {
  if (unit === 'F') {
    return Math.round((celsius * 9) / 5 + 32);
  }
  return Math.round(celsius * 10) / 10;
}

export function convertSpeed(kmh: number, unit: 'kmh' | 'mph'): number {
  if (unit === 'mph') {
    return Math.round(kmh * 0.621371);
  }
  return Math.round(kmh);
}

export function getWindDirectionLabel(deg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}
