/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OuraDayData } from '../types';

/**
 * Perform direct client-side fetch from the Oura Ring V2 Cloud API using a Personal Access Token (PAT).
 * This works natively in the browser on static hosts such as GitHub Pages because the Oura V2 API 
 * supports CORS for bearer-authenticated requests.
 */
export async function syncOuraClientSide(token: string): Promise<OuraDayData[]> {
  // Pull previous 30 days of trends
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const formatYmd = (d: Date) => d.toISOString().split('T')[0];
  const startDateStr = formatYmd(startDate);
  const endDateStr = formatYmd(endDate);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  const [sleepRes, dailySleepRes, dailyActivityRes, dailyReadinessRes] = await Promise.all([
    fetch(`https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDateStr}&end_date=${endDateStr}`, { headers, mode: 'cors' }),
    fetch(`https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${startDateStr}&end_date=${endDateStr}`, { headers, mode: 'cors' }),
    fetch(`https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${startDateStr}&end_date=${endDateStr}`, { headers, mode: 'cors' }),
    fetch(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDateStr}&end_date=${endDateStr}`, { headers, mode: 'cors' }),
  ]);

  if (sleepRes.status === 401 || dailySleepRes.status === 401) {
    throw new Error('Ваш персональный токен Oura (PAT) недействителен или истек.');
  }

  if (!sleepRes.ok || !dailySleepRes.ok || !dailyActivityRes.ok || !dailyReadinessRes.ok) {
    throw new Error(`Произошла ошибка при загрузке данных Oura: ${sleepRes.status}`);
  }

  const sleepData = await sleepRes.json();
  const dailySleepData = await dailySleepRes.json();
  const dailyActivityData = await dailyActivityRes.json();
  const dailyReadinessData = await dailyReadinessRes.json();

  // Map response files by date keyword
  const sleepMap = new Map<string, any>();
  const dailySleepMap = new Map<string, any>();
  const dailyActivityMap = new Map<string, any>();
  const dailyReadinessMap = new Map<string, any>();

  (sleepData.data || []).forEach((item: any) => {
    const d = item.day || item.date?.split('T')[0];
    if (d) sleepMap.set(d, item);
  });

  (dailySleepData.data || []).forEach((item: any) => {
    const d = item.day || item.date?.split('T')[0];
    if (d) dailySleepMap.set(d, item);
  });

  (dailyActivityData.data || []).forEach((item: any) => {
    const d = item.day || item.date?.split('T')[0];
    if (d) dailyActivityMap.set(d, item);
  });

  (dailyReadinessData.data || []).forEach((item: any) => {
    const d = item.day || item.date?.split('T')[0];
    if (d) dailyReadinessMap.set(d, item);
  });

  // Calculate unique list of dates
  const allDates = Array.from(new Set([
    ...sleepMap.keys(),
    ...dailySleepMap.keys(),
    ...dailyActivityMap.keys(),
    ...dailyReadinessMap.keys()
  ])).sort();

  const secToMin = (seconds: any) => {
    if (typeof seconds === 'number') {
      return Math.round(seconds / 60);
    }
    return 0;
  };

  const parsedDataset: OuraDayData[] = allDates.map((dStr) => {
    const s = sleepMap.get(dStr) || {};
    const ds = dailySleepMap.get(dStr) || {};
    const da = dailyActivityMap.get(dStr) || {};
    const dr = dailyReadinessMap.get(dStr) || {};

    return {
      date: dStr,
      sleepScore: ds.score || 74,
      readinessScore: dr.score || 76,
      activityScore: da.score || 72,
      avgHeartRate: s.average_heart_rate || 54,
      lowestHeartRate: s.lowest_heart_rate || 46,
      avgHrv: s.average_hrv || 65,
      totalSleep: secToMin(s.total_sleep_duration) || 440,
      remSleep: secToMin(s.rem_sleep_duration) || 85,
      deepSleep: secToMin(s.deep_sleep_duration) || 90,
      lightSleep: secToMin(s.light_sleep_duration) || 265,
      awakeTime: secToMin(s.awake_duration) || 45,
      steps: da.steps || 7200,
      activeCalories: da.active_calories || 280,
      respiratoryRate: s.average_breath_rate || 14.1,
      temperatureDeviation: typeof dr.temperature_deviation === 'number' ? dr.temperature_deviation : 0.0,
    };
  });

  return parsedDataset;
}
