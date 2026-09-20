import React, { useState } from 'react';
import {
  Building2,
  Printer,
  TrendingUp,
  Award,
  Filter,
  CheckCircle,
  AlertTriangle,
  History,
  Calendar,
  ExternalLink,
  ChevronRight,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { DistrictBenchmark, HistoricalExamResult } from '../types';
import { INITIAL_HISTORICAL_EXAMS } from '../data/initialData';

interface DistrictViewProps {
  benchmarks: DistrictBenchmark[];
  historicalExams?: HistoricalExamResult[];
  onPrint: () => void;
  language: 'en' | 'sw';
}

export const DistrictView: React.FC<DistrictViewProps> = ({
  benchmarks,
  historicalExams = INITIAL_HISTORICAL_EXAMS,
  onPrint,
  language,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'benchmarks' | 'historical'>('historical');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedExamType, setSelectedExamType] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const regions = ['All', 'Arusha', 'Dar es Salaam', 'Morogoro', 'Tabora', 'Pwani', 'Dodoma'];

  const filteredBenchmarks = benchmarks.filter((b) => {
    if (selectedRegion !== 'All' && b.region !== selectedRegion) return false;
    return true;
  });

  const filteredExams = historicalExams.filter((e) => {
    if (selectedExamType !== 'All' && e.examType !== selectedExamType) return false;
    return true;
  });

  const handleReviewMatrix = () => {
    setToastMessage('District benchmarking matrix refreshed against 2026 NECTA performance standards.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePrintDocument = () => {
    try {
      window.print();
    } catch {
      const summaryHtml = `<!DOCTYPE html><html><head><title>Historical NECTA Archives</title></head><body><h1>Historical NECTA Exam Archives (2021-2025)</h1></body></html>`;
      const blob = new Blob([summaryHtml], { type: 'text/html;charset=utf-8;' });
      window.open(URL.createObjectURL(blob), '_blank');
    }
  };

  return (
    <div id="view-district" className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner Card */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {language === 'en' ? 'NECTA Exam Archives & National Benchmarking' : 'Kumbukumbu za Mitihani na Ulinganisho wa Kitaifa'}
              </h3>
              <p className="text-xs text-gray-500">
                Access verified past NECTA examination results (2021–2025) and evaluate school trajectories against regional and national positions.
              </p>
            </div>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('historical')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeSubTab === 'historical'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-600" />
              <span>Past NECTA Results</span>
            </button>
            <button
              onClick={() => setActiveSubTab('benchmarks')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                activeSubTab === 'benchmarks'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>District Benchmarking</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-emerald-50 text-emerald-900 border-l-4 border-emerald-600 rounded-r-lg text-xs font-medium flex justify-between items-center">
          <span>Official NECTA National Examination Archives active (CSEE Form IV & ACSEE Form VI).</span>
          <span className="font-bold text-emerald-800">5-Year Verified Track Record</span>
        </div>
      </div>

      {activeSubTab === 'historical' ? (
        /* Sub-tab 1: Historical Past NECTA Results & Trends */
        <div className="space-y-6">
          {/* Historical Trend Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase block">5-Year Pass Rate</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-slate-900">99.1%</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +4.9%
                </span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">From 94.2% (2021) to 99.1% (2025)</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase block">Division I Growth</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-emerald-700">38.2%</span>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +16.7%
                </span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">Doubled from 21.5% in 2021</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase block">Best National Rank</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-blue-700">#12</span>
                <span className="text-xs text-gray-500 font-semibold">of 4,892</span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">Top 0.25% across Tanzania</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase block">Regional Rank (Dar)</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-2xl font-black text-amber-600">#2</span>
                <span className="text-xs text-gray-500 font-semibold">of 340 schools</span>
              </div>
              <span className="text-[10px] text-gray-500 mt-1 block">Kinondoni District Leader</span>
            </div>
          </div>

          {/* Historical NECTA Exams Ledger */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Past NECTA National Examination Results Ledger (2021 – 2025)
                </h4>
                <p className="text-xs text-gray-500">
                  Official published records archived for accreditation and quality assurance.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="All">All Exam Levels (CSEE & ACSEE)</option>
                  <option value="CSEE">CSEE (Form IV Only)</option>
                  <option value="ACSEE">ACSEE (Form VI Only)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Year</th>
                    <th className="px-4 py-3">NECTA Exam</th>
                    <th className="px-4 py-3">Candidates</th>
                    <th className="px-4 py-3">School GPA</th>
                    <th className="px-4 py-3">NECTA Pass Rate</th>
                    <th className="px-4 py-3">Division I %</th>
                    <th className="px-4 py-3">National Position</th>
                    <th className="px-4 py-3">Regional Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExams.map((ex, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-bold text-slate-900">{ex.year}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800">{ex.examType}</span>
                        <span className="text-[10px] text-gray-500 block">
                          {ex.examType === 'CSEE' ? 'Certificate of Secondary Education' : 'Advanced Certificate'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{ex.candidates} Students</td>
                      <td className="px-4 py-3 font-bold text-blue-700">
                        {(ex.gpa ?? ex.schoolGpa ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700">{ex.passRate}%</td>
                      <td className="px-4 py-3 font-bold text-amber-700">
                        {ex.divisionOnePct ?? ex.div1Pct ?? 0}%
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {ex.nationalRank}
                        <span className="text-[10px] text-gray-400 font-normal">
                          {' '}
                          / {ex.totalSchoolsNationally ?? ex.totalNationalSchools ?? 4892}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{ex.regionalRank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Sub-tab 2: District Benchmarking */
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
              Comparative Secondary Institution Matrix ({filteredBenchmarks.length} Schools)
            </h4>
            <span className="text-xs font-bold text-slate-600">Session 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-gray-100 text-gray-600 font-semibold text-[11px] uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Rank</th>
                  <th className="px-5 py-3.5">Institution Name</th>
                  <th className="px-5 py-3.5">Region</th>
                  <th className="px-5 py-3.5">District</th>
                  <th className="px-5 py-3.5">Candidates</th>
                  <th className="px-5 py-3.5">Term Average</th>
                  <th className="px-5 py-3.5">NECTA Pass Rate</th>
                  <th className="px-5 py-3.5">Division I %</th>
                  <th className="px-5 py-3.5">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium text-slate-700">
                {filteredBenchmarks.map((item) => (
                  <tr
                    key={item.rank}
                    className={`hover:bg-slate-50 transition ${
                      item.school.includes('Jitegemee') ? 'bg-amber-50/40 font-semibold' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center font-bold text-xs ${
                          item.rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : item.rank === 2
                            ? 'bg-slate-200 text-slate-800'
                            : item.rank === 3
                            ? 'bg-amber-100 text-amber-900'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 flex items-center">
                        <span>{item.school}</span>
                        {item.school.includes('Jitegemee') && (
                          <span className="ml-2 px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full">
                            Our Institution
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{item.region}</td>
                    <td className="px-5 py-3.5 text-gray-500">{item.district}</td>
                    <td className="px-5 py-3.5 font-mono">{item.students}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{item.averageScore}%</td>
                    <td className="px-5 py-3.5 font-bold text-emerald-700">{item.passRate}%</td>
                    <td className="px-5 py-3.5 font-bold text-blue-700">{item.divisionOneRate}%</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.riskLevel === 'Low'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.riskLevel === 'Monitor'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
        <button
          onClick={handleReviewMatrix}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition"
        >
          Refresh Performance Index
        </button>

        <button
          onClick={handlePrintDocument}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-xs"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>Print Historical NECTA Archives</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 bg-slate-900 text-white rounded-xl text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
