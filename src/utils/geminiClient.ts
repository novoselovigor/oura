/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';

/**
 * Perform high-precision clinical-style Oura data analysis directly in the client using the Gemini API.
 */
export async function analyzeOuraClientSide(data: any[], apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Ключ API Gemini не настроен.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Prepare metric series description for Gemini
  const datasetSummary = data.map((day: any) => {
    const sleepHours = (day.totalSleep / 60).toFixed(1);
    const remHours = (day.remSleep / 60).toFixed(1);
    const deepHours = (day.deepSleep / 60).toFixed(1);
    return `Date: ${day.date} | Sleep: ${day.sleepScore}/100 (${sleepHours}h, Deep: ${deepHours}h, REM: ${remHours}h, Awk: ${day.awakeTime}m) | Readiness: ${day.readinessScore}/100 | Activity: ${day.activityScore}/100 (Steps: ${day.steps}, Cal: ${day.activeCalories}kcal) | Pulse: MinHR ${day.lowestHeartRate}bpm, AvgHR ${day.avgHeartRate}bpm, HRV ${day.avgHrv}ms | RespRate: ${day.respiratoryRate}/min | TempDev: ${day.temperatureDeviation}°C`;
  }).join('\n');

  const prompt = `
You are an expert Health Coach, Athletic Coach, and Biohacking Consultant.
Below is Oura Ring tracking data collected over ${data.length} days:

${datasetSummary}

Perform a high-precision, customized clinical-style and athletic assessment of this user's data in Russian.
In your response, you MUST output exactly the following Russian headers in markdown to match the UI sections:

### Анализ восстановления
(Provide a brief, supportive summary in Russian highlighting their overall energy, balance of sleep and strain, and what's going well.)

### Аудит структуры сна
(Analyze deep sleep, REM sleep, and sleep efficiency in Russian. Highlight days with exceptional sleep and identify issues, such as poor REM/Deep or late-onset HRV rest.)

### Сердечно-сосудистый профиль
(Focus on Lowest Heart Rate and Heart Rate Variability (HRV) trends in Russian. Highlight the correlation between active days and changes in night-time HRV. Check if their pulse is resting early in the night or late.)

### Циркадные ритмы и отклонения
(Look at temperature deviations, respiratory rates, or sudden score slashes in Russian. If any day shows anomalies, warning indicators, or temperature spikes, explain what that could mean e.g. alcohol, late heavy food, or fighting off a bug.)

### План оптимизации здоровья
(Provide 4-5 highly specific, actionable biohacking or habit adjustments in Russian for today and the upcoming week. Focus on actionable details like sleep consistency, light exposure, eating windows, or active rest.)

Keep your analysis highly professional, insightful, scientifically accurate, motivating, and written completely in Russian. Avoid generic advice (such as "get 8 hours of sleep") and instead reference their specific numbers and days (e.g. "On 2026-05-25, your temperature spiked +0.6°C and HRV dropped, indicating...").
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
    },
  });

  return response.text || 'Не удалось получить отчет.';
}

/**
 * Direct client-side chat with Gemini proxying as the Oura Health Coach.
 */
export async function chatWithCoachClientSide(messages: any[], data: any[], apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Ключ API Gemini не настроен.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  let contextStr = 'No Oura data is loaded yet.';
  if (data && Array.isArray(data) && data.length > 0) {
    const avgSleep = Math.round(data.reduce((acc, d) => acc + d.sleepScore, 0) / data.length);
    const avgReady = Math.round(data.reduce((acc, d) => acc + d.readinessScore, 0) / data.length);
    const avgHrv = Math.round(data.reduce((acc, d) => acc + d.avgHrv, 0) / data.length);
    const avgLowestHr = Math.round(data.reduce((acc, d) => acc + d.lowestHeartRate, 0) / data.length);
    const avgSteps = Math.round(data.reduce((acc, d) => acc + d.steps, 0) / data.length);
    contextStr = `Current User Dataset spans ${data.length} days.
- Averages: Sleep: ${avgSleep}/100, Readiness: ${avgReady}/100, Steps: ${avgSteps}
- Cardiovascular: Lowest sleep heart rate: ${avgLowestHr} bpm, HRV: ${avgHrv} ms.
Detailed raw metrics list:
${data.map(d => `Date: ${d.date} | Sleep: ${d.sleepScore} | Readiness: ${d.readinessScore} | Min HR: ${d.lowestHeartRate} bpm | HRV: ${d.avgHrv} ms | Steps: ${d.steps} | Temp Dev: ${d.temperatureDeviation}°C`).join('\n')}`;
  }

  const systemInstruction = `
You are the "Oura AI Health Coach," a friendly, supportive, and scientifically grounded wellness counselor. You specialize in interpreting physiological trackers (pulse, sleep cycles, sleep stages, HRV, exercise stress, and skin temperature deviations) to give smart, individualized lifestyle guidelines.

Context regarding the user's Oura health data:
${contextStr}

Role parameters:
- Always respond in Russian.
- Use clear, friendly, and empowering phrasing in Russian.
- Back up your statements with circadian rhythm science, athletic training methodology, or sleep hygiene concepts.
- When the user asks a question, lookup their loaded Oura data. Refer to specific dates, scores, or trends if fitting.
- Be honest if data shows worrisome signs (like extreme temperature spike or major HRV plunge), suggesting they rest, hydrate, or avoid late meals, while always maintaining a gentle, non-alarmist tone.
- Keep responses compact, beautifully styled in Markdown, and direct. Break up paragraphs with bullets for readability.
- If the user asks general wellness advice, connect it back to how it would manifest in their Oura scores (e.g. how zone 2 cardio will lower their sleeping resting heart rate and increase deep sleep).
`;

  // Format messages into what the new @google/genai SDK expects helper objects
  const apiMessages = messages.map((msg: any) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash',
    contents: apiMessages,
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text || 'Не удалось получить ответ.';
}
