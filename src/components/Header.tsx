import React from 'react';
import { Menu, Search, Printer, Download, Sparkles } from 'lucide-react';
import { ViewTab } from '../types';
import { DICTIONARY } from '../utils/necta';

interface HeaderProps {
  currentTab: ViewTab;
  onOpenMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  language: 'en' | 'sw';
  onPrint: () => void;
  onExportCsv: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobileMenu,
  searchQuery,
  onSearchChange,
  language,
  onPrint,
  onExportCsv,
}) => {
  const dict = DICTIONARY[language];

  const getHeaders = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: language === 'en' ? 'National & Inter-School Dashboard' : 'Dashibodi ya Kitaifa & Shuleni',
          subtitle: language === 'en'
            ? 'Cross-examining school metrics against NECTA regional benchmarks and past performance data indicators.'
            : 'Uchambuzi wa takwimu za shule dhidi ya viwango vya kitaifa vya NECTA na matokeo yaliyopita.',
        };
      case 'curriculum':
        return {
          title: language === 'en' ? 'Curriculum Planning & Syllabus Pace Log' : 'Mpango wa Mtaala & Kasi ya Muhtasari',
          subtitle: language === 'en'
            ? 'Monitoring class coverage vectors mapped against official Tanzanian Institute of Education (TIE) standard matrices.'
            : 'Ufuatiliaji wa ufundishaji wa mada kulingana na miongozo ya Taasisi ya Elimu Tanzania (TET/TIE).',
        };
      case 'students':
        return {
          title: language === 'en' ? 'Student Tracker Matrix' : 'Matrix ya Ufuatiliaji wa Wanafunzi',
          subtitle: language === 'en'
            ? 'Granular tracking models mapping grades, parent reporting triggers, and localized support tracks.'
            : 'Ufuatiliaji wa kina wa matokeo ya wanafunzi, viwango vya NECTA na ushirikishwaji wa wazazi.',
        };
      case 'teacher':
        return {
          title: language === 'en' ? 'Teacher Assessment Workspace' : 'Dawati la Tathmini la Mwalimu',
          subtitle: language === 'en'
            ? 'Continuous assessment grading, formative feedback logs, and auto-calculating term metrics.'
            : 'Kuingiza alama za majaribio, maoni ya kukuza mwanafunzi na kukokotoa wastani kiotomatiki.',
        };
      case 'recommendations':
        return {
          title: language === 'en' ? 'AI Strategic Recommendations Engine' : 'Injini ya Ushauri wa Kimkakati ya AI',
          subtitle: language === 'en'
            ? 'Automated advisory notices targeted directly at resolving systemic NECTA bottleneck parameters.'
            : 'Ushauri wa kimkakati wa kiotomatiki na AI wa kutatua changamoto za matokeo ya NECTA.',
        };
      case 'parentPortal':
        return {
          title: language === 'en' ? 'Parent Real-Time Gateway Interface' : 'Lango la Mawasiliano ya Wazazi Moja kwa Moja',
          subtitle: language === 'en'
            ? 'Live terminal viewpoint illustrating telemetry transmission paths directly to legal guardians.'
            : 'Taarifa za wakati halisi za mahudhurio, matokeo na ada zinazotumwa kwa wazazi na walezi.',
        };
      case 'district':
        return {
          title: language === 'en' ? 'District & Regional Benchmarking' : 'Ulinganisho wa Wilaya na Mikoa',
          subtitle: language === 'en'
            ? 'Comparative academic performance indices across Arusha, Dar es Salaam, Dodoma and Morogoro.'
            : 'Viwango vya ufaulu wa shule kulinganisha wilaya za Kinondoni, Arusha Mjini, Dodoma na nyinginezo.',
        };
      case 'reports':
        return {
          title: language === 'en' ? 'Official Reports & Transcripts Centre' : 'Kituo cha Ripoti & Vyeti Rasmi',
          subtitle: language === 'en'
            ? 'Formatted printable student report cards, academic transcripts, and institutional summaries.'
            : 'Ripoti rasmi za maendeleo ya mwanafunzi, muhtasari wa ufaulu na vyeti tayari kuchapwa.',
        };
      case 'messages':
        return {
          title: language === 'en' ? 'Parent Direct Communications' : 'Mawasiliano ya Moja kwa Moja na Wazazi',
          subtitle: language === 'en'
            ? 'Automated SMS, WhatsApp and Email templates with live academic progress indicators.'
            : 'Kutuma ujumbe mfupi wa SMS na WhatsApp kwa wazazi wenye matokeo na mahudhurio ya hivi punde.',
        };
      case 'data':
        return {
          title: language === 'en' ? 'Data Centre & Records Management' : 'Kituo cha Data & Kumbukumbu',
          subtitle: language === 'en'
            ? 'Export and import complete student datasets in standard CSV, or restore initial demo data.'
            : 'Pakua au ingiza data ya wanafunzi kwa mfumo wa CSV au rejesha data ya mfano wakati wowote.',
        };
      case 'settings':
        return {
          title: language === 'en' ? 'Institutional Configuration & Settings' : 'Mipangilio ya Shule & Mfumo',
          subtitle: language === 'en'
            ? 'Manage school profile, active term, academic year, regional metadata, and display preferences.'
            : 'Badilisha jina la shule, eneo, muhula wa sasa, mwaka wa masomo na lugha.',
        };
      default:
        return {
          title: 'EduScore TZ Portal',
          subtitle: 'Tanzanian National Curriculum & Academic Management',
        };
    }
  };

  const { title, subtitle } = getHeaders();

  return (
    <header id="main-header" className="bg-white border-b border-gray-200 px-4 sm:px-8 py-3.5 sm:py-4 shadow-xs no-print">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Mobile hamburger button */}
          <button
            id="btn-open-mobile-sidebar"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg focus:outline-hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 id="view-title" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h2>
            <p id="view-subtitle" className="text-xs text-gray-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 w-full md:w-auto justify-between md:justify-end">
          {/* Search box */}
          <div className="relative flex-1 md:w-60 lg:w-72">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              id="header-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={dict.searchPlaceholder}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
            />
          </div>

          {/* Quick print button */}
          <button
            id="btn-header-print"
            onClick={onPrint}
            title={dict.printReport}
            className="p-2 text-slate-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold transition shrink-0"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Export CSV button */}
          <button
            id="btn-header-export-csv"
            onClick={onExportCsv}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{dict.exportCsvPdf}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
