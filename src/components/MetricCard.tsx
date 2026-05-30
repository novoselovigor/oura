/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  id: string;
  title: string;
  value: number | string;
  subtitle?: string;
  unit?: string;
  icon: LucideIcon;
  status: 'optimal' | 'good' | 'warning' | 'info';
  colorClass: string;
  percentage?: number; // For radial loaders
  trendText?: string;
  trendDir?: 'up' | 'down' | 'neutral';
  subMetrics?: { label: string; val: string | number; percentage?: number }[];
}

export default function MetricCard({
  id,
  title,
  value,
  subtitle,
  unit,
  icon: Icon,
  status,
  colorClass,
  percentage,
  trendText,
  trendDir,
  subMetrics,
}: MetricCardProps) {
  // Determine color accents
  const getStatusColor = () => {
    switch (status) {
      case 'optimal':
        return {
          border: 'border-orange-500/20 bg-orange-950/10 text-orange-400',
          ring: 'stroke-orange-500',
          track: 'stroke-zinc-800/80',
          badge: 'bg-zinc-950 border-orange-500/30 text-orange-400',
        };
      case 'good':
        return {
          border: 'border-indigo-500/20 bg-indigo-950/10 text-indigo-400',
          ring: 'stroke-indigo-500',
          track: 'stroke-zinc-800/80',
          badge: 'bg-zinc-950 border-indigo-500/30 text-indigo-400',
        };
      case 'warning':
        return {
          border: 'border-red-500/25 bg-red-950/10 text-red-400',
          ring: 'stroke-red-500',
          track: 'stroke-zinc-800/80',
          badge: 'bg-zinc-950 border-red-500/30 text-red-400',
        };
      case 'info':
      default:
        return {
          border: 'border-zinc-800 bg-zinc-900 text-zinc-300',
          ring: 'stroke-zinc-500',
          track: 'stroke-zinc-800',
          badge: 'bg-zinc-800 border-zinc-700 text-zinc-400',
        };
    }
  };

  const colors = getStatusColor();
  const radius = 32;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = percentage !== undefined ? circumference - (percentage / 100) * circumference : 0;

  return (
    <motion.div
      id={`metric-card-${id}`}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={`bg-zinc-900 border border-zinc-800/85 p-5 rounded-2xl flex flex-col justify-between transition-shadow hover:shadow-xl relative overflow-hidden`}
    >
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-orange-500/5 to-transparent rounded-full pointer-events-none -mr-8 -mt-8" />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg border bg-zinc-950 border-zinc-800 text-zinc-400`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-sans font-bold text-zinc-500 uppercase tracking-widest">{title}</span>
        </div>
        
        {/* Status Badge */}
        {trendText && (
          <span className={`text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors.badge}`}>
            {trendText}
          </span>
        )}
      </div>

      {/* Main Stat and Visual Circular index (if applicable) */}
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-sans font-extralight tracking-tight text-zinc-150">{value}</span>
            {unit && <span className="text-xs text-zinc-500 font-mono tracking-wider">{unit}</span>}
          </div>
          {subtitle && <p className="text-[11px] text-zinc-400 mt-1 leading-normal font-sans font-light">{subtitle}</p>}
        </div>

        {/* SVG Radial Progress Indicator */}
        {percentage !== undefined && (
          <div className="relative w-18 h-18 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                className={colors.track}
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx="36"
                cy="36"
              />
              <motion.circle
                className={colors.ring}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx="36"
                cy="36"
              />
            </svg>
            <div className="absolute font-mono text-xs font-semibold text-white">
              {percentage}%
            </div>
          </div>
        )}
      </div>

      {/* Sub-metrics break downs (e.g., Sleep Stages or steps benchmarks) */}
      {subMetrics && subMetrics.length > 0 && (
        <div className="border-t border-zinc-800/80 pt-3 mt-1 space-y-2">
          {subMetrics.map((sub, sidx) => (
            <div key={sidx} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500 font-sans">{sub.label}</span>
                <span className="text-zinc-300 font-mono font-medium">{sub.val}</span>
              </div>
              {sub.percentage !== undefined && (
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sub.percentage}%` }}
                    transition={{ duration: 0.8, delay: sidx * 0.1 }}
                    className={`h-full rounded-full ${colorClass}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
