import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Globe, School, Plus, X, BookOpen, Layers } from 'lucide-react';
import { AppSettings, InstitutionType, TermType } from '../types';
import { ALL_TERMS } from '../utils/necta';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  language: 'en' | 'sw';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  language,
}) => {
  const [formState, setFormState] = useState<AppSettings>(settings);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [newCustomSubject, setNewCustomSubject] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formState);
    setSavedToast('Institutional settings and curriculum catalog saved successfully in your local browser session.');
    setTimeout(() => setSavedToast(null), 4000);
  };

  const handleAddSubject = () => {
    if (!newCustomSubject.trim()) return;
    const currentList = formState.configuredSubjects || [];
    if (!currentList.includes(newCustomSubject.trim())) {
      setFormState({
        ...formState,
        configuredSubjects: [...currentList, newCustomSubject.trim()],
      });
    }
    setNewCustomSubject('');
  };

  const handleRemoveSubject = (subj: string) => {
    const currentList = formState.configuredSubjects || [];
    setFormState({
      ...formState,
      configuredSubjects: currentList.filter((s) => s !== subj),
    });
  };

  return (
    <div id="view-settings" className="space-y-6 sm:space-y-8 animate-fadeIn max-w-4xl">
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'en' ? 'Institutional Configuration & System Settings' : 'Mipangilio ya Taasisi na Mfumo'}
            </h3>
            <p className="text-xs text-gray-500">
              Customize school credentials, regional jurisdiction, academic cycle (4 Terms), institution level, and active curriculum subjects.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* School Name & Motto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Institution Name (School)
              </label>
              <input
                type="text"
                required
                value={formState.schoolName}
                onChange={(e) => setFormState({ ...formState, schoolName: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg font-semibold bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                School Motto
              </label>
              <input
                type="text"
                value={formState.schoolMotto}
                onChange={(e) => setFormState({ ...formState, schoolMotto: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Region & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Region</label>
              <input
                type="text"
                value={formState.region}
                onChange={(e) => setFormState({ ...formState, region: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">District</label>
              <input
                type="text"
                value={formState.district}
                onChange={(e) => setFormState({ ...formState, district: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Institution Type, Academic Year, Active 4-Term Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Institution Category</label>
              <select
                value={formState.institutionType || 'secondary_olevel'}
                onChange={(e) => setFormState({ ...formState, institutionType: e.target.value as InstitutionType })}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
              >
                <option value="secondary_olevel">Secondary O-Level (Form I - IV)</option>
                <option value="secondary_alevel">Secondary A-Level (Form V - VI)</option>
                <option value="secondary_combined">Combined Secondary (Form I - VI)</option>
                <option value="primary">Primary School (Standard I - VII)</option>
                <option value="vocational_college">Vocational / College (VETA)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Academic Year</label>
              <input
                type="text"
                value={formState.academicYear}
                onChange={(e) => setFormState({ ...formState, academicYear: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Active 4-Term Cycle</label>
              <select
                value={formState.activeTerm}
                onChange={(e) => setFormState({ ...formState, activeTerm: e.target.value as TermType })}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
              >
                <option value="Term 1">Term 1 (January - March)</option>
                <option value="Term 2">Term 2 (April - June)</option>
                <option value="Term 3">Term 3 (July - September)</option>
                <option value="Term 4">Term 4 (October - December)</option>
              </select>
            </div>
          </div>

          {/* Interface Language & Headteacher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Default Interface Language</label>
              <select
                value={formState.language}
                onChange={(e) => setFormState({ ...formState, language: e.target.value as 'en' | 'sw' })}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
              >
                <option value="en">English (Official NECTA)</option>
                <option value="sw">Kiswahili (Taifa)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Head of School / Signatory</label>
              <input
                type="text"
                value={formState.headteacherName}
                onChange={(e) => setFormState({ ...formState, headteacherName: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
              />
            </div>
          </div>

          {/* Customized School Subjects Catalog */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-slate-900 text-xs">
                Active School Subjects Catalog (Tailored per School Offering)
              </h4>
            </div>
            <p className="text-[11px] text-slate-500">
              Configure which subjects are taught at your institution. These dynamically appear in CSV templates and student score entry forms.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {(formState.configuredSubjects || []).map((sub) => (
                <span
                  key={sub}
                  className="bg-white border border-slate-300 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 shadow-2xs"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(sub)}
                    className="text-slate-400 hover:text-red-500 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="text"
                placeholder="Add specialized subject (e.g. Agriculture, Arabic, ICT)..."
                value={newCustomSubject}
                onChange={(e) => setNewCustomSubject(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubject();
                  }
                }}
                className="flex-1 p-2 border border-gray-300 rounded-lg bg-white text-xs"
              />
              <button
                type="button"
                onClick={handleAddSubject}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              id="btn-save-settings"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Institutional Settings</span>
            </button>
          </div>
        </form>

        {savedToast && (
          <div className="mt-4 p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}
      </div>
    </div>
  );
};
