import React from 'react';
import { ExternalLink, Landmark, MapPin, Tag } from 'lucide-react';
import { SourceCitation } from '@/lib/rag';

interface SourceCardProps {
  source: SourceCitation;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source }) => {
  return (
    <div className="rounded-lg border border-emerald-900/10 bg-slate-50/80 p-3.5 text-xs text-slate-700 shadow-sm hover:border-[#0F5257]/30 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-semibold text-[10px] uppercase tracking-wider text-[#0F5257] bg-emerald-100/60 px-2 py-0.5 rounded">
          Authoritative Source
        </span>
        {source.section && (
          <span className="text-[10px] font-mono font-medium text-slate-500 flex items-center gap-1">
            <Tag className="w-3 h-3 text-[#D4AF37]" />
            {source.section}
          </span>
        )}
      </div>

      <h4 className="font-semibold text-slate-900 text-sm mb-2 leading-tight">
        {source.title}
      </h4>

      <div className="space-y-1 text-slate-600 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-[#0F5257] shrink-0" />
          <span><strong className="font-medium text-slate-800">Authority:</strong> {source.authority}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span><strong className="font-medium text-slate-800">Jurisdiction:</strong> {source.jurisdiction}</span>
        </div>
      </div>

      {source.source_url && source.source_url.startsWith('http') && (
        <a
          href={source.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#0F5257] hover:text-[#D4AF37] font-semibold text-xs transition-colors pt-1"
        >
          <span>View official source</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};
