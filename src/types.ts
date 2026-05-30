/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OuraDayData {
  date: string; // YYYY-MM-DD
  sleepScore: number; // 0-100
  readinessScore: number; // 0-100
  activityScore: number; // 0-100
  
  // Pulse
  avgHeartRate: number; // bpm
  lowestHeartRate: number; // bpm
  avgHrv: number; // ms (Heart Rate Variability)
  
  // Sleep breakdown (minutes)
  totalSleep: number;
  remSleep: number;
  deepSleep: number;
  lightSleep: number;
  awakeTime: number;
  
  // Activity / Health
  steps: number;
  activeCalories: number; // kcal
  respiratoryRate: number; // breaths per min
  temperatureDeviation: number; // degrees Celsius e.g. -0.2 or +0.4
}

export interface OuraMetricsSummary {
  avgSleepScore: number;
  avgReadinessScore: number;
  avgActivityScore: number;
  avgLowestHeartRate: number;
  avgHrv: number;
  avgSteps: number;
  totalSteps: number;
  avgSleepDuration: number; // minutes
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
