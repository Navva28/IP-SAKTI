import React from 'react';
import { Award, BookOpen, FileCheck, Globe } from 'lucide-react';

interface SuggestionCardProps {
  onSelect: (question: string) => void;
}

export const SUGGESTIONS = [
  {
    category: 'Patentability',
    question: 'Can a traditional Ayurvedic formulation be patented in India?',
    icon: Award,
    description: 'Section 3(p) exclusions, synergy proofs, and patent eligibility criteria.',
  },
  {
    category: 'Traditional Knowledge',
    question: 'How does traditional knowledge affect patent protection?',
    icon: BookOpen,
    description: 'TKDL prior-art searches, public domain rights, and biopiracy defense.',
  },
  {
    category: 'Regulation',
    question: 'What regulatory considerations apply to an Ayurveda-related product?',
    icon: FileCheck,
    description: 'Form 25D manufacturing licenses, Schedule T GMP, and heavy metal testing.',
  },
  {
    category: 'International IP',
    question: 'What should I consider when protecting Ayurvedic knowledge internationally?',
    icon: Globe,
    description: 'WIPO treaties, Nagoya Protocol ABS compliance, and PCT applications.',
  },
];

export const SuggestionCards: React.FC<SuggestionCardProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-6 w-full max-w-4xl">
      {SUGGESTIONS.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <button
            key={idx}
            onClick={() => onSelect(item.question)}
            className="group text-left p-4 rounded-xl bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-[#0F5257]/40 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#0F5257]">
                <IconComponent className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                <span>{item.category}</span>
              </div>
              <p className="text-sm font-medium text-slate-800 group-hover:text-[#0F5257] line-clamp-2">
                "{item.question}"
              </p>
            </div>
            <span className="text-[11px] text-slate-500 mt-2 block">
              {item.description}
            </span>
          </button>
        );
      })}
    </div>
  );
};
