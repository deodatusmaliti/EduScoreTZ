import React from 'react';
import {
  GraduationCap,
  PieChart,
  BookOpen,
  Users,
  Sparkles,
  HeartHandshake,
  UserCheck,
  Building2,
  FileText,
  MessageSquare,
  Database,
  Settings,
  X,
  Download
} from 'lucide-react';
import { ViewTab } from '../types';
import { DICTIONARY } from '../utils/necta';

interface SidebarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  language: 'en' | 'sw';
  onExportStandalone: () => void;
  headteacherName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  language,
  onExportStandalone,
  headteacherName,
}) => {
  const dict = DICTIONARY[language];

  const navItems = [
    {
      group: dict.mainManagement,
      items: [
        { id: 'dashboard' as ViewTab, label: dict.navDashboard, icon: PieChart, color: 'text-amber-400' },
        { id: 'curriculum' as ViewTab, label: dict.navCurriculum, icon: BookOpen, color: 'text-emerald-400' },
        { id: 'students' as ViewTab, label: dict.navStudents, icon: Users, color: 'text-sky-400' },
        { id: 'teacher' as ViewTab, label: dict.navTeacher, icon: UserCheck, color: 'text-indigo-400' },
        { id: 'recommendations' as ViewTab, label: dict.navAi, icon: Sparkles, color: 'text-purple-400' },
      ],
    },
    {
      group: dict.stakeholderAccess,
      items: [
        { id: 'parentPortal' as ViewTab, label: dict.navParent, icon: HeartHandshake, color: 'text-pink-400' },
        { id: 'messages' as ViewTab, label: dict.navMessages, icon: MessageSquare, color: 'text-amber-400' },
        { id: 'district' as ViewTab, label: dict.navDistrict, icon: Building2, color: 'text-teal-400' },
        { id: 'reports' as ViewTab, label: dict.navReports, icon: FileText, color: 'text-cyan-400' },
        { id: 'data' as ViewTab, label: dict.navData, icon: Database, color: 'text-emerald-400' },
        { id: 'settings' as ViewTab, label: dict.navSettings, icon: Settings, color: 'text-slate-400' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Top brand */}
        <div className="flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500 rounded-xl text-slate-950 shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-wider text-amber-400 font-serif">
                  {dict.systemTitle}
                </h1>
                <p className="text-[11px] text-slate-400 font-medium tracking-tight">
                  {dict.systemTagline}
                </p>
              </div>
            </div>
            {/* Mobile close button */}
            <button
              id="btn-close-mobile-sidebar"
              onClick={onCloseMobile}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                  {group.group}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`nav-${item.id}`}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-lg transition text-left group ${
                        isActive
                          ? 'bg-slate-800 text-white border-l-4 border-amber-500 shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mr-3 shrink-0 ${isActive ? item.color : 'text-slate-400 group-hover:text-slate-200'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Quick action button inside navigation */}
            <div className="pt-2 px-2">
              <button
                id="btn-sidebar-export-html"
                onClick={onExportStandalone}
                className="w-full py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Standalone HTML</span>
              </button>
            </div>
          </nav>
        </div>

        {/* User context footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-amber-400 border border-slate-700 text-xs shrink-0">
              TZ
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{headteacherName}</p>
              <p className="text-[11px] text-slate-400 flex items-center truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 shrink-0 inline-block"></span>
                National Portal Admin
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
