/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  Moon, 
  Zap, 
  Activity, 
  Sparkles, 
  Calendar, 
  Cpu, 
  FileSpreadsheet, 
  Radio, 
  ShieldAlert, 
  RefreshCw, 
  HelpCircle,
  TrendingUp,
  Award,
  Smartphone,
  Download,
  Settings,
  Sliders
} from 'lucide-react';
import { motion } from 'motion/react';

// Modules
import { generateMockOuraData } from './mockData';
import { OuraDayData, OuraMetricsSummary } from './types';
import UploadZone from './components/UploadZone';
import MetricCard from './components/MetricCard';
import TrendCharts from './components/TrendCharts';
import AICoach from './components/AICoach';
import { BiometricInsights } from './components/BiometricInsights';

export default function App() {
  // PWA Install prompt handling
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // Primary tracking state
  const [ouraData, setOuraData] = useState<OuraDayData[]>(() => {
    try {
      const cached = localStorage.getItem('oura_synced_data');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Error hydrating Oura data index:', e);
    }
    return generateMockOuraData();
  });
  const [isCustomDataLoaded, setIsCustomDataLoaded] = useState(() => {
    return localStorage.getItem('oura_synced_data') !== null;
  });
  const [loadedFileName, setLoadedFileName] = useState(() => {
    return localStorage.getItem('oura_synced_filename') || '';
  });

  // Settings panel active client-side configuration states
  const [showSettings, setShowSettings] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => {
    try {
      return localStorage.getItem('gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [ouraPatInput, setOuraPatInput] = useState(() => {
    try {
      return localStorage.getItem('oura_access_token') || '';
    } catch {
      return '';
    }
  });

  // Handle uploader data inputs
  const handleDataParsed = (newData: OuraDayData[], fileName: string) => {
    setOuraData(newData);
    setIsCustomDataLoaded(true);
    setLoadedFileName(fileName);
  };

  // Restore relative simulated high-performance biometric series
  const handleRestoreDemo = () => {
    try {
      localStorage.removeItem('oura_synced_data');
      localStorage.removeItem('oura_synced_filename');
    } catch (e) {
      console.error(e);
    }
    setOuraData(generateMockOuraData());
    setIsCustomDataLoaded(false);
    setLoadedFileName('');
  };

  // Quick biometrics modifiers for playground testing
  const applyHealthySimulation = () => {
    const original = generateMockOuraData();
    const elevated = original.map(day => ({
      ...day,
      sleepScore: Math.min(100, Math.round(day.sleepScore * 1.08)),
      readinessScore: Math.min(100, Math.round(day.readinessScore * 1.06)),
      totalSleep: Math.round(day.totalSleep + 45), // add 45m of rest
      deepSleep: Math.round(day.deepSleep * 1.2), // amplify deeper sleep
      avgHrv: Math.round(day.avgHrv + 12), // better heart rate variability
      lowestHeartRate: Math.max(35, day.lowestHeartRate - 3), // lower heart rate
      temperatureDeviation: -0.2, // nice and cool
    }));
    setOuraData(elevated);
    setIsCustomDataLoaded(true);
    setLoadedFileName('Simulated Peak Athletic Training');
  };

  const applyStressSimulation = () => {
    const original = generateMockOuraData();
    const fatigued = original.map(day => ({
      ...day,
      sleepScore: Math.max(45, Math.round(day.sleepScore * 0.78)),
      readinessScore: Math.max(40, Math.round(day.readinessScore * 0.72)),
      totalSleep: Math.round(day.totalSleep - 60), // sleep deprivation
      deepSleep: Math.round(day.deepSleep * 0.7),
      avgHrv: Math.round(day.avgHrv * 0.75), // suppressed HRV
      lowestHeartRate: Math.min(80, day.lowestHeartRate + 8), // elevated heart rate
      temperatureDeviation: 0.5, // fever/stress response
      steps: Math.min(5000, day.steps), // sedentary fatigue
    }));
    setOuraData(fatigued);
    setIsCustomDataLoaded(true);
    setLoadedFileName('Simulated Systemic Burnout & Travel jetlag');
  };

  // Calculate dynamic average summary stats across our telemetry range
  const summary = useMemo<OuraMetricsSummary>(() => {
    if (ouraData.length === 0) {
      return {
        avgSleepScore: 0,
        avgReadinessScore: 0,
        avgActivityScore: 0,
        avgLowestHeartRate: 0,
        avgHrv: 0,
        avgSteps: 0,
        totalSteps: 0,
        avgSleepDuration: 0,
      };
    }

    const count = ouraData.length;
    let sleepSum = 0;
    let readySum = 0;
    let actSum = 0;
    let lowHrSum = 0;
    let hrvSum = 0;
    let stepsSum = 0;
    let sleepDurationSum = 0;

    ouraData.forEach((day) => {
      sleepSum += day.sleepScore;
      readySum += day.readinessScore;
      actSum += day.activityScore;
      lowHrSum += day.lowestHeartRate;
      hrvSum += day.avgHrv;
      stepsSum += day.steps;
      sleepDurationSum += day.totalSleep;
    });

    return {
      avgSleepScore: Math.round(sleepSum / count),
      avgReadinessScore: Math.round(readySum / count),
      avgActivityScore: Math.round(actSum / count),
      avgLowestHeartRate: Math.round((lowHrSum / count) * 10) / 10,
      avgHrv: Math.round(hrvSum / count),
      avgSteps: Math.round(stepsSum / count),
      totalSteps: stepsSum,
      avgSleepDuration: Math.round(sleepDurationSum / count),
    };
  }, [ouraData]);

  // Convert minutes of sleep to "Xh Ym" for display
  const formatDurationHours = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${hrs}h ${m}m`;
  };

  // Calculate percentages for sleep stages relative to total sleep duration
  const sleepBreakdownPercentages = useMemo(() => {
    if (ouraData.length === 0) return { deepPct: 0, remPct: 0, lightPct: 0 };
    const latestDay = ouraData[ouraData.length - 1];
    const total = latestDay.totalSleep || 1;
    return {
      deepPct: Math.round((latestDay.deepSleep / total) * 100),
      remPct: Math.round((latestDay.remSleep / total) * 100),
      lightPct: Math.round((latestDay.lightSleep / total) * 100),
    };
  }, [ouraData]);

  const latestStats = useMemo(() => {
    if (ouraData.length === 0) return null;
    return ouraData[ouraData.length - 1];
  }, [ouraData]);

  const dateRangeString = useMemo(() => {
    if (ouraData.length === 0) return 'No dates available';
    const first = ouraData[0].date;
    const last = ouraData[ouraData.length - 1].date;
    const firstFormatted = new Date(first).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const lastFormatted = new Date(last).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
    return `${firstFormatted} - ${lastFormatted}`;
  }, [ouraData]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      {/* Container wrapper for responsiveness */}
      <div id="oura_app_root" className="w-full max-w-7xl flex flex-col gap-6">
        
        {/* Obsidian Header Module */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-orange-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            </div>
            <div>
              <h1 className="text-xl font-sans font-bold tracking-tight uppercase text-zinc-100 flex items-center gap-2">
                Синхронизация Биометрии <span className="text-zinc-500 font-normal text-xs lowercase font-mono">v2.4</span>
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-orange-500" />
                Активный трекер: 
                <span className="font-mono text-orange-400 bg-orange-950/20 border border-orange-900/40 px-1.5 py-0.2 rounded text-[9px] uppercase font-bold">
                  {isCustomDataLoaded ? 'Ваши данные Oura' : 'Симулятор: Активно'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick playground presets to help verify metrics changes */}
            {!isCustomDataLoaded && (
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 border border-zinc-800/80 rounded-xl pr-2.5">
                <span className="text-[9px] font-mono font-bold uppercase text-zinc-500 pl-2">Профили биометрии:</span>
                <button
                  onClick={applyHealthySimulation}
                  className="text-[10px] bg-orange-950/20 text-orange-400 hover:bg-orange-950/40 px-2.5 py-1 rounded transition border border-orange-900/40 font-medium"
                  id="simulate_healthy"
                >
                  Пиковое восстановление
                </button>
                <button
                  onClick={applyStressSimulation}
                  className="text-[10px] bg-red-950/20 text-red-400 hover:bg-red-950/40 px-2.5 py-1 rounded transition border border-red-900/30 font-medium"
                  id="simulate_stressed"
                >
                  Сильное выгорание
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl text-zinc-400 font-mono">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              {dateRangeString}
            </div>

            {/* API Settings toggle button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 text-xs bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 font-medium px-3.5 py-1.5 rounded-xl cursor-pointer transition hover:scale-[1.02] active:scale-[0.98]"
              id="api_settings_trigger"
            >
              <Settings className={`w-3.5 h-3.5 text-orange-400 ${showSettings ? 'rotate-90' : ''} transition-transform duration-300`} />
              Настройки API (GitHub)
            </button>

            {isInstallable && (
              <button
                onClick={triggerInstall}
                className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-medium px-3.5 py-1.5 rounded-xl border border-orange-500/25 shadow-md shadow-orange-950/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition"
              >
                <Award className="w-3.5 h-3.5 text-orange-200" />
                Установить как Web App
              </button>
            )}
          </div>
        </header>

        {/* API Settings Module (for GitHub Pages & Standalone Client mode) */}
        {showSettings && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-100 font-sans">Настройки подключения (GitHub Pages / Standalone)</h2>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition uppercase font-mono"
              >
                Закрыть [×]
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
              Это приложение полностью совместимо с бесплатным экспортом на <strong className="text-zinc-250 font-medium">GitHub Pages</strong>. 
              Если вы запускаете его без сервера, вы можете использовать ваши персональные API-ключи Oura и Google Gemini. Все ваши ключи и показатели сохраняются локально в вашем браузере (localStorage) и передаются напрямую к API Oura/Google.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-1">
              {/* Google Gemini API Key Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  Персональный Ключ Gemini API
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AI Studio API Key (AI-советник)"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-orange-500/50 flex-1 font-mono"
                  />
                  <button
                    onClick={() => {
                      localStorage.setItem('gemini_api_key', geminiKeyInput.trim());
                      alert('Ключ Gemini сохранен локально!');
                    }}
                    className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg border border-orange-500/20 active:scale-[0.98] transition"
                  >
                    Сохранить
                  </button>
                </div>
                <p className="text-[9px] text-zinc-500 leading-normal">
                  Получите бесплатный ключ за 1 минуту в личном кабинете <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline inline-flex items-center gap-0.5">Google AI Studio</a>.
                </p>
              </div>

              {/* Oura Personal Access Token Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-orange-500" />
                  Персональный Токен Oura (PAT)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Oura Personal Access Token"
                    value={ouraPatInput}
                    onChange={(e) => setOuraPatInput(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-orange-500/50 flex-1 font-mono"
                  />
                  <button
                    onClick={() => {
                      const pat = ouraPatInput.trim();
                      if (pat) {
                        localStorage.setItem('oura_access_token', pat);
                        alert('Личный токен Oura сохранен! Вы можете запустить синхронизацию у uploader.');
                        window.location.reload();
                      } else {
                        localStorage.removeItem('oura_access_token');
                        alert('Токен Oura удален из локальной памяти.');
                        window.location.reload();
                      }
                    }}
                    className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-4 py-1.5 rounded-lg border border-orange-500/20 active:scale-[0.98] transition"
                  >
                    Сохранить
                  </button>
                </div>
                <p className="text-[9px] text-zinc-500 leading-normal">
                  Получите личный токен в кабинете на <a href="https://cloud.ouraring.com/personal-access-tokens" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline inline-flex items-center gap-0.5">Oura Cloud Developer Console</a>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Demo data alert callout */}
        {!isCustomDataLoaded && (
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-lg">
            <div className="flex gap-2.5 items-start">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300 font-light leading-relaxed">
                <span className="font-semibold text-zinc-100">Используется демо-телеметрия высокой точности.</span> Хотите увидеть реальные показатели сна и сердечной активности? Войдите в Oura Cloud или загрузите файлы данных ниже!
              </div>
            </div>
            <a
              href="#oura_uploader"
              className="text-xs text-orange-400 hover:text-orange-300 underline font-semibold shrink-0 transition"
            >
              Перейти к загрузке ↓
            </a>
          </div>
        )}

        {/* Primary Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (span 8): Biometrics bento-box & charts */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Bento-grid of Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Sleep Architecture */}
              <MetricCard
                id="sleep"
                title="Качество сна"
                value={summary.avgSleepScore}
                unit="/100"
                subtitle={`Ср. продолжит.: ${formatDurationHours(summary.avgSleepDuration)}`}
                icon={Moon}
                status={summary.avgSleepScore >= 85 ? 'optimal' : summary.avgSleepScore >= 70 ? 'good' : 'warning'}
                colorClass="bg-indigo-500"
                percentage={summary.avgSleepScore}
                trendText="Оптимальное восстановление"
                subMetrics={[
                  { 
                    label: 'Глубокий сон', 
                    val: formatDurationHours(latestStats?.deepSleep || 100), 
                    percentage: sleepBreakdownPercentages.deepPct 
                  },
                  { 
                    label: 'Быстрый сон (REM)', 
                    val: formatDurationHours(latestStats?.remSleep || 100), 
                    percentage: sleepBreakdownPercentages.remPct 
                  },
                  { 
                    label: 'Время бодрствования', 
                    val: `${latestStats?.awakeTime || 40} мин`, 
                    percentage: Math.round(((latestStats?.awakeTime || 40) / (latestStats?.totalSleep || 1)) * 105)
                  }
                ]}
              />

              {/* Card 2: Cardiovascular Health */}
              <MetricCard
                id="cardio"
                title="Восстановление сердца"
                value={summary.avgHrv}
                unit="мс"
                subtitle={`Мин. пульс ночью: ${summary.avgLowestHeartRate} уд/мин`}
                icon={Heart}
                status={summary.avgHrv >= 75 ? 'optimal' : summary.avgHrv >= 55 ? 'good' : 'warning'}
                colorClass="bg-orange-500"
                percentage={Math.min(100, Math.round((summary.avgHrv / 100) * 100))}
                trendText="Баланс HRV"
                subMetrics={[
                  { 
                    label: 'Средний пульс ночью', 
                    val: `${latestStats?.avgHeartRate || 54} уд/мин` 
                  },
                  { 
                    label: 'Минимальный пульс покоя', 
                    val: `${latestStats?.lowestHeartRate || 45} уд/мин` 
                  },
                  { 
                    label: 'Средняя вариабельность (HRV)', 
                    val: `${summary.avgHrv} мс` 
                  }
                ]}
              />

              {/* Card 3: Readiness Score */}
              <MetricCard
                id="readiness"
                title="Индекс готовности"
                value={summary.avgReadinessScore}
                unit="/100"
                subtitle="Биологический потенциал организма"
                icon={Zap}
                status={summary.avgReadinessScore >= 85 ? 'optimal' : summary.avgReadinessScore >= 70 ? 'good' : 'warning'}
                colorClass="bg-orange-600"
                percentage={summary.avgReadinessScore}
                trendText="Готовность систем"
                subMetrics={[
                  { 
                    label: 'Отклонение температуры кожи', 
                    val: `${latestStats?.temperatureDeviation !== undefined && latestStats.temperatureDeviation >= 0 ? '+' : ''}${latestStats?.temperatureDeviation}°C` 
                  },
                  { 
                    label: 'Частота дыхания', 
                    val: `${latestStats?.respiratoryRate || 14.1} д/мин` 
                  },
                  { 
                    label: 'Статус оценки биометрии', 
                    val: summary.avgReadinessScore >= 80 ? 'Идеальное восстановление' : 'Умеренный стресс' 
                  }
                ]}
              />

              {/* Card 4: Daily Energy Output */}
              <MetricCard
                id="activity"
                title="Физическая нагрузка"
                value={`${summary.avgSteps.toLocaleString()}`}
                unit="шагов/день"
                subtitle={`Всего шагов: ${summary.totalSteps.toLocaleString()}`}
                icon={Activity}
                status={summary.avgActivityScore >= 85 ? 'optimal' : summary.avgActivityScore >= 70 ? 'good' : 'warning'}
                colorClass="bg-indigo-600"
                percentage={summary.avgActivityScore}
                trendText="Активность"
                subMetrics={[
                  { 
                    label: 'Среднее сжигание калорий', 
                    val: `${Math.round(ouraData.reduce((acc, d) => acc + d.activeCalories, 0) / ouraData.length)} ккал` 
                  },
                  { 
                    label: 'Балл активности', 
                    val: `${summary.avgActivityScore}/100` 
                  },
                  { 
                    label: 'Прогресс цели шагов', 
                    val: `${Math.round((summary.avgSteps / 11000) * 100)}%` 
                  }
                ]}
              />

            </div>

            {/* Interactive Charts module */}
            <TrendCharts data={ouraData} />

            {/* Personalized Biometric Insights & Correlations */}
            <BiometricInsights ouraData={ouraData} />

          </div>

          {/* Right Column (span 4): Oura file uploader + AI Health Coach Chat */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Drag & Drop File Parser */}
            <UploadZone 
              onDataParsed={handleDataParsed}
              onReset={handleRestoreDemo}
              isCustomDataLoaded={isCustomDataLoaded}
              loadedFileName={loadedFileName}
            />

            {/* PWA macOS & Mobile Installation Tutorial Box */}
            <div className="bg-zinc-900 border border-zinc-800/80 p-4 rounded-2xl shadow-lg">
              <div className="flex gap-2.5 items-start mb-2.5">
                <Smartphone className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-semibold text-white font-sans uppercase tracking-wider">Установка Web App (macOS & Mobile)</h3>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-light mt-0.5">
                    Установите это приложение PWA прямо на компьютер macOS или мобильный телефон, чтобы открывать панель Oura в один клик в отдельном окне.
                  </p>
                </div>
              </div>
              <div className="space-y-2 border-t border-zinc-800/80 pt-2.5 text-[10px] leading-relaxed">
                <div className="flex items-start gap-1 text-zinc-300">
                  <span className="text-orange-400 font-bold shrink-0">💻 macOS (Safari):</span>
                  <span>В меню выберите <strong className="text-white font-medium">«Файл»</strong> ➔ <strong className="text-white font-medium">«Добавить в док...»</strong>. Приложение появится в вашем Dock и Launchpad как нативное!</span>
                </div>
                <div className="flex items-start gap-1 text-zinc-300">
                  <span className="text-orange-400 font-bold shrink-0">💻 macOS (Chrome / Edge):</span>
                  <span>Нажмите на <strong className="text-white font-medium">значок установки</strong> (стрелочка в круге) в адресной строке справа или выберите <strong className="text-white font-medium">«Установить...»</strong> в меню настроек.</span>
                </div>
                <div className="flex items-start gap-1 text-zinc-300">
                  <span className="text-orange-400 font-bold shrink-0">🍏 iOS & iPadOS:</span>
                  <span>В Safari нажмите кнопку <strong className="text-white font-medium">«Поделиться»</strong> ➔ выберите <strong className="text-white font-medium">«На экран Домой»</strong>.</span>
                </div>
                <div className="flex items-start gap-1 text-zinc-300">
                  <span className="text-orange-400 font-bold shrink-0">🤖 Android (Chrome):</span>
                  <span>Нажмите <strong className="text-white font-medium">«Три точки»</strong> вверху ➔ нажмите <strong className="text-white font-medium">«Установить приложение»</strong> (или воспользуйтесь кнопкой в самом верху шапки).</span>
                </div>
              </div>
            </div>

            {/* AI Health Coach Chat interface */}
            <AICoach ouraData={ouraData} />

          </div>

        </div>

        {/* Footer Module */}
        <footer className="border-t border-zinc-900 mt-10 pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-xs font-sans gap-4">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-600" />
            <span>Oura Ring AI Аналитика • Локальная обработка и конфиденциальность</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Личные биометрические данные не сохраняются на внешней стороне.</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
