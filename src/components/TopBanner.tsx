import React from 'react';
import { Calendar, Award, Globe, Code2, Server, LogIn, User, Megaphone } from 'lucide-react';
import { DICTIONARY } from '../utils/necta';
import { useAuth } from '../context/AuthContext';

interface TopBannerProps {
  language: 'en' | 'sw';
  onToggleLanguage: () => void;
  onOpenStandalone: () => void;
  onOpenAuthModal?: () => void;
  onOpenBackendTab?: () => void;
  onOpenAnnouncements?: () => void;
}

export const TopBanner: React.FC<TopBannerProps> = ({
  language,
  onToggleLanguage,
  onOpenStandalone,
  onOpenAuthModal,
  onOpenBackendTab,
  onOpenAnnouncements,
}) => {
  const dict = DICTIONARY[language];
  const { user, profile, isAdmin } = useAuth();
  const isSw = language === 'sw';

  // Compute display label for login button - Super Admin must be displayed as "Super Admin", never "Eng."
  const getLoginButtonLabel = () => {
    if (!profile) return isSw ? 'Ingia' : 'Sign In';
    if (profile.role === 'admin' || profile.email === 'deodatusmaliti2@gmail.com' || isAdmin) {
      return 'Super Admin';
    }
    const name = profile.displayName || '';
    if (name.startsWith('Eng.') || name.startsWith('Eng ')) {
      return 'Super Admin';
    }
    const first = name.split(' ')[0];
    return first || (profile.role ? profile.role.toUpperCase() : 'User');
  };

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

      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 text-xs">
        {/* Admin Announcements Broadcast Button */}
        {onOpenAnnouncements && (
          <button
            onClick={onOpenAnnouncements}
            className="flex items-center space-x-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer"
            title="Send Institutional Announcement to Heads, Administrators & Teachers (with Document Attachments)"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isSw ? 'Tangazo' : 'Announcements'}</span>
          </button>
        )}

        {/* Real-time Cloud DB Button */}
        <button
          onClick={onOpenBackendTab}
          className="hidden sm:flex items-center space-x-1.5 bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 px-2.5 py-1 rounded border border-indigo-800/80 font-semibold text-[11px] transition-colors cursor-pointer"
          title={isAdmin ? "Open Cloud Backend & Realtime Sync Engine (Admin Access Active)" : "Cloud Backend Control Room (Admin Role Required)"}
        >
          <Server className="w-3.5 h-3.5 text-indigo-400" />
          <span>Backend: <strong className={isAdmin ? "text-emerald-400" : "text-amber-400"}>{isAdmin ? "Live (Admin)" : "Restricted"}</strong></span>
        </button>

        <span className="hidden md:flex items-center text-slate-300 text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
          <span>{dict.academicYear}</span>
        </span>

        {/* User Account / Login button - Displays "Super Admin" for super administrator */}
        <button
          id="btn-user-auth-status"
          onClick={onOpenAuthModal}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-2.5 py-1 rounded text-xs font-semibold transition border border-slate-700 cursor-pointer shadow-xs"
          title={`User Authentication: ${profile ? profile.displayName + ' (' + profile.role + ')' : 'Not Logged In'}`}
        >
          {profile ? (
            <>
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 flex items-center justify-center text-[9px] font-black text-slate-950">
                ✓
              </div>
              <span className="font-bold text-amber-300 truncate max-w-[130px]">
                {getLoginButtonLabel()}
              </span>
            </>
          ) : (
            <>
              <LogIn className="w-3 h-3 text-amber-400" />
              <span>{isSw ? 'Ingia' : 'Sign In'}</span>
            </>
          )}
        </button>

        {/* Language switch */}
        <button
          id="btn-language-toggle"
          onClick={onToggleLanguage}
          title="Switch Language (English / Kiswahili)"
          className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded text-xs font-semibold transition border border-slate-700 cursor-pointer"
        >
          <Globe className="w-3 h-3" />
          <span>{language === 'en' ? 'SW' : 'EN'}</span>
        </button>

        {/* Standalone HTML button */}
        <button
          id="btn-open-standalone-modal"
          onClick={onOpenStandalone}
          className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded font-bold text-xs transition shadow-xs cursor-pointer"
        >
          <Code2 className="w-3 h-3" />
          <span className="hidden xs:inline">Standalone</span>
        </button>
      </div>
    </div>
  );
};
