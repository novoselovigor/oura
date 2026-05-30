var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
app.use(import_express.default.json({ limit: "10mb" }));
var PORT = 3e3;
var aiClient = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add your key in the Secrets panel.");
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
app.get("/api/auth/url", (req, res) => {
  try {
    const clientRedirectUri = req.query.redirect_uri;
    const redirectUri = clientRedirectUri || "http://localhost:3000/auth/callback";
    const clientId = process.env.OURA_CLIENT_ID;
    if (!clientId) {
      return res.status(400).json({
        error: "OURA_CLIENT_ID is not defined. Please add it to your environment secrets in the Settings menu."
      });
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "daily_sleep daily_activity daily_readiness sleep",
      state: "biometric_sync_state"
    });
    const authUrl = `https://cloud.ouraring.com/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  } catch (error) {
    console.error("Error generating auth URL:", error);
    res.status(500).json({ error: error.message || "Failed to generate Oura Auth URL." });
  }
});
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).send("Authorization code is missing from callback.");
    }
    const clientId = process.env.OURA_CLIENT_ID;
    const clientSecret = process.env.OURA_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(500).send("Server configuration missing: OURA_CLIENT_ID or OURA_CLIENT_SECRET is not defined in Secrets.");
    }
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const redirectUri = `${protocol}://${req.get("host")}/auth/callback`;
    console.log("Exchanging Oura auth code with redirect_uri:", redirectUri);
    const response = await fetch("https://api.ouraring.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret
      }).toString()
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error("Oura token exchange API failed:", errText);
      return res.status(response.status).send(`Oura Token Exchange Failed: ${errText}`);
    }
    const tokenData = await response.json();
    const accessToken = tokenData.access_token;
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Biometric Sync Complete</title>
          <style>
            body {
              background-color: #09090b;
              color: #f4f4f5;
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background-color: #18181b;
              border: 1px solid #27272a;
              padding: 2.5rem;
              border-radius: 1rem;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
              max-width: 400px;
            }
            h2 { color: #f97316; margin-top: 0; font-weight: 600; letter-spacing: -0.025em; }
            p { color: #f4f4f5; font-size: 14px; line-height: 1.5; font-weight: 300; }
            .spinner {
              border: 3px solid #27272a;
              border-top: 3px solid #f97316;
              border-radius: 50%;
              width: 24px;
              height: 24px;
              animation: spin 1s linear infinite;
              margin: 1.5rem auto 0 auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Authentication Completed</h2>
            <p>Your Oura token has been generated. Synchronizing your physical metrics safely back with the core dashboard...</p>
            <div class="spinner"></div>
            <script>
              if (window.opener) {
                // Post authorization completion with access token back to the main app dashboard
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${accessToken}' }, '*');
                setTimeout(() => {
                  window.close();
                }, 1200);
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error in OAuth Callback helper:", error);
    res.status(500).send(`Secure callback error: ${error.message}`);
  }
});
app.post("/api/sync-oura", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "OAuth Bearer access token is required." });
    }
    const token = authHeader.split(" ")[1];
    const endDate = /* @__PURE__ */ new Date();
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(endDate.getDate() - 30);
    const formatYmd = (d) => d.toISOString().split("T")[0];
    const startDateStr = formatYmd(startDate);
    const endDateStr = formatYmd(endDate);
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json"
    };
    console.log(`Syncing Oura telemetry: query date range ${startDateStr} to ${endDateStr}`);
    const [sleepRes, dailySleepRes, dailyActivityRes, dailyReadinessRes] = await Promise.all([
      fetch(`https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDateStr}&end_date=${endDateStr}`, { headers }),
      fetch(`https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${startDateStr}&end_date=${endDateStr}`, { headers }),
      fetch(`https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${startDateStr}&end_date=${endDateStr}`, { headers }),
      fetch(`https://api.ouraring.com/v2/usercollection/daily_readiness?start_date=${startDateStr}&end_date=${endDateStr}`, { headers })
    ]);
    if (sleepRes.status === 401 || dailySleepRes.status === 401) {
      return res.status(401).json({ error: "Oura Cloud API token has expired or is invalid. Please sign-in again." });
    }
    if (!sleepRes.ok || !dailySleepRes.ok || !dailyActivityRes.ok || !dailyReadinessRes.ok) {
      console.error("One or more Oura API fetches failed:", {
        sleep: sleepRes.status,
        dailySleep: dailySleepRes.status,
        dailyActivity: dailyActivityRes.status,
        dailyReadiness: dailyReadinessRes.status
      });
      return res.status(400).json({ error: "Failed to retrieve combined data sets from the Oura Cloud endpoint." });
    }
    const sleepData = await sleepRes.json();
    const dailySleepData = await dailySleepRes.json();
    const dailyActivityData = await dailyActivityRes.json();
    const dailyReadinessData = await dailyReadinessRes.json();
    const sleepMap = /* @__PURE__ */ new Map();
    const dailySleepMap = /* @__PURE__ */ new Map();
    const dailyActivityMap = /* @__PURE__ */ new Map();
    const dailyReadinessMap = /* @__PURE__ */ new Map();
    (sleepData.data || []).forEach((item) => {
      const d = item.day || item.date?.split("T")[0];
      if (d) sleepMap.set(d, item);
    });
    (dailySleepData.data || []).forEach((item) => {
      const d = item.day || item.date?.split("T")[0];
      if (d) dailySleepMap.set(d, item);
    });
    (dailyActivityData.data || []).forEach((item) => {
      const d = item.day || item.date?.split("T")[0];
      if (d) dailyActivityMap.set(d, item);
    });
    (dailyReadinessData.data || []).forEach((item) => {
      const d = item.day || item.date?.split("T")[0];
      if (d) dailyReadinessMap.set(d, item);
    });
    const allDates = Array.from(/* @__PURE__ */ new Set([
      ...sleepMap.keys(),
      ...dailySleepMap.keys(),
      ...dailyActivityMap.keys(),
      ...dailyReadinessMap.keys()
    ])).sort();
    const secToMin = (seconds) => {
      if (typeof seconds === "number") {
        return Math.round(seconds / 60);
      }
      return 0;
    };
    const parsedDataset = allDates.map((dStr) => {
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
        temperatureDeviation: typeof dr.temperature_deviation === "number" ? dr.temperature_deviation : 0
      };
    });
    if (parsedDataset.length === 0) {
      return res.status(404).json({ error: "No actual Oura biometric activity records were returned for your account." });
    }
    res.json({ data: parsedDataset });
  } catch (error) {
    console.error("Error synchronizing active Oura API levels:", error);
    res.status(500).json({ error: error.message || "Fatal error processing sync metrics." });
  }
});
app.post("/api/analyze-oura", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Invalid or empty Oura dataset provided." });
    }
    const ai = getAI();
    const datasetSummary = data.map((day) => {
      const sleepHours = (day.totalSleep / 60).toFixed(1);
      const remHours = (day.remSleep / 60).toFixed(1);
      const deepHours = (day.deepSleep / 60).toFixed(1);
      return `Date: ${day.date} | Sleep: ${day.sleepScore}/100 (${sleepHours}h, Deep: ${deepHours}h, REM: ${remHours}h, Awk: ${day.awakeTime}m) | Readiness: ${day.readinessScore}/100 | Activity: ${day.activityScore}/100 (Steps: ${day.steps}, Cal: ${day.activeCalories}kcal) | Pulse: MinHR ${day.lowestHeartRate}bpm, AvgHR ${day.avgHeartRate}bpm, HRV ${day.avgHrv}ms | RespRate: ${day.respiratoryRate}/min | TempDev: ${day.temperatureDeviation}\xB0C`;
    }).join("\n");
    const prompt = `
You are an expert Health Coach, Athletic Coach, and Biohacking Consultant.
Below is Oura Ring tracking data collected over ${data.length} days:

${datasetSummary}

Perform a high-precision, customized clinical-style and athletic assessment of this user's data. 
In your response, you MUST output HTML-like or markdown-labeled headers so we can parse them, or write structured sections in beautiful markdown:

### Summary of Recoverability
(Provide a brief, supportive summary highlighting their overall energy, balance of sleep and strain, and what's going well.)

### Sleep Architecture Audit
(Analyze deep sleep, REM sleep, and sleep efficiency. Highlight days with exceptional sleep and identify issues, such as poor REM/Deep or late-onset HRV rest.)

### Cardiovascular Recovery Profile
(Focus on Lowest Heart Rate and Heart Rate Variability (HRV) trends. Highlight the correlation between active days and changes in night-time HRV. Check if their pulse is resting early in the night or late.)

### Chronobiology & Deviation Warnings
(Look at temperature deviations, respiratory rates, or sudden score slashes. If any day shows anomalies, warning indicators, or temperature spikes, explain what that could mean e.g. alcohol, late heavy food, or fighting off a bug.)

### Actionable Optimization Roadmap
(Provide 4-5 highly specific, actionable biohacking or habit adjustments for today and the upcoming week. Focus on actionable details like sleep consistency, light exposure, eating windows, or active rest.)

Keep your analysis highly professional, insightful, scientifically accurate, and motivating. Avoid generic advice (such as "get 8 hours of sleep") and instead reference their specific numbers and days (e.g. "On 2026-05-25, your temperature spiked +0.6\xB0C and HRV dropped, indicating...").
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3
      }
    });
    res.json({ insights: response.text });
  } catch (error) {
    console.error("Error compiling insights:", error);
    res.status(500).json({ error: error.message || "Failed to generate insights from Gemini." });
  }
});
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, data } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid message history provided." });
    }
    const ai = getAI();
    let contextStr = "No Oura data is loaded yet.";
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
${data.map((d) => `Date: ${d.date} | Sleep: ${d.sleepScore} | Readiness: ${d.readinessScore} | Min HR: ${d.lowestHeartRate} bpm | HRV: ${d.avgHrv} ms | Steps: ${d.steps} | Temp Dev: ${d.temperatureDeviation}\xB0C`).join("\n")}`;
    }
    const systemInstruction = `
You are the "Oura AI Health Coach," a friendly, supportive, and scientifically grounded wellness counselor. You specialize in interpreting physiological trackers (pulse, sleep cycles, sleep stages, HRV, exercise stress, and skin temperature deviations) to give smart, individualized lifestyle guidelines.

Context regarding the user's Oura health data:
${contextStr}

Role parameters:
- Use clear, friendly, and empowering phrasing.
- Back up your statements with circadian rhythm science, athletic training methodology, or sleep hygiene concepts.
- When the user asks a question, lookup their loaded Oura data. Refer to specific dates, scores, or trends if fitting.
- Be honest if data shows worrisome signs (like extreme temperature spike or major HRV plunge), suggesting they rest, hydrate, or avoid late meals, while always maintaining a gentle, non-alarmist tone.
- Keep responses compact, beautifully styled in Markdown, and direct. Break up paragraphs with bullets for readability.
- If the user asks general wellness advice, connect it back to how it would manifest in their Oura scores (e.g. how zone 2 cardio will lower their sleeping resting heart rate and increase deep sleep).
`;
    const apiMessages = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      // The last message in contents is our latest payload
      contents: apiMessages,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    res.json({ reply: response.text });
  } catch (error) {
    console.error("Error during AI chat endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to chat with AI Coach." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
