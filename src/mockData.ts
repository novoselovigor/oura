/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OuraDayData } from './types';

// Let's generate dates dynamically relative to the current local date (2026-05-30)
// so the dashboard always feels live and fresh.
export const generateMockOuraData = (): OuraDayData[] => {
  const baseDate = new Date('2026-05-30');
  
  // 14 days of realistic sleep/recovery tracking for an active biohacker
  const mockDataRaw = [
    {
      daysAgo: 13,
      sleepScore: 82,
      readinessScore: 85,
      activityScore: 78,
      avgHeartRate: 54,
      lowestHeartRate: 48,
      avgHrv: 62,
      totalSleep: 460, // 7h 40m
      remSleep: 110,
      deepSleep: 95,
      lightSleep: 215,
      awakeTime: 40,
      steps: 11200,
      activeCalories: 450,
      respiratoryRate: 14.2,
      temperatureDeviation: -0.1,
    },
    {
      daysAgo: 12,
      sleepScore: 78,
      readinessScore: 80,
      activityScore: 88,
      avgHeartRate: 56,
      lowestHeartRate: 50,
      avgHrv: 58,
      totalSleep: 430, // 7h 10m
      remSleep: 90,
      deepSleep: 80,
      lightSleep: 220,
      awakeTime: 40,
      steps: 14500,
      activeCalories: 620,
      respiratoryRate: 14.4,
      temperatureDeviation: 0.0,
    },
    {
      daysAgo: 11,
      sleepScore: 88,
      readinessScore: 91,
      activityScore: 72,
      avgHeartRate: 51,
      lowestHeartRate: 45,
      avgHrv: 74,
      totalSleep: 510, // 8h 30m
      remSleep: 125,
      deepSleep: 115,
      lightSleep: 225,
      awakeTime: 45,
      steps: 8200,
      activeCalories: 310,
      respiratoryRate: 13.9,
      temperatureDeviation: -0.2,
    },
    {
      daysAgo: 10,
      sleepScore: 91,
      readinessScore: 94,
      activityScore: 92,
      avgHeartRate: 48,
      lowestHeartRate: 42,
      avgHrv: 82,
      totalSleep: 525, // 8h 45m
      remSleep: 135,
      deepSleep: 120,
      lightSleep: 230,
      awakeTime: 40,
      steps: 16100,
      activeCalories: 750,
      respiratoryRate: 13.8,
      temperatureDeviation: -0.1,
    },
    {
      // A day of high physical exertion leading to lower recovery
      daysAgo: 9,
      sleepScore: 74,
      readinessScore: 70,
      activityScore: 97,
      avgHeartRate: 59,
      lowestHeartRate: 53,
      avgHrv: 49,
      totalSleep: 410, // 6h 50m
      remSleep: 80,
      deepSleep: 70,
      lightSleep: 210,
      awakeTime: 50,
      steps: 22400, // Marathon run or huge hike
      activeCalories: 1150,
      respiratoryRate: 14.8,
      temperatureDeviation: +0.3,
    },
    {
      // Rest day, recovering
      daysAgo: 8,
      sleepScore: 85,
      readinessScore: 76,
      activityScore: 40,
      avgHeartRate: 52,
      lowestHeartRate: 46,
      avgHrv: 68,
      totalSleep: 495, // 8h 15m
      remSleep: 115,
      deepSleep: 105,
      lightSleep: 235,
      awakeTime: 40,
      steps: 4500,
      activeCalories: 180,
      respiratoryRate: 14.1,
      temperatureDeviation: +0.1,
    },
    {
      // Excellent sleep, peak recovery
      daysAgo: 7,
      sleepScore: 94,
      readinessScore: 96,
      activityScore: 82,
      avgHeartRate: 46,
      lowestHeartRate: 40,
      avgHrv: 89,
      totalSleep: 540, // 9h
      remSleep: 140,
      deepSleep: 130,
      lightSleep: 230,
      awakeTime: 40,
      steps: 11800,
      activeCalories: 480,
      respiratoryRate: 13.5,
      temperatureDeviation: -0.2,
    },
    {
      daysAgo: 6,
      sleepScore: 86,
      readinessScore: 92,
      activityScore: 85,
      avgHeartRate: 50,
      lowestHeartRate: 44,
      avgHrv: 76,
      totalSleep: 480, // 8h
      remSleep: 110,
      deepSleep: 105,
      lightSleep: 220,
      awakeTime: 45,
      steps: 12600,
      activeCalories: 510,
      respiratoryRate: 13.8,
      temperatureDeviation: -0.1,
    },
    {
      // An interesting bad day: Late heavy meal & alcohol simulation
      daysAgo: 5,
      sleepScore: 62,
      readinessScore: 56,
      activityScore: 74,
      avgHeartRate: 64,
      lowestHeartRate: 58,
      avgHrv: 35, // HRV slashed
      totalSleep: 360, // 6h
      remSleep: 50, // REM heavily suppressed by alcohol
      deepSleep: 60, // Deep sleep suppressed
      lightSleep: 200,
      awakeTime: 50,
      steps: 10200,
      activeCalories: 430,
      respiratoryRate: 15.2, // Fast, shallow breathing
      temperatureDeviation: +0.6, // Elevated body temp due to alcohol metabolism
    },
    {
      // Recovering from the bad day
      daysAgo: 4,
      sleepScore: 80,
      readinessScore: 68,
      activityScore: 65,
      avgHeartRate: 53,
      lowestHeartRate: 47,
      avgHrv: 59,
      totalSleep: 480, // 8h
      remSleep: 115,
      deepSleep: 90,
      lightSleep: 230,
      awakeTime: 45,
      steps: 7500,
      activeCalories: 280,
      respiratoryRate: 14.2,
      temperatureDeviation: +0.1,
    },
    {
      daysAgo: 3,
      sleepScore: 85,
      readinessScore: 84,
      activityScore: 86,
      avgHeartRate: 51,
      lowestHeartRate: 45,
      avgHrv: 69,
      totalSleep: 490, // 8h 10m
      remSleep: 120,
      deepSleep: 100,
      lightSleep: 230,
      awakeTime: 40,
      steps: 13200,
      activeCalories: 550,
      respiratoryRate: 13.9,
      temperatureDeviation: -0.1,
    },
    {
      daysAgo: 2,
      sleepScore: 87,
      readinessScore: 88,
      activityScore: 90,
      avgHeartRate: 49,
      lowestHeartRate: 43,
      avgHrv: 78,
      totalSleep: 500, // 8h 20m
      remSleep: 125,
      deepSleep: 110,
      lightSleep: 225,
      awakeTime: 40,
      steps: 15400,
      activeCalories: 680,
      respiratoryRate: 13.7,
      temperatureDeviation: -0.1,
    },
    {
      daysAgo: 1,
      sleepScore: 90,
      readinessScore: 93,
      activityScore: 80,
      avgHeartRate: 47,
      lowestHeartRate: 41,
      avgHrv: 85,
      totalSleep: 515, // 8h 35m
      remSleep: 130,
      deepSleep: 115,
      lightSleep: 230,
      awakeTime: 40,
      steps: 11000,
      activeCalories: 450,
      respiratoryRate: 13.6,
      temperatureDeviation: -0.2,
    },
    {
      daysAgo: 0, // Today
      sleepScore: 92,
      readinessScore: 95,
      activityScore: 50, // Early in the day, only partial activity recorded
      avgHeartRate: 45,
      lowestHeartRate: 39, // Exceptional night
      avgHrv: 91,
      totalSleep: 530, // 8h 50m
      remSleep: 135,
      deepSleep: 125,
      lightSleep: 230,
      awakeTime: 40,
      steps: 3200, // Early steps
      activeCalories: 150,
      respiratoryRate: 13.4,
      temperatureDeviation: -0.3,
    },
  ];

  return mockDataRaw.map((item) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - item.daysAgo);
    
    // Format as YYYY-MM-DD
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    
    return {
      date: `${yyyy}-${mm}-${dd}`,
      sleepScore: item.sleepScore,
      readinessScore: item.readinessScore,
      activityScore: item.activityScore,
      avgHeartRate: item.avgHeartRate,
      lowestHeartRate: item.lowestHeartRate,
      avgHrv: item.avgHrv,
      totalSleep: item.totalSleep,
      remSleep: item.remSleep,
      deepSleep: item.deepSleep,
      lightSleep: item.lightSleep,
      awakeTime: item.awakeTime,
      steps: item.steps,
      activeCalories: item.activeCalories,
      respiratoryRate: item.respiratoryRate,
      temperatureDeviation: item.temperatureDeviation,
    };
  });
};
