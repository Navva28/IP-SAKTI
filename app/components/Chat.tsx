'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { MessageBubble, DisplayMessage } from './MessageBubble';
import { SuggestionCards } from './SuggestionCard';

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsgId = Date.now().toString();
    const newUserMsg: DisplayMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
    };

    const loadingMsgId = (Date.now() + 1).toString();
    const loadingAssistantMsg: DisplayMessage = {
      id: loadingMsgId,
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages((prev) => [...prev, newUserMsg, loadingAssistantMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Pass full conversation payload for context
      const chatHistory = [...messages, newUserMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? {
                id: loadingMsgId,
                role: 'assistant',
                content: data.answer,
                sources: data.sources || [],
                jurisdiction: data.jurisdiction || '🇮🇳 India',
                confidence: data.confidence || 'Moderate',
                isLoading: false,
              }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed sending chat message:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMsgId
            ? {
                id: loadingMsgId,
                role: 'assistant',
                content: 'Something went wrong while generating the response. Please try again.',
                sources: [],
                confidence: 'Low',
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetSession = () => {
    setMessages([]);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-5xl mx-auto px-4 py-4 w-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[75%] text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0F5257] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/30 shadow-md mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
              IP-SAKTI <span className="text-[#0F5257]">Sahayak</span>
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mb-6 leading-relaxed">
              Your source-grounded AI assistant for Ayurveda Intellectual Property, Traditional Knowledge Digital Library (TKDL) disclosures, and regulatory requirements.
            </p>

            <div className="w-full max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 text-left">
                Suggested Test Questions:
              </p>
              <SuggestionCards onSelect={(q) => handleSendMessage(q)} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 text-xs text-slate-500">
              <span>Session History Active ({messages.length} messages)</span>
              <button
                onClick={handleResetSession}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-rose-600 font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Session</span>
              </button>
            </div>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed bottom input bar */}
      <div className="pt-3 pb-2 bg-slate-50/80 backdrop-blur border-t border-slate-200">
        <div className="relative flex items-center max-w-4xl mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask about Ayurveda IP or regulations..."
            className="w-full pl-4 pr-24 py-3.5 bg-white border border-slate-300 rounded-xl shadow-sm text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F5257] focus:border-[#0F5257] disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-2 px-4 py-2 bg-[#0F5257] hover:bg-[#167A81] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-center text-slate-500 mt-2">
          IP-SAKTI Sahayak provides informational guidance grounded in authoritative texts. Always consult qualified legal counsel for binding advice.
        </p>
      </div>
    </div>
  );
};
