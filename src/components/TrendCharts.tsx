/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { Activity, Moon, Heart, Thermometer, Info } from 'lucide-react';
import { OuraDayData } from '../types';

interface TrendChartsProps {
  data: OuraDayData[];
}

export default function TrendCharts({ data }: TrendChartsProps) {
  const [activeTab, setActiveTab] = useState<'sleep' | 'cardio' | 'readiness' | 'thermal'>('sleep');

  // Format date helper: "25 мая" e.g. from 2026-05-25
  const formatChartDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    } catch {
      return dateStr;
    }
  };

  // Pre-process data for charts
  const processedData = data.map((d) => ({
    ...d,
    formattedDate: formatChartDate(d.date),
    // Convert minutes to hours for sleep breakdown charts
    deepHours: Number((d.deepSleep / 60).toFixed(2)),
    remHours: Number((d.remSleep / 60).toFixed(2)),
    lightHours: Number((d.lightSleep / 60).toFixed(2)),
    awakeHours: Number((d.awakeTime / 60).toFixed(2)),
    totalHours: Number((d.totalSleep / 60).toFixed(2)),
  }));

  // Custom tooltips to maintain Oura's luxurious obsidian styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950/95 border border-zinc-800 rounded-xl p-3 shadow-2xl backdrop-blur-md">
          <p className="text-xs font-mono font-medium text-zinc-400 mb-1.5">{label}</p>
          <div className="space-y-1">
            {payload.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 justify-between text-xs font-sans font-light">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                </span>
                <span className="font-mono font-semibold text-zinc-150">
                  {p.value} {p.unit || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="oura_trends" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col">
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 mb-6 gap-4">
        <div>
          <h2 className="text-lg font-sans font-medium text-white flex items-center gap-2">
            Анализаторы физиологических трендов
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-light font-sans">Анализ циклов сна и динамики восстановления организма</p>
        </div>

        {/* Action tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
          <button
            onClick={() => setActiveTab('sleep')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'sleep'
                ? 'bg-zinc-900 text-orange-400 border border-orange-950/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            Фазы сна
          </button>
          <button
            onClick={() => setActiveTab('cardio')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'cardio'
                ? 'bg-zinc-900 text-orange-400 border border-orange-950/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Пульс и HRV
          </button>
          <button
            onClick={() => setActiveTab('readiness')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'readiness'
                ? 'bg-zinc-900 text-orange-500 border border-orange-950/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Нагрузка и готовность
          </button>
          <button
            onClick={() => setActiveTab('thermal')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'thermal'
                ? 'bg-zinc-900 text-orange-400 border border-orange-950/50'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            Отклонение температуры
          </button>
        </div>
      </div>

      {/* Chart Output Box */}
      <div className="w-full relative h-[340px] flex items-center justify-center">
        {processedData.length === 0 ? (
          <p className="text-sm font-sans text-zinc-400">Loading charts...</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'sleep' ? (
              // Tab 1: Sleep architecture (Stacked Bar Chart of Hours)
              <BarChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f2e" opacity={0.15} />
                <XAxis dataKey="formattedDate" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#27272a" />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#27272a" unit="ч" />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, color: '#a1a1aa', paddingTop: 10 }} />
                <Bar name="Глубокий сон" dataKey="deepHours" stackId="sleep_stages" fill="#818cf8" unit="ч" radius={[0, 0, 0, 0]} />
                <Bar name="Быстрый сон (REM)" dataKey="remHours" stackId="sleep_stages" fill="#22d3ee" unit="ч" radius={[0, 0, 0, 0]} />
                <Bar name="Легкий сон" dataKey="lightHours" stackId="sleep_stages" fill="#52525b" unit="ч" radius={[0, 0, 0, 0]} />
                <Bar name="Пробуждения во сне" dataKey="awakeHours" stackId="sleep_stages" fill="#f97316" unit="ч" radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : activeTab === 'cardio' ? (
              // Tab 2: Cardio Overnight Pulse Profile (Lowest Heart rate and HRV with two axes)
              <LineChart data={processedData} margin={{ top: 10, right: -10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f2e" opacity={0.15} />
                <XAxis dataKey="formattedDate" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#27272a" />
                <YAxis yAxisId="hr" tick={{ fill: '#22d3ee', fontSize: 10 }} stroke="#164e63" unit=" уд/мин" domain={['dataMin - 5', 'dataMax + 5']} />
                <YAxis yAxisId="hrv" orientation="right" tick={{ fill: '#f97316', fontSize: 10 }} stroke="#7c2d12" unit=" мс" domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line
                  yAxisId="hr"
                  name="Минимальный ЧСС во сне"
                  type="monotone"
                  dataKey="lowestHeartRate"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  unit=" уд/мин"
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="hrv"
                  name="Средняя вариабельность (HRV)"
                  type="monotone"
                  dataKey="avgHrv"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  unit=" мс"
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : activeTab === 'readiness' ? (
              // Tab 3: Readiness Score vs Strain (Area chart for Readiness, Bar chart for steps/activity)
              <AreaChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f2e" opacity={0.15} />
                <XAxis dataKey="formattedDate" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#27272a" />
                <YAxis yAxisId="scores" domain={[0, 100]} tick={{ fill: '#f97316', fontSize: 10 }} stroke="#431407" />
                <YAxis yAxisId="steps" orientation="right" tick={{ fill: '#a1a1aa', fontSize: 10 }} stroke="#27272a" unit=" шаг" />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area
                  yAxisId="scores"
                  name="Индекс готовности"
                  type="monotone"
                  dataKey="readinessScore"
                  stroke="#f97316"
                  fill="url(#gradReadiness)"
                  strokeWidth={2}
                  unit="/100"
                />
                <Area
                  yAxisId="scores"
                  name="Индекс активности"
                  type="monotone"
                  dataKey="activityScore"
                  stroke="#818cf8"
                  fill="url(#gradActivity)"
                  strokeWidth={1.5}
                  unit="/100"
                />
                <defs>
                  <linearGradient id="gradReadiness" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="gradActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            ) : (
              // Tab 4: overnight skin temperature deviations (Bar representation relative to zero)
              <BarChart data={processedData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f2e" opacity={0.15} />
                <XAxis dataKey="formattedDate" tick={{ fill: '#71717a', fontSize: 10 }} stroke="#27272a" />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} stroke="#27272a" unit="°C" domain={[-1.5, 1.5]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#52525b" />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar
                  name="Отклонение температуры"
                  dataKey="temperatureDeviation"
                  unit="°C"
                  fill="#f97316"
                  radius={[4, 4, 0, 0]}
                  // Color positive dev orange, negative dev cyan
                  strokeWidth={0}
                >
                  {processedData.map((entry, index) => {
                    const color = entry.temperatureDeviation >= 0 ? '#f97316' : '#22d3ee';
                    return <Bar key={`cell-${index}`} dataKey="temperatureDeviation" fill={color} />;
                  })}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Contextual description underneath active tab */}
      <div className="mt-4 flex items-start gap-2 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80">
        <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-400 leading-relaxed font-light font-sans">
          {activeTab === 'sleep' && (
            <p>
              <strong>О фазах сна:</strong> Для здорового взрослого человека оптимально проводить <strong>20–25%</strong> времени сна в глубокой фазе (физическое восстановление тканей) и <strong>20–25%</strong> в быстрой фазе (REM) (когнитивная адаптация и кристаллизация памяти).
            </p>
          )}
          {activeTab === 'cardio' && (
            <p>
              <strong>Показатели пульса:</strong> Низкий пульс в покое и высокая вариабельность (HRV) указывают на хорошую физическую форму и активность парасимпатической системы («отдых и пищеварение»). Обратите внимание, как поздний ужин или алкоголь повышают ночной пульс.
            </p>
          )}
          {activeTab === 'readiness' && (
            <p>
              <strong>Нагрузка и восстановление:</strong> Высокие физические нагрузки (интенсивные тренировки, много шагов) снижают индекс готовности на следующие 24–48 часов. Этот циклический процесс отражает правильное дозирование нагрузок и суперкомпенсацию.
            </p>
          )}
          {activeTab === 'thermal' && (
            <p>
              <strong>Отклонение температуры:</strong> Ночная температура кожи обычно колеблется в пределах <strong>±0.5°C</strong> от базовой линии. Стойкие отклонения выше +0.5°C могут указывать на системный стресс, переедание на ночь или реакцию иммунитета на вирус.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
