import React, { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  X,
  Send,
  Paperclip,
  FileText,
  FileSpreadsheet,
  File,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Trash2,
  Download,
  Users,
  ShieldAlert,
  Sparkles,
  Search,
  Calendar,
  Eye,
} from 'lucide-react';
import { backendApi, AnnouncementItem, AnnouncementAttachment } from '../services/backendApi';
import { useAuth } from '../context/AuthContext';

interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'sw';
}

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({
  isOpen,
  onClose,
  language = 'en',
}) => {
  const { user, isAdmin } = useAuth();
  const isSw = language === 'sw';

  const [activeTab, setActiveTab] = useState<'feed' | 'compose'>('feed');
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAudienceFilter, setSelectedAudienceFilter] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State for Broadcast
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'heads' | 'admins' | 'teachers' | 'staff'>('all');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      const list = await backendApi.getAnnouncements();
      setAnnouncements(list);
    } catch (err) {
      console.warn('[AnnouncementsModal] Error loading announcements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAnnouncements();
      if (!isAdmin) {
        setActiveTab('feed');
      }
    }
  }, [isOpen, isAdmin]);

  // Subscribe to real-time incoming announcements via SSE
  useEffect(() => {
    const unsubscribe = backendApi.subscribe((event, data) => {
      if (event === 'announcement_broadcast') {
        if (data.action === 'NEW_ANNOUNCEMENT' && data.announcement) {
          setAnnouncements((prev) => [data.announcement, ...prev.filter((a) => a.id !== data.announcement.id)]);
        } else if (data.action === 'DELETE_ANNOUNCEMENT' && data.id) {
          setAnnouncements((prev) => prev.filter((a) => a.id !== data.id));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  // Handle File Attachment Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Limit file size to 15MB for browser storage
      if (file.size > 15 * 1024 * 1024) {
        setStatusMessage({
          type: 'error',
          text: isSw ? `Faili ${file.name} ni kubwa mno (Zidi 15MB).` : `File ${file.name} is too large (exceeds 15MB limit).`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        const newAttachment: AnnouncementAttachment = {
          id: 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleDownloadAttachment = (att: AnnouncementAttachment) => {
    if (att.dataUrl) {
      const link = document.createElement('a');
      link.href = att.dataUrl;
      link.download = att.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Mock / placeholder download demo
      const blob = new Blob([`EduScore Institutional Document: ${att.name}\nSize: ${att.size} bytes\nAuthor: Super Admin`], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = att.name;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setStatusMessage({
        type: 'error',
        text: isSw ? 'Tafadhali jaza kichwa cha habari na ujumbe wa tangazo.' : 'Please provide both title and announcement message.',
      });
      return;
    }

    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await backendApi.sendAnnouncement({
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        priority,
        attachments,
        authorEmail: user?.email || 'deodatusmaliti2@gmail.com',
        authorName: user?.displayName || 'Super Admin Deodatus Maliti',
        authorRole: 'Super Admin',
      });

      setStatusMessage({
        type: 'success',
        text: isSw
          ? `Tangazo limetangazwa kwa ufanisi kwa walengwa (${targetAudience.toUpperCase()}) na vifaa vyote mtandaoni!`
          : `Announcement broadcast successfully dispatched to ${targetAudience.toUpperCase()} audience with ${attachments.length} attachment(s)!`,
      });

      // Reset Form
      setTitle('');
      setContent('');
      setAttachments([]);
      setPriority('normal');
      setTargetAudience('all');
      setActiveTab('feed');
      loadAnnouncements();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to dispatch announcement.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm(isSw ? 'Una uhakika unataka kufuta tangazo hili?' : 'Are you sure you want to delete this announcement?')) return;
    try {
      await backendApi.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setStatusMessage({
        type: 'success',
        text: isSw ? 'Tangazo limefutwa.' : 'Announcement removed successfully.',
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Failed to delete announcement.',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAudience = selectedAudienceFilter === 'all' || a.targetAudience === selectedAudienceFilter || a.targetAudience === 'all';
    return matchesSearch && matchesAudience;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-wide">
                  {isSw ? 'Matangazo ya Kitaasisi & Waraka Rasmi' : 'Institutional Announcements & Official Circulars'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 uppercase">
                  Central Broadcast
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isSw
                  ? 'Mfumo mkuu wa kutuma na kusoma taarifa, miongozo ya NECTA, na nyaraka kwa Wakuu, Wasimamizi na Walimu'
                  : 'Dispatch directives, NECTA schedules, curriculum guidelines, and attached documents to Heads, Administrators, and Teachers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Alert Bar */}
        {statusMessage && (
          <div
            className={`px-5 py-2.5 text-xs flex items-center justify-between font-medium ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('feed')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'feed'
                  ? 'border-amber-500 text-amber-900 bg-white rounded-t-lg shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4 text-amber-600" />
              <span>{isSw ? 'Mbao ya Matangazo (Feed)' : 'Announcements Board'} ({announcements.length})</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('compose')}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'compose'
                    ? 'border-amber-500 text-amber-900 bg-white rounded-t-lg shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Send className="w-4 h-4 text-indigo-600" />
                <span>{isSw ? 'Tuma Tangazo Jipya (Admin)' : 'Send Announcement (Admin)'}</span>
              </button>
            )}
          </div>

          {activeTab === 'feed' && (
            <div className="flex items-center gap-2 pb-2">
              <select
                value={selectedAudienceFilter}
                onChange={(e) => setSelectedAudienceFilter(e.target.value)}
                className="text-[11px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">{isSw ? 'Walengwa Wote' : 'All Audiences'}</option>
                <option value="heads">{isSw ? 'Wakuu wa Shule / Taaluma' : 'All Heads / Academic Leaders'}</option>
                <option value="admins">{isSw ? 'Wasimamizi wa Mfumo' : 'School Administrators'}</option>
                <option value="teachers">{isSw ? 'Walimu wa Masomo' : 'Subject Teachers'}</option>
                <option value="staff">{isSw ? 'Wafanyakazi Wote' : 'Faculty & Staff'}</option>
              </select>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/40">
          {/* TAB 1: COMPOSE ANNOUNCEMENT (Super Admin / Admin only) */}
          {activeTab === 'compose' && isAdmin && (
            <form onSubmit={handleSendAnnouncement} className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    📢
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {isSw ? 'Tunga Tangazo au Waraka Rasmi' : 'Draft Institutional Directive or Circular'}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Dispatched instantly in real-time to all connected faculty and administrator screens.
                    </p>
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                  Author: <span className="text-amber-900 font-black">Super Admin Deodatus Maliti</span>
                </div>
              </div>

              {/* Target Audience & Priority Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isSw ? 'Walengwa wa Tangazo (Target Audience)' : 'Target Audience'}</span>
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">👥 All Institutional Personnel (Heads, Admins & Teachers)</option>
                    <option value="heads">🏫 All Heads of School & Academic Department Leaders</option>
                    <option value="admins">🛡️ School Administrators & Registrars</option>
                    <option value="teachers">👨‍🏫 All Subject Teachers & Assessment Coordinators</option>
                    <option value="staff">🏛️ General Faculty & Support Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isSw ? 'Kiwango cha Umuhimu (Priority Level)' : 'Priority & Classification'}</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPriority('normal')}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        priority === 'normal'
                          ? 'bg-blue-50 text-blue-800 border-blue-400 ring-2 ring-blue-500/20 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      📘 Standard Notice
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('important')}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        priority === 'important'
                          ? 'bg-amber-50 text-amber-900 border-amber-400 ring-2 ring-amber-500/20 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      ⚠️ Important
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('urgent')}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        priority === 'urgent'
                          ? 'bg-rose-50 text-rose-900 border-rose-400 ring-2 ring-rose-500/20 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🚨 Urgent Directive
                    </button>
                  </div>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {isSw ? 'Kichwa cha Tangazo / Waraka' : 'Announcement Subject / Circular Title'}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isSw ? 'mf. Waraka wa NECTA: Makataa ya Kuingiza Alama za CA...' : 'e.g. NECTA Form IV Mock Moderation & Continuous Assessment Lockout Notice'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {isSw ? 'Ujumbe Kamili wa Tangazo & Maelekezo' : 'Announcement Directive & Detailed Instructions'}
                </label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={isSw ? 'Andika taarifa rasmi kwa kina hapa...' : 'Type official circular body, action items, dates, and instructions for faculty...'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans leading-relaxed"
                />
              </div>

              {/* File Attachments Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isSw ? 'Ambatisha Nyaraka (PDF, Word, Excel, Picha)' : 'Attach Supporting Documents & Circular Files'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{isSw ? 'Chagua Faili' : 'Attach Document'}</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip"
                    className="hidden"
                  />
                </div>

                {attachments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          {att.name.endsWith('.pdf') ? (
                            <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : att.name.endsWith('.xls') || att.name.endsWith('.xlsx') || att.name.endsWith('.csv') ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <File className="w-4 h-4 text-indigo-600 shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="font-semibold text-slate-900 truncate">{att.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{formatFileSize(att.size)}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No files attached yet. You can attach NECTA circulars, rubrics, schedules or templates.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('feed')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {isSw ? 'Ghairi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSending || !title.trim() || !content.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isSw ? 'Tuma Tangazo Moja kwa Moja' : 'Broadcast to All Faculty Nodes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ANNOUNCEMENTS FEED (All users) */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isSw ? 'Tafuta matangazo, maelekezo au nyaraka...' : 'Search announcements, directives, or circular attachments...'}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                />
              </div>

              {/* Feed List */}
              {isLoading ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading institutional circulars & directives...</span>
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                  <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">
                    {isSw ? 'Hakuna Matangazo kwa Sasa' : 'No Active Announcements Found'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {searchQuery
                      ? 'No circular matched your search criteria.'
                      : 'New institutional directives from the Super Admin will appear here in real time.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAnnouncements.map((item) => {
                    const isUrgent = item.priority === 'urgent';
                    const isImportant = item.priority === 'important';

                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-2xl p-5 border shadow-sm space-y-3 transition-all ${
                          isUrgent
                            ? 'border-rose-300 bg-gradient-to-br from-rose-50/30 to-white'
                            : isImportant
                            ? 'border-amber-300 bg-gradient-to-br from-amber-50/20 to-white'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Header: Priority, Audience, Date, Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isUrgent ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1 shadow-2xs">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                <span>URGENT DIRECTIVE</span>
                              </span>
                            ) : isImportant ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>IMPORTANT NOTICE</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                                <Bell className="w-3 h-3 text-blue-600" />
                                <span>STANDARD NOTICE</span>
                              </span>
                            )}

                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                              Target: {item.targetAudience.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAnnouncement(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Delete announcement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Title & Author */}
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700">Issued by:</span>
                            <span className="text-amber-900 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              {item.authorName} ({item.authorRole})
                            </span>
                          </p>
                        </div>

                        {/* Content Body */}
                        <div className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                          {item.content}
                        </div>

                        {/* Attached Documents List */}
                        {item.attachments && item.attachments.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                              <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Attached Circular Files & Documents ({item.attachments.length}):</span>
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {item.attachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-amber-300 transition-all flex items-center justify-between shadow-2xs text-xs"
                                >
                                  <div className="flex items-center space-x-2 truncate min-w-0">
                                    {att.name.endsWith('.pdf') ? (
                                      <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                                    ) : att.name.endsWith('.xls') || att.name.endsWith('.xlsx') || att.name.endsWith('.csv') ? (
                                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                                    ) : (
                                      <File className="w-4 h-4 text-indigo-600 shrink-0" />
                                    )}
                                    <div className="truncate">
                                      <div className="font-semibold text-slate-900 truncate" title={att.name}>
                                        {att.name}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {formatFileSize(att.size)}
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadAttachment(att)}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer shrink-0 ml-2 border border-amber-200"
                                    title="Download or open attached document"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>EduScore Master Real-Time Announcement Protocol</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-300 cursor-pointer shadow-2xs transition-colors"
          >
            {isSw ? 'Funga' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
