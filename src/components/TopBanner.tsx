import React from 'react';
import { Calendar, Award, Globe, Code2 } from 'lucide-react';
import { DICTIONARY } from '../utils/necta';

interface TopBannerProps {
  language: 'en' | 'sw';
  onToggleLanguage: () => void;
  onOpenStandalone: () => void;
}

export const TopBanner: React.FC<TopBannerProps> = ({
  language,
  onToggleLanguage,
  onOpenStandalone,
}) => {
  const dict = DICTIONARY[language];

  return (
    <div id="top-status-banner" className="no-print bg-slate-950 border-b border-slate-800 text-white text-xs px-3 sm:px-6 py-2 flex flex-wrap justify-between items-center gap-2 shadow-sm">
      <div className="flex items-center space-x-2 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="truncate text-slate-200">
          <strong className="text-white">EduScore TZ Core v1.0</strong>
          <span className="hidden sm:inline text-slate-400 mx-1.5">|</span>
          <span className="hidden sm:inline text-emerald-400 font-medium">{dict.curriculumBanner.split('|')[1]?.trim() || 'Tanzanian National Curriculum Active'}</span>
        </span>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0 text-xs">
        <span className="hidden md:flex items-center text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
          <span>{dict.academicYear}</span>
        </span>
        <span className="hidden sm:inline-flex items-center bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded border border-blue-800/80 font-medium text-[11px]">
          <Award className="w-3 h-3 mr-1 text-blue-400" />
          {dict.nectaAlignment}
        </span>

        {/* Language switch */}
        <button
          id="btn-language-toggle"
          onClick={onToggleLanguage}
          title="Switch Language (English / Kiswahili)"
          className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded text-xs font-semibold transition border border-slate-700"
        >
          <Globe className="w-3 h-3" />
          <span>{language === 'en' ? 'SW' : 'EN'}</span>
        </button>

        {/* Standalone HTML button */}
        <button
          id="btn-open-standalone-modal"
          onClick={onOpenStandalone}
          className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded font-bold text-xs transition shadow-xs"
        >
          <Code2 className="w-3 h-3" />
          <span className="hidden xs:inline">Standalone HTML</span>
        </button>
      </div>
    </div>
  );
};
