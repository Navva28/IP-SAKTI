import React from 'react';
import { User, Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { SourceCitation } from '@/lib/rag';
import { SourceCard } from './SourceCard';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  jurisdiction?: string;
  confidence?: 'High' | 'Moderate' | 'Low';
  isLoading?: boolean;
}

interface MessageBubbleProps {
  message: DisplayMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="bg-[#0F5257] text-white p-3.5 rounded-2xl rounded-tr-none shadow-sm text-sm font-medium leading-relaxed">
            {message.content}
          </div>
          <div className="w-8 h-8 rounded-full bg-[#0F5257] text-white flex items-center justify-center shrink-0 text-xs shadow-sm">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="flex items-start gap-3 max-w-[95%] sm:max-w-[88%] w-full">
        <div className="w-9 h-9 rounded-xl bg-[#0F5257] text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30 shadow-sm mt-1">
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl rounded-tl-none p-5 shadow-sm text-slate-800 text-sm">
          {message.isLoading ? (
            <div className="flex items-center gap-3 py-2 text-slate-600">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-[#0F5257] rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-[#0F5257] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-[#0F5257] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs font-medium italic text-slate-500">
                Searching authoritative sources & analyzing IP regulations...
              </span>
            </div>
          ) : (
            <>
              {/* Answer Content */}
              <div className="prose prose-slate max-w-none text-slate-800 space-y-3 leading-relaxed whitespace-pre-line font-normal">
                {message.content}
              </div>

              {/* Jurisdiction & Metadata */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600">Jurisdiction:</span>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-[#0F5257] px-2.5 py-0.5 rounded-full border border-emerald-200 font-medium text-xs">
                    {message.jurisdiction || '🇮🇳 India'}
                  </span>
                </div>

                {message.confidence && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="font-medium text-slate-500">Retrieval Grounding:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                        message.confidence === 'High'
                          ? 'bg-emerald-100 text-emerald-800'
                          : message.confidence === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {message.confidence === 'High' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {message.confidence === 'Moderate' && <Info className="w-3 h-3 text-amber-600" />}
                      {message.confidence === 'Low' && <AlertCircle className="w-3 h-3 text-slate-500" />}
                      {message.confidence}
                    </span>
                  </div>
                )}
              </div>

              {/* Cited Sources Cards */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                    <span>Authoritative Sources Cited ({message.sources.length})</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {message.sources.map((src, idx) => (
                      <SourceCard key={idx} source={src} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
