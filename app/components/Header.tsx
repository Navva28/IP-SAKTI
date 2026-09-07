import React from 'react';
import { Scale, BookOpen, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full bg-[#0F5257] text-white border-b border-[#D4AF37]/30 shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-inner">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                IP-SAKTI <span className="text-[#D4AF37] font-semibold">Sahayak</span>
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                SIH Prototype
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 font-medium">
              Ayurveda • Intellectual Property • Regulatory Guidance
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-3 text-xs text-emerald-100">
          <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Authoritative RAG Grounded</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            <span>Jurisdiction: 🇮🇳 India</span>
          </div>
        </div>
      </div>
    </header>
  );
};
