import React, { useState, useEffect } from 'react';
import { fetchWeather } from '../services/api';
import { 
  Cloud, Sun, CloudRain, MapPin, RefreshCw, 
  Wind, Droplets, Thermometer, Eye, Sparkles 
} from 'lucide-react';

export function WeatherWidget({ city = 'Noida', onCityChange }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputCity, setInputCity] = useState(city);

  const loadWeather = async (targetCity) => {
    setLoading(true);
    try {
      const data = await fetchWeather(targetCity);
      setWeather(data);
    } catch (err) {
      console.error('Weather error:', err);
    } finally {
      setLoading(false);
    }
  };

  const QUICK_CITIES = ['Noida', 'Delhi', 'Mumbai', 'Goa', 'Bengaluru', 'London', 'Paris', 'New York', 'Antarctica'];

  useEffect(() => {
    loadWeather(city);
    setInputCity(city);
  }, [city]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const target = inputCity.trim();
    if (!target) return;
    onCityChange(target);
    loadWeather(target);
  };

  const handleQuickCity = (qc) => {
    setInputCity(qc);
    onCityChange(qc);
    loadWeather(qc);
  };

  return (
    <div className="space-y-3">
      {/* City Search Bar - Tight & Sleek */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <MapPin className="w-4 h-4 text-[#7C3AED] dark:text-[#A78BFA] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputCity}
            onChange={(e) => setInputCity(e.target.value)}
            onBlur={() => {
              if (inputCity.trim() && inputCity.trim() !== city) {
                handleSearch();
              }
            }}
            placeholder="Enter city (e.g. Goa, London, Antarctica)..."
            className="w-full pl-10 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#DDD6FE] dark:border-[#27272A] text-[#09090B] dark:text-white placeholder-[#A1A1AA] focus:outline-hidden focus:border-[#7C3AED]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-[#F5F3FF] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] text-xs sm:text-sm font-semibold hover:bg-[#7C3AED] hover:text-white dark:hover:bg-[#7C3AED] dark:hover:text-white transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Update'}
        </button>
      </form>

      {/* Quick City Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] uppercase font-extrabold text-[#71717A] dark:text-[#A1A1AA] tracking-wider mr-1">Quick:</span>
        {QUICK_CITIES.map((qc) => {
          const isActive = (city || '').toLowerCase() === qc.toLowerCase();
          return (
            <button
              key={qc}
              type="button"
              onClick={() => handleQuickCity(qc)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-2xs'
                  : 'bg-white dark:bg-[#121214] border-[#E9E7EF] dark:border-[#27272A] text-[#52525B] dark:text-[#A1A1AA] hover:border-[#DDD6FE] dark:hover:border-[#7C3AED] hover:text-[#7C3AED]'
              }`}
            >
              {qc}
            </button>
          );
        })}
      </div>

      {weather ? (
        <div className="space-y-2.5">
          {/* Main Weather Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0F0F12] border border-[#EDE9FE] dark:border-[#27272A] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] dark:bg-[#18181B] flex items-center justify-center text-[#7C3AED] shrink-0 shadow-2xs">
                {weather.condition?.toLowerCase().includes('rain') ? (
                  <CloudRain className="w-6 h-6 text-blue-500" />
                ) : weather.condition?.toLowerCase().includes('cloud') ? (
                  <Cloud className="w-6 h-6 text-slate-500" />
                ) : (
                  <Sun className="w-6 h-6 text-amber-500 animate-spin-slow" />
                )}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#09090B] dark:text-white tracking-tight">
                    {weather.temperature}°C
                  </span>
                  <span className="text-xs text-[#52525B] dark:text-[#A1A1AA] font-medium">
                    Feels {weather.feels_like}°C
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#7C3AED] dark:text-[#A78BFA]">
                  {weather.description || weather.condition} • {weather.city}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#F5F3FF] dark:bg-[#18181B] text-[#7C3AED] dark:text-[#C4B5FD] text-[11px] font-extrabold tracking-wide uppercase border border-[#DDD6FE]/60 dark:border-[#27272A]">
                {weather.season_tag || (weather.temperature > 28 ? 'Light Summer' : weather.temperature > 18 ? 'Mild Layering' : 'Warm Outerwear')}
              </span>
            </div>
          </div>

          {/* 4-Stat Live Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Humidity */}
            <div className="p-2.5 rounded-xl bg-[#FAFAF8] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block leading-none">Humidity</span>
                <span className="text-xs font-bold text-[#09090B] dark:text-white leading-tight">{weather.humidity}%</span>
              </div>
            </div>

            {/* Wind */}
            <div className="p-2.5 rounded-xl bg-[#FAFAF8] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Wind className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block leading-none">Wind Speed</span>
                <span className="text-xs font-bold text-[#09090B] dark:text-white leading-tight">{weather.wind_speed || 12} km/h</span>
              </div>
            </div>

            {/* Range */}
            <div className="p-2.5 rounded-xl bg-[#FAFAF8] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Thermometer className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block leading-none">High / Low</span>
                <span className="text-xs font-bold text-[#09090B] dark:text-white leading-tight">
                  {weather.temp_max || weather.temperature}° / {weather.temp_min || Math.round(weather.temperature - 5)}°
                </span>
              </div>
            </div>

            {/* Visibility */}
            <div className="p-2.5 rounded-xl bg-[#FAFAF8] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#71717A] dark:text-[#A1A1AA] block leading-none">Visibility</span>
                <span className="text-xs font-bold text-[#09090B] dark:text-white leading-tight">{weather.visibility_km || 10} km</span>
              </div>
            </div>
          </div>

          {/* AI Fashion & Fabric Advice Callout */}
          {(weather.styling_advice || weather.fabrics_recommended) && (
            <div className="p-3 rounded-2xl bg-[#FAF9FC] dark:bg-[#121214] border border-[#E9E7EF] dark:border-[#27272A] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#7C3AED] dark:text-[#A78BFA] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Styling Recommendation</span>
              </div>
              <p className="text-xs text-[#52525B] dark:text-[#D4D4D8] leading-relaxed">
                {weather.styling_advice}
              </p>
              {weather.fabrics_recommended && (
                <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  <span className="font-semibold text-[#09090B] dark:text-white">Recommended Fabrics:</span> {weather.fabrics_recommended}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-[#71717A] dark:text-[#A1A1AA] py-4 text-center">Loading weather metrics...</div>
      )}
    </div>
  );
}
