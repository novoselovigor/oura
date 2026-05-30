/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  BrainCircuit, 
  Clock, 
  Zap, 
  Flame, 
  Compass, 
  Activity, 
  Heart,
  TrendingUp, 
  TrendingDown, 
  Minus,
  HelpCircle
} from 'lucide-react';
import { OuraDayData } from '../types';

interface BiometricInsightsProps {
  ouraData: OuraDayData[];
}

export const BiometricInsights: React.FC<BiometricInsightsProps> = ({ ouraData }) => {
  const [metricX, setMetricX] = useState<string>('steps');
  const [metricY, setMetricY] = useState<string>('readinessScore');

  // Calculates Pearson correlation coefficient r
  const calculateCorrelation = (xList: number[], yList: number[]): number => {
    const n = Math.min(xList.length, yList.length);
    if (n < 2) return 0;

    const meanX = xList.reduce((a, b) => a + b, 0) / n;
    const meanY = yList.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;

    for (let i = 0; i < n; i++) {
      const diffX = xList[i] - meanX;
      const diffY = yList[i] - meanY;
      numerator += diffX * diffY;
      denominatorX += diffX * diffX;
      denominatorY += diffY * diffY;
    }

    if (denominatorX === 0 || denominatorY === 0) return 0;
    return numerator / Math.sqrt(denominatorX * denominatorY);
  };

  // Human-readable labels & keys mapping
  const metricsMeta: Record<string, { label: string; icon: any; color: string; valType: string }> = {
    steps: { label: 'Шаги за день', icon: Activity, color: 'text-indigo-400', valType: 'count' },
    activeCalories: { label: 'Активные калории', icon: Flame, color: 'text-orange-400', valType: 'kcal' },
    sleepScore: { label: 'Балл сна', icon: Clock, color: 'text-sky-400', valType: 'score' },
    totalSleep: { label: 'Общее время сна', icon: Clock, color: 'text-indigo-400', valType: 'minutes' },
    deepSleep: { label: 'Глубокий сон', icon: Zap, color: 'text-purple-400', valType: 'minutes' },
    remSleep: { label: 'Быстрый сон (REM)', icon: Sparkles, color: 'text-pink-400', valType: 'minutes' },
    readinessScore: { label: 'Индекс готовности', icon: BrainCircuit, color: 'text-emerald-400', valType: 'score' },
    avgHrv: { label: 'Вариабельность пульса (HRV)', icon: Heart, color: 'text-orange-500', valType: 'ms' },
    lowestHeartRate: { label: 'Минимальный ЧСС во сне', icon: Heart, color: 'text-red-400', valType: 'bpm' },
  };

  const calculatedStats = useMemo(() => {
    if (ouraData.length < 3) return null;

    // 1. Bedtime Consistency & Duration Variance
    const totalSleepDurations = ouraData.map(d => d.totalSleep);
    const meanSleep = totalSleepDurations.reduce((a, b) => a + b, 0) / totalSleepDurations.length;
    const sleepVariance = totalSleepDurations.reduce((a, b) => a + Math.pow(b - meanSleep, 2), 0) / totalSleepDurations.length;
    const sleepStdDevRaw = Math.sqrt(sleepVariance);
    const sleepStdDevMins = Math.round(sleepStdDevRaw);

    let consistencyStatus = 'Высокая стабильность';
    let consistencyDesc = 'Продолжительность сна исключительно стабильна, что максимизирует синхронизацию с циркадными ритмами.';
    if (sleepStdDevMins > 60) {
      consistencyStatus = 'Высокая нестабильность';
      consistencyDesc = 'Замечены сильные колебания продолжительности сна. Постарайтесь уменьшить перепады до 45 минут, чтобы избежать джетлага.';
    } else if (sleepStdDevMins > 40) {
      consistencyStatus = 'Стабильный сон';
      consistencyDesc = 'Достаточно стабильный сон. Небольшие улучшения зафиксируют важные гормональный и метаболический пики.';
    }

    // 2. Strain Sleep Tax Loop
    let heavyActivityDays = 0;
    let nextDayReadinessDrop = 0;
    for (let i = 0; i < ouraData.length - 1; i++) {
      if (ouraData[i].steps > 10000 || ouraData[i].activityScore > 80) {
        heavyActivityDays++;
        if (ouraData[i + 1].readinessScore < ouraData[i].readinessScore) {
          nextDayReadinessDrop++;
        }
      }
    }
    const readinessTaxPct = heavyActivityDays > 0 ? Math.round((nextDayReadinessDrop / heavyActivityDays) * 100) : 0;

    // 3. Parasympathetic Resting Bias
    const avgLowestHR = ouraData.reduce((acc, d) => acc + d.lowestHeartRate, 0) / ouraData.length;
    const avgHRV = ouraData.reduce((acc, d) => acc + d.avgHrv, 0) / ouraData.length;
    
    let lowHRPnights = 0;
    let highHRVnights = 0;
    ouraData.forEach(d => {
      if (d.lowestHeartRate < avgLowestHR) {
        lowHRPnights++;
        if (d.avgHrv > avgHRV) {
          highHRVnights++;
        }
      }
    });
    const parasympatheticBiasPct = lowHRPnights > 0 ? Math.round((highHRVnights / lowHRPnights) * 100) : 0;

    return {
      meanSleep,
      sleepStdDevMins,
      consistencyStatus,
      consistencyDesc,
      readinessTaxPct,
      heavyActivityDays,
      parasympatheticBiasPct,
      avgLowestHR,
      avgHRV
    };
  }, [ouraData]);

  // Extract variables list for the dynamic correlation coefficient
  const dynamicCorrelation = useMemo(() => {
    if (ouraData.length < 3) return { r: 0, text: 'Недостаточно данных для расчета корреляции.', trend: 'neutral' };

    const xValues = ouraData.map((d: any) => d[metricX] ?? 0);
    const yValues = ouraData.map((d: any) => d[metricY] ?? 0);

    const r = calculateCorrelation(xValues, yValues);

    let text = 'Нет определенной взаимосвязи';
    let trend: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    const labelX = metricsMeta[metricX]?.label || metricX;
    const labelY = metricsMeta[metricY]?.label || metricY;

    if (r >= 0.45) {
      trend = 'positive';
      text = `Выраженный синергетический эффект. Повышение показателя «${labelX}» статистически связано с прямым ростом «${labelY}», помогая укреплять ресурсы организма.`;
    } else if (r > 0.15 && r < 0.45) {
      trend = 'positive';
      text = `Положительная взаимосвязь. Рост показателя «${labelX}» умеренно стимулирует «${labelY}», выступая в роли поддерживающего фактора.`;
    } else if (r <= -0.45) {
      trend = 'negative';
      text = `Выраженная физиологическая нагрузка. Рост показателя «${labelX}» приводит к падению «${labelY}», сигнализируя о расходе энергии и утомлении.`;
    } else if (r < -0.15 && r > -0.45) {
      trend = 'negative';
      text = `Слабая обратная зависимость. Повышение «${labelX}» часто связано с небольшим снижением «${labelY}» на фоне адаптации систем организма.`;
    } else {
      trend = 'neutral';
      text = `Показатели не связаны. Колебания «${labelX}» происходят обособленно, не оказывая значимого влияния на значения «${labelY}».`;
    }

    return { r, text, trend };
  }, [ouraData, metricX, metricY]);

  return (
    <div id="biometric_insights" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col text-left">
      <div className="border-b border-zinc-800 pb-4 mb-6">
        <h2 className="text-lg font-sans font-semibold text-white flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-orange-400" />
          Физиологические показатели и корреляции
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5 font-light">Рассчитанные закономерности на основе вашей биометрии</p>
      </div>

      {ouraData.length < 3 ? (
        <div className="py-8 text-center text-zinc-500 font-mono text-xs">
          Сбор физиологических данных для запуска анализа корреляций...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column A: Systemic Indicators & Key Stats */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">Ключевые показатели организма</h3>

            {/* Insight 1: Circadian stability */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
                  <Clock className="w-4 h-4 text-sky-400" />
                  Симметрия циркадных ритмов
                </span>
                <span className="text-[10px] font-mono bg-sky-950/40 text-sky-400 border border-sky-900/30 px-2 py-0.5 rounded font-black">
                  разброс ±{calculatedStats?.sleepStdDevMins} мин
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-300 font-semibold mt-1">
                {calculatedStats?.consistencyStatus}
              </p>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                {calculatedStats?.consistencyDesc}
              </p>
            </div>

            {/* Insight 2: Activity tax */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
                  <Flame className="w-4 h-4 text-orange-400" />
                  Цикл восстановления после нагрузок
                </span>
                <span className="text-[10px] font-mono bg-orange-950/40 text-orange-400 border border-orange-900/40 px-2 py-0.5 rounded font-black">
                  влияние на готовность: {calculatedStats?.readinessTaxPct}%
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-300 font-semibold mt-1">
                {calculatedStats?.readinessTaxPct && calculatedStats.readinessTaxPct > 60 ? 'Высокая системная потребность в отдыхе' : 'Сбалансированная нагрузка'}
              </p>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                В дни, когда шаги превышали 10 000 (пиковая нагрузка), ваш индекс готовности (Readiness) снижался на следующий день в **{calculatedStats?.readinessTaxPct}%** случаев, что указывает на адекватную реакцию организма.
              </p>
            </div>

            {/* Insight 3: Rest vagal bias */}
            <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
                  <Heart className="w-4 h-4 text-indigo-400" />
                  Парасимпатический тонус
                </span>
                <span className="text-[10px] font-mono bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 px-2 py-0.5 rounded font-black">
                  Вагусный сдвиг: {calculatedStats?.parasympatheticBiasPct}%
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-300 font-semibold mt-1">
                Связь HRV и ЧСС во время сна
              </p>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Когда минимальный пульс во сне опускался ниже среднего ({calculatedStats?.avgLowestHR.toFixed(0)} уд/мин), вариабельность (HRV) росла выше базового уровня в **{calculatedStats?.parasympatheticBiasPct}%** ночей. Это признак быстрого восстановления.
              </p>
            </div>
          </div>

          {/* Column B: Dynamic Pearson Correlation Explorer */}
          <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-805 border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-4">
                <Compass className="w-4 h-4 text-orange-400 animate-pulse" />
                <h4 className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wider">Исследователь корреляций</h4>
              </div>

              {/* Variable inputs selectors */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold block mb-1">Переменная A (X):</label>
                  <select 
                    value={metricX}
                    onChange={(e) => setMetricX(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs px-2.5 py-2 rounded-lg font-sans focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {Object.entries(metricsMeta).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-500 font-bold block mb-1">Переменная B (Y):</label>
                  <select 
                    value={metricY}
                    onChange={(e) => setMetricY(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs px-2.5 py-2 rounded-lg font-sans focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {Object.entries(metricsMeta).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coefficient visualizer */}
              <div className="flex items-center gap-4 py-4 px-4 bg-zinc-900/60 rounded-xl border border-zinc-800/50 mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase">Индекс корреляции Пирсона</span>
                    <span className="text-xs font-mono text-zinc-400">r = {dynamicCorrelation.r.toFixed(3)}</span>
                  </div>
                  
                  {/* Gauge bar */}
                  <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden relative border border-zinc-800/40">
                    <div 
                      className={`h-full absolute rounded-full ${
                        dynamicCorrelation.trend === 'positive' 
                        ? 'bg-emerald-500' 
                        : dynamicCorrelation.trend === 'negative' 
                        ? 'bg-red-400' 
                        : 'bg-zinc-500'
                      }`}
                      style={{
                        left: '50%',
                        width: `${Math.abs(dynamicCorrelation.r) * 50}%`,
                        transform: dynamicCorrelation.r < 0 ? 'translateX(-100%)' : 'none'
                      }}
                    />
                    <div className="h-full absolute left-1/2 w-0.5 bg-zinc-600 top-0 translate-x-[-50%]" />
                  </div>
                  
                  <div className="flex justify-between text-[8px] font-mono text-zinc-600 mt-1 uppercase">
                    <span>Обратная (-1)</span>
                    <span>Нет влияния (0)</span>
                    <span>Прямая (+1)</span>
                  </div>
                </div>

                {/* Trend icon pill */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-center shrink-0 ${
                  dynamicCorrelation.trend === 'positive' 
                  ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
                  : dynamicCorrelation.trend === 'negative' 
                  ? 'bg-red-950/20 border-red-900/30 text-red-400' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                }`}>
                  {dynamicCorrelation.trend === 'positive' && <TrendingUp className="w-5 h-5" />}
                  {dynamicCorrelation.trend === 'negative' && <TrendingDown className="w-5 h-5" />}
                  {dynamicCorrelation.trend === 'neutral' && <Minus className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Analysis text report writeup */}
            <div className="p-3 bg-zinc-900/30 border border-zinc-800/40 rounded-xl text-xs leading-relaxed text-zinc-300 font-light font-sans">
              <strong>Интерактивный отчет:</strong> {dynamicCorrelation.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
