/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle, Loader2, ArrowRight, MessageSquare, Clipboard, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { OuraDayData, CoachMessage } from '../types';
import { getApiUrl } from '../utils/api';
import { analyzeOuraClientSide, chatWithCoachClientSide } from '../utils/geminiClient';

interface AICoachProps {
  ouraData: OuraDayData[];
}

const QUICK_PROMPTS = [
  'Проанализируй мое восстановление и сон',
  'Как поднять средний уровень HRV?',
  'Почему рухнули баллы в худший день?',
  'Полезные привычки для глубокого сна',
];

export default function AICoach({ ouraData }: AICoachProps) {
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'chat'>('diagnostics');
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Привет! Я ваш ИИ-тренер Oura. Я проанализировал ваши показатели здоровья за 14 дней. Вы можете задать мне любые вопросы о фазах сна, HRV, минимальном пульсе ночью или кликнуть вкладку **Отчет по трендам**, чтобы составить полную оценку вашего физического состояния!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Custom comprehensive report state
  const [report, setReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Handle generating a report
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReportError(null);
    try {
      const savedKey = localStorage.getItem('gemini_api_key');
      let insightsText = '';
      let success = false;

      // Try server first if local key is not present
      if (!savedKey) {
        try {
          const response = await fetch(getApiUrl('/api/analyze-oura'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: ouraData }),
          });

          if (response.ok) {
            const resData = await response.json();
            insightsText = resData.insights;
            success = true;
          } else if (response.status === 404 || response.status === 405 || response.status === 500) {
            success = false;
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server responded with status ${response.status}`);
          }
        } catch (err) {
          console.log('Server analysis failed, attempting client fallback...', err);
          success = false;
        }
      }

      if (!success) {
        // Fall back to direct client call!
        const key = savedKey || '';
        if (!key) {
          throw new Error('ИИ на сервере временно недоступен и не введен локальный API Ключ Gemini. Пожалуйста, сохраните ваш персональный API-ключ в настройках вверху справа, чтобы использовать ИИ-коуча бесплатно на GitHub Pages!');
        }
        insightsText = await analyzeOuraClientSide(ouraData, key);
      }

      setReport(insightsText);
    } catch (err: any) {
      console.error(err);
      setReportError(err.message || 'Не удалось связаться с ИИ. Проверьте настройки API ключа в верхнем меню.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Generate automatically on raw data load if none exists
  useEffect(() => {
    setReport(null); // Reset report if data changes so they can regenerate
  }, [ouraData]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || chatLoading) return;

    const userMsg: CoachMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setChatLoading(true);

    try {
      const chatHistory = [...messages, userMsg].map(({ role, content }) => ({ role, content }));
      const savedKey = localStorage.getItem('gemini_api_key');
      let replyText = '';
      let success = false;

      if (!savedKey) {
        try {
          const response = await fetch(getApiUrl('/api/chat'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: chatHistory, data: ouraData }),
          });

          if (response.ok) {
            const resData = await response.json();
            replyText = resData.reply;
            success = true;
          } else if (response.status === 404 || response.status === 405 || response.status === 500) {
            success = false;
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server responded with status ${response.status}`);
          }
        } catch (err) {
          console.log('Server chat failed, attempting client fallback...', err);
          success = false;
        }
      }

      if (!success) {
        const key = savedKey || '';
        if (!key) {
          throw new Error('ИИ временно недоступен и не введен локальный API Ключ Gemini. Пожалуйста, введите ваш ключ в настройках вверху справа!');
        }
        replyText = await chatWithCoachClientSide(chatHistory, ouraData, key);
      }

      const coachMsg: CoachMessage = {
        id: `coach-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Ошибка тренера**: ${err.message || 'Ошибка генерации ответа. Проверьте настройки API-ключа.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div id="ai_coach_box" className="bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden h-[600px] shadow-2xl">
      {/* Header section with panel toggle */}
      <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="p-1.5 bg-orange-950 border border-orange-900 text-orange-400 rounded-lg">
              <Bot className="w-4 h-4" />
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-orange-500 border border-zinc-950 rounded-full" />
          </div>
          <div>
            <h3 className="text-sm font-sans font-medium text-white flex items-center gap-1.5">
              ИИ-тренер Oura
              <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">Интеграция ИИ Gemini</p>
          </div>
        </div>

        {/* Action switch */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 border border-zinc-800/80 rounded-lg">
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-1 text-[11px] font-sans font-medium px-3 py-1 rounded-md transition ${
              activeTab === 'diagnostics'
                ? 'bg-zinc-950 text-orange-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clipboard className="w-3 h-3" />
            Отчет по трендам
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1 text-[11px] font-sans font-medium px-3 py-1 rounded-md transition ${
              activeTab === 'chat'
                ? 'bg-zinc-950 text-orange-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            Консультация
          </button>
        </div>
      </div>

      {/* Screen 1: Diagnostic Reports */}
      {activeTab === 'diagnostics' ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-left custom-scrollbar">
          {!report && !isGeneratingReport && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <div className="w-16 h-16 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl flex items-center justify-center text-orange-400 shadow-lg">
                <Sparkles className="w-8 h-8 text-zinc-400" />
              </div>
              <div className="max-w-md">
                <h4 className="text-sm font-sans font-semibold text-white">Создать отчет по трендам здоровья</h4>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-light">
                  Система ИИ Gemini проанализирует ваши показатели сна, HRV, температуры кожи и профили ЧСС за {ouraData.length} дн., чтобы выдать индивидуальное заключение.
                </p>
              </div>

              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-medium text-xs px-5 py-2.5 rounded-xl transition shadow-lg shadow-orange-500/10 cursor-pointer"
              >
                Составить отчет
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {isGeneratingReport && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
                <Sparkles className="w-4 h-4 text-orange-300 absolute top-0 right-0 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-sans font-semibold text-white animate-pulse">Опрос серверов Gemini...</h4>
                <p className="text-[11px] text-zinc-500 font-mono">Анализ {ouraData.length} дней биометрии вашего тела</p>
              </div>
              
              {/* Dynamic simulated step sequence */}
              <div className="text-[10px] text-zinc-400 bg-zinc-950/50 px-3 py-1.5 border border-zinc-900 rounded font-mono max-w-xs leading-normal">
                - Извлечение циркадных ритмов...
                <br />- Корреляция ночного восстановления...
                <br />- Анализ отклонений температуры...
              </div>
            </div>
          )}

          {reportError && (
            <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-xl flex items-start gap-2 max-w-md mx-auto my-6 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <h5 className="text-xs font-sans font-semibold text-red-400">Анализ приостановлен</h5>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-light">{reportError}</p>
                <button
                  onClick={handleGenerateReport}
                  className="flex items-center gap-1.5 text-[10px] text-orange-400 font-semibold underline mt-1 hover:text-orange-300"
                >
                  <RotateCw className="w-3 h-3" /> Повторить анализ
                </button>
              </div>
            </div>
          )}

          {report && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 max-w-3xl mx-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 font-mono">АНАЛИЗ ЗАВЕРШЕН • {new Date().toLocaleDateString()}</span>
                <button
                  onClick={handleGenerateReport}
                  className="text-[10px] text-orange-400 hover:text-orange-300 font-mono flex items-center gap-1 transition"
                >
                  <RotateCw className="w-3 h-3" /> Пересчитать
                </button>
              </div>
              
              <div className="markdown-body text-xs text-zinc-300 leading-relaxed font-sans prose prose-invert max-w-none prose-sm selection:bg-orange-950/50">
                <Markdown>{report}</Markdown>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        // Screen 2: Interactive Consultation Chat
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950/30">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar icon */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                    msg.role === 'user'
                      ? 'bg-zinc-800 border-zinc-700 text-white'
                      : 'bg-orange-950 border-orange-900 text-orange-400'
                  }`}
                >
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div className="space-y-1">
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-xs font-sans leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-orange-500 text-zinc-950 rounded-tr-none font-medium'
                        : 'bg-zinc-900 text-zinc-300 rounded-tl-none border border-zinc-800'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="markdown-body prose prose-invert prose-xs">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    )}
                  </div>
                  <p className={`text-[9px] text-zinc-500 font-mono ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-3 mr-auto max-w-[80%]">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-950 border border-orange-900 text-orange-400 shrink-0 animate-pulse">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions footer */}
          {messages.length === 1 && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 items-center justify-start border-t border-zinc-900">
              {QUICK_PROMPTS.map((prompt, pidx) => (
                <button
                  key={pidx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-[10px] text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg px-2.5 py-1 transition font-sans text-left font-light"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Chat text Input bar */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(inputText);
              }}
              placeholder="Задать вопрос, например: «Как изменилась моя температура?»"
              className="flex-1 bg-zinc-900 border border-zinc-800 text-white text-xs px-3 py-2.5 rounded-xl focus:outline-none focus:border-orange-500 font-sans font-light"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || chatLoading}
              className="p-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center flex items-center justify-center shrink-0 animate-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
