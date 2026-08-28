'use client';

import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function AiAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: `Hello ${user?.name || 'Officer'}! I am **COAL-GUARD AI Governance Copilot**.\n\nI query live database records across all Coal India subsidiaries to answer questions on statutory compliance, high-risk mines, unresolved violations, contractor performance, and overdue corrective actions.\n\nHow can I assist your governance audit today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'Which mines are high risk?',
    'Which compliance requirements are overdue?',
    'Show unresolved safety violations',
    'Which contractors have low compliance?',
    'What corrective actions are overdue?',
  ];

  const handleSend = async (questionText?: string) => {
    const query = questionText || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      if (res.ok) {
        const json = await res.json();
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: json.reply || 'No response returned.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-amber-400" /> AI Governance Copilot Assistant
          </h1>
          <p className="text-xs text-slate-400">
            Natural language conversational assistant connected directly to live PostgreSQL/Prisma database records.
          </p>
        </div>

        <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-3 py-1 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" /> Live DB Connected
        </span>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
        {/* Quick Sample Prompts Bar */}
        <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-bold whitespace-nowrap px-1">Quick Prompts:</span>
          {samplePrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg border border-slate-800 whitespace-nowrap transition-all text-[11px]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Message History Window */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-3xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  m.sender === 'user' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs space-y-1 shadow-md ${
                  m.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                <div>{m.text}</div>
                <div
                  className={`text-[9px] text-right font-mono ${
                    m.sender === 'user' ? 'text-slate-900/70' : 'text-slate-500'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Querying database tables...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask AI Assistant about mines, compliance, violations, or contractors..."
            className="flex-1 bg-slate-900 border border-slate-800 text-white text-xs px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="p-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
