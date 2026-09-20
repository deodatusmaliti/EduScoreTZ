import React, { useState } from 'react';
import {
  BookOpen,
  AlertTriangle,
  FlaskConical,
  Calculator,
  Languages,
  Clock,
  Sparkles,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { CurriculumSubject } from '../types';

interface CurriculumViewProps {
  subjects: CurriculumSubject[];
  language: 'en' | 'sw';
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({ subjects, language }) => {
  const [selectedLevel, setSelectedLevel] = useState<'oLevel' | 'aLevel'>('oLevel');

  const oLevelData = [
    { name: 'Mathematics', code: 'B/M', covered: 64, target: 78, behind: true },
    { name: 'English', code: 'ENG', covered: 85, target: 78, behind: false },
    { name: 'Kiswahili', code: 'KIS', covered: 90, target: 78, behind: false },
    { name: 'Biology', code: 'BIO', covered: 88.5, target: 78, behind: false },
    { name: 'Chemistry', code: 'CHEM', covered: 72, target: 78, behind: false },
    { name: 'Physics', code: 'PHY', covered: 68, target: 78, behind: true },
    { name: 'Geography', code: 'GEO', covered: 81, target: 78, behind: false },
    { name: 'History', code: 'HIST', covered: 84, target: 78, behind: false },
  ];

  const aLevelData = [
    { name: 'Pure Math', code: 'PM', covered: 55, target: 78, behind: true },
    { name: 'Accountancy', code: 'ACC', covered: 78, target: 78, behind: false },
    { name: 'Economics', code: 'ECON', covered: 82, target: 78, behind: false },
    { name: 'Geography', code: 'GEO', covered: 88, target: 78, behind: false },
    { name: 'Physics', code: 'PHY', covered: 60, target: 78, behind: true },
    { name: 'Chemistry', code: 'CHEM', covered: 64, target: 78, behind: true },
    { name: 'Biology', code: 'BIO', covered: 70, target: 78, behind: false },
    { name: 'BAM (App. Math)', code: 'BAM', covered: 85, target: 78, behind: false },
  ];

  const chartData = selectedLevel === 'oLevel' ? oLevelData : aLevelData;

  return (
    <div id="view-curriculum" className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Card: Scheme of Work Pace */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {language === 'en' ? 'National Scheme of Work Coverage Ledger' : 'Muhtasari wa Utekelezaji wa Mtaala wa TET'}
            </h3>
            <p className="text-xs text-gray-500">
              {language === 'en'
                ? 'Track structural completion rates of curriculum topics based on unified Tanzanian Institute of Education (TIE) standards.'
                : 'Ufuatiliaji wa kasi ya ufundishaji kulingana na viwango rasmi vya Taasisi ya Elimu Tanzania.'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              id="curriculumFormFilter"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as 'oLevel' | 'aLevel')}
              className="text-xs px-3 py-2 rounded-lg border border-gray-300 bg-white shadow-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-semibold"
            >
              <option value="oLevel">O-Level Framework (Form 1 - 4)</option>
              <option value="aLevel">A-Level Combinations (Form 5 - 6)</option>
            </select>
          </div>
        </div>

        {/* Chart + Bottleneck Notification layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {/* Syllabus Pace Bar Chart */}
          <div className="lg:col-span-2 bg-slate-50/70 p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Syllabus Coverage Pace Index (%)
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  National Benchmark: 78.0%
                </span>
              </div>

              {/* Responsive SVG Bar Chart */}
              <div className="w-full overflow-x-auto no-scrollbar">
                <div className="min-w-[440px] space-y-3 py-1">
                  {chartData.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800 flex items-center">
                          <span className="w-12 text-slate-500 font-mono text-[11px]">{item.code}</span>
                          <span>{item.name}</span>
                        </span>
                        <span className={`font-bold ${item.behind ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {item.covered}% {item.behind ? '(Behind schedule)' : '(On track)'}
                        </span>
                      </div>
                      <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        {/* Target line indicator at 78% */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-slate-700 z-10"
                          style={{ left: '78%' }}
                          title="TIE National Target (78%)"
                        />
                        {/* Covered bar */}
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.behind ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, item.covered)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 mt-3 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs mr-1"></span> On/Ahead Target
                </span>
                <span className="flex items-center">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-xs mr-1"></span> Pacing Deficit
                </span>
              </div>
              <span className="font-mono">Black marker = 78% TIE Target</span>
            </div>
          </div>

          {/* Bottleneck Alert Box */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-xl flex flex-col justify-between shadow-md border border-slate-800">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Curriculum Bottleneck Detected</span>
              </div>
              <h4 className="text-base font-bold text-white tracking-tight">
                Form IV Mathematics Syllabus
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Current logs indicate subtopics <strong>"Probability & Trigonometry"</strong> are pacing <strong>18 days behind</strong> the localized master schedule required for NECTA CSEE readiness.
              </p>

              <div className="mt-4 p-3 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Impact Analysis</span>
                <span className="text-slate-300">Affects 215 registered candidates across Streams Alpha and Beta.</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4">
              <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Recommended Mitigation</p>
              <p className="text-xs text-amber-300 font-semibold mt-1 flex items-start">
                <Sparkles className="w-3.5 h-3.5 mr-1 shrink-0 mt-0.5 text-amber-400" />
                <span>Deploy 6 extra remedial block periods on Saturday mornings before national mock sessions commence.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TIE Subject Mapping & Faculty Data Cards */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
            TIE Subject Mapping & Assigned Faculty Data
          </h4>
          <span className="text-xs font-semibold text-slate-500">{subjects.length} Subjects Configured</span>
        </div>

        <div className="divide-y divide-gray-100">
          {subjects.map((subj) => (
            <div
              key={subj.id}
              className="p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/60 transition"
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`p-3 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                    subj.code === 'BIO' || subj.code === 'CHEM'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : subj.code === 'B/M'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : subj.code === 'PHY'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {subj.code}
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>{subj.name}</span>
                    <span className="text-xs font-normal text-gray-500">({subj.formLevels})</span>
                  </h5>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Assigned Educators: <strong>{subj.assignedTeachers.join(', ')}</strong>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold uppercase px-2 py-0.5 rounded">
                      {subj.syllabusCategory}
                    </span>
                    {subj.practicalLabs > 0 && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded flex items-center">
                        <FlaskConical className="w-3 h-3 mr-1" />
                        {subj.practicalLabs} Practical Labs Conducted
                      </span>
                    )}
                    {subj.isBottleneck && (
                      <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        High Failure Risk Zone
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar and details */}
              <div className="w-full md:w-72 flex flex-col md:items-end">
                <div className="flex justify-between w-full text-xs font-semibold text-gray-600 mb-1">
                  <span>Topic Index Progress</span>
                  <span className={`font-bold ${subj.isBottleneck ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {subj.coveredPct}% Completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${subj.isBottleneck ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${subj.coveredPct}%` }}
                  ></div>
                </div>
                <span className="text-[11px] text-gray-500 font-medium mt-1">
                  {subj.isBottleneck ? (
                    <span className="text-amber-600 font-semibold flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Running {subj.behindDays} days behind schedule
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" /> On schedule for national window
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
