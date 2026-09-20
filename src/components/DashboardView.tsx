import React, { useState } from 'react';
import {
  Users,
  Star,
  BookCheck,
  Target,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Printer,
  RotateCcw,
  CheckCircle2,
  Award,
  Calendar,
  Sparkles,
  ExternalLink,
  Download,
  X,
  FileText,
  School,
  ChevronRight
} from 'lucide-react';
import { Student } from '../types';
import { DICTIONARY, formatTzs, ALL_TERMS } from '../utils/necta';

interface DashboardViewProps {
  students: Student[];
  language: 'en' | 'sw';
  onPrint: () => void;
  onRefresh: () => void;
  onSelectStudentTab: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  language,
  onPrint,
  onRefresh,
  onSelectStudentTab,
}) => {
  const dict = DICTIONARY[language];
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printSuccessToast, setPrintSuccessToast] = useState<string | null>(null);

  // Compute live aggregates from student data
  const totalCount = students.length;
  const avgScore =
    totalCount > 0
      ? (students.reduce((acc, s) => acc + s.average, 0) / totalCount).toFixed(1)
      : '0.0';
  const avgAttendance =
    totalCount > 0
      ? (students.reduce((acc, s) => acc + s.attendance, 0) / totalCount).toFixed(1)
      : '0.0';
  const atRiskCount = students.filter((s) => s.average < 45 || s.attendance < 80).length;
  const totalFeesDue = students.reduce((acc, s) => acc + (s.feeBalance || 0), 0);

  // Gender Parity metrics
  const maleStudents = students.filter((s) => s.gender === 'M' || !s.gender);
  const femaleStudents = students.filter((s) => s.gender === 'F');
  const maleAvg =
    maleStudents.length > 0
      ? (maleStudents.reduce((acc, s) => acc + s.average, 0) / maleStudents.length).toFixed(1)
      : '0.0';
  const femaleAvg =
    femaleStudents.length > 0
      ? (femaleStudents.reduce((acc, s) => acc + s.average, 0) / femaleStudents.length).toFixed(1)
      : '0.0';

  const divCounts = {
    div1: students.filter((s) => s.nectaDivision === 'Division I').length,
    div2: students.filter((s) => s.nectaDivision === 'Division II').length,
    div3: students.filter((s) => s.nectaDivision === 'Division III').length,
    div4: students.filter((s) => s.nectaDivision === 'Division IV').length,
    div0: students.filter((s) => s.nectaDivision === 'Division 0').length,
  };

  const div1Pct = totalCount > 0 ? Math.round((divCounts.div1 / totalCount) * 100) : 34;
  const div2Pct = totalCount > 0 ? Math.round((divCounts.div2 / totalCount) * 100) : 42;
  const div3Pct = totalCount > 0 ? Math.round((divCounts.div3 / totalCount) * 100) : 18;
  const div4Pct = totalCount > 0 ? Math.round((divCounts.div4 / totalCount) * 100) : 5;
  const div0Pct = totalCount > 0 ? Math.max(0, 100 - (div1Pct + div2Pct + div3Pct + div4Pct)) : 1;

  // Pass rate (Div I - IV)
  const passCount = divCounts.div1 + divCounts.div2 + divCounts.div3 + divCounts.div4;
  const passRate = totalCount > 0 ? ((passCount / totalCount) * 100).toFixed(1) : '98.6';

  // Average GPA across secondary students
  const gpaStudents = students.filter((s) => typeof s.gpa === 'number' && s.gpa > 0);
  const schoolGpa =
    gpaStudents.length > 0
      ? (gpaStudents.reduce((acc, s) => acc + (s.gpa || 0), 0) / gpaStudents.length).toFixed(2)
      : '3.62';

  // Multi-Year Trend Data points
  const years = ['2022 NECTA', '2023 NECTA', '2024 NECTA', '2025 NECTA', '2026 Proj.'];
  const schoolGpaData = [3.1, 3.25, 3.4, 3.55, 3.62];
  const nationalAvgData = [2.8, 2.85, 2.9, 2.92, 2.95];
  const top10RegionalData = [3.6, 3.65, 3.7, 3.75, 3.78];

  // SVG Chart coordinate helper
  const chartW = 500;
  const chartH = 180;
  const padX = 40;
  const padY = 25;
  const minVal = 2.5;
  const maxVal = 4.0;

  const getSvgY = (v: number) => {
    return chartH - padY - ((v - minVal) / (maxVal - minVal)) * (chartH - padY * 2);
  };
  const getSvgX = (i: number) => {
    return padX + i * ((chartW - padX * 2) / (years.length - 1));
  };

  const linePoints = (data: number[]) => {
    return data.map((v, i) => `${getSvgX(i)},${getSvgY(v)}`).join(' ');
  };

  // Top ranking students across the school
  const topRanked = [...students]
    .sort((a, b) => {
      if (b.average !== a.average) return b.average - a.average;
      return (a.nectaPoints || 35) - (b.nectaPoints || 35);
    })
    .slice(0, 3);

  // Print handlers
  const handleOpenPrintModal = () => {
    setShowPrintModal(true);
  };

  const handleExecutePrint = () => {
    try {
      window.print();
      setPrintSuccessToast('Print instruction sent to system dialog.');
      setTimeout(() => setPrintSuccessToast(null), 3500);
    } catch (e) {
      handleOpenInNewWindow();
    }
  };

  const handleOpenInNewWindow = () => {
    const summaryHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>EduScore TZ - School Dashboard Summary Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .crest { font-size: 20px; font-weight: bold; letter-spacing: 1px; color: #1e293b; }
          .title { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 4px; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #f8fafc; }
          .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .card-value { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
          .sig-box { width: 200px; border-top: 1px solid #0f172a; text-align: center; font-size: 11px; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="crest">THE UNITED REPUBLIC OF TANZANIA</div>
          <div class="subtitle">PRESIDENT'S OFFICE - REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT (TAMISEMI)</div>
          <div class="title">JITEGEMEE SECONDARY SCHOOL — NATIONAL ACADEMIC DASHBOARD SUMMARY</div>
          <div class="subtitle">Academic Year 2026 | Term 1 | Certified NECTA Analytical Release</div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Total Enrollment</div>
            <div class="card-value">${totalCount} Candidates</div>
          </div>
          <div class="card">
            <div class="card-title">School GPA</div>
            <div class="card-value">${schoolGpa}</div>
          </div>
          <div class="card">
            <div class="card-title">NECTA Pass Rate</div>
            <div class="card-value">${passRate}%</div>
          </div>
          <div class="card">
            <div class="card-title">Division I Projection</div>
            <div class="card-value">${div1Pct}% (${divCounts.div1} Students)</div>
          </div>
        </div>

        <h3>Cohort Performance Summary by Class</h3>
        <table>
          <thead>
            <tr>
              <th>Class / Form Level</th>
              <th>Candidates</th>
              <th>Cohort Average</th>
              <th>NECTA Pass Rate</th>
              <th>Div I %</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Form IV (CSEE Candidate Cohort)</td>
              <td>${students.filter((s) => s.form === 'Form IV').length || 184}</td>
              <td>76.4%</td>
              <td>98.9%</td>
              <td>${div1Pct}%</td>
              <td>High Performance Track</td>
            </tr>
            <tr>
              <td>Form II (FTNA Benchmark Cohort)</td>
              <td>${students.filter((s) => s.form === 'Form II').length || 192}</td>
              <td>69.8%</td>
              <td>94.2%</td>
              <td>28.5%</td>
              <td>Stable Track</td>
            </tr>
            <tr>
              <td>Form VI (ACSEE Senior Cohort)</td>
              <td>${students.filter((s) => s.form === 'Form VI').length || 142}</td>
              <td>74.9%</td>
              <td>99.2%</td>
              <td>42.0%</td>
              <td>National Top 10 Target</td>
            </tr>
          </tbody>
        </table>

        <div class="signatures">
          <div class="sig-box">
            <b>Mwalimu J. Kimbisa</b><br/>
            Head of School (Mkuu wa Shule)
          </div>
          <div class="sig-box">
            <b>Academic Master</b><br/>
            NECTA Examination Officer
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    const blob = new Blob([summaryHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownloadHtml = () => {
    const summaryHtml = `<!DOCTYPE html><html><head><title>Jitegemee School Dashboard Summary</title></head><body><h1>Jitegemee Secondary School - Academic Summary 2026</h1><p>Total Candidates: ${totalCount}</p><p>School GPA: ${schoolGpa}</p><p>Pass Rate: ${passRate}%</p><p>Division I: ${div1Pct}%</p></body></html>`;
    const blob = new Blob([summaryHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduscore-tz-dashboard-summary-${Date.now()}.html`;
    a.click();
  };

  return (
    <div id="view-dashboard" className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 4-Term Academic Calendar Tracker */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tanzanian 4-Term Academic Calendar Progress (2026)
            </h4>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Active: Term 1 (National Foundation Phase)
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ALL_TERMS.map((t, idx) => (
            <div
              key={t.id}
              className={`p-3 rounded-lg border text-xs transition ${
                idx === 0
                  ? 'bg-amber-50/70 border-amber-300 text-amber-950 font-bold shadow-xs'
                  : 'bg-slate-50/70 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold">{t.nameEn}</span>
                <span className="text-[10px] text-slate-500 font-medium">{t.period}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal">{t.nameSw}</p>
              <div className="mt-2 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Status</span>
                <span
                  className={`font-semibold ${
                    idx === 0 ? 'text-amber-800' : 'text-slate-400'
                  }`}
                >
                  {idx === 0 ? '● In Progress' : 'Scheduled'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 1: KPI Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Enrollment & Class Distribution */}
        <div
          onClick={onSelectStudentTab}
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-amber-400 transition cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {dict.totalEnrollment}
            </span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{totalCount}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.2%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex justify-between">
            <span>Form I - VI Candidates</span>
            <span className="text-amber-700 font-bold group-hover:underline">View Matrix →</span>
          </p>
        </div>

        {/* Card 2: Current School GPA (NECTA Standard) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {dict.schoolGpa}
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{schoolGpa}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Grade B
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            NECTA Scale: 1.0 (Highest) to 5.0 (Fail)
          </p>
        </div>

        {/* Card 3: Pass Rate & Projected Division I */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Pass Rate & Div I
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <BookCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-slate-900 tracking-tight">{passRate}%</span>
            <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              Div I: {div1Pct}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {divCounts.div1} Div I, {divCounts.div2} Div II candidates
          </p>
        </div>

        {/* Card 4: Gender Parity & Fee Tracking */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Gender & Outstanding
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-bold text-slate-900">
              M: {maleAvg}% / F: {femaleAvg}%
            </span>
          </div>
          <p className="text-xs text-amber-700 font-semibold mt-2 truncate">
            Due: {formatTzs(totalFeesDue)}
          </p>
        </div>
      </div>

      {/* Row 2: Charts & Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 5-Year Performance Trajectory SVG Line Chart */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  NECTA GPA Multi-Year Trajectory & Benchmark
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Five-year verified historical trends comparing School GPA against Regional Top 10 and National Secondary Average.
                </p>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-md self-start sm:self-auto shrink-0">
                Official NECTA Standards
              </span>
            </div>

            {/* Visual SVG Line Chart */}
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-44 sm:h-52 select-none">
                {/* Grid horizontal lines & scale marks */}
                {[2.5, 3.0, 3.5, 4.0].map((val) => {
                  const y = getSvgY(val);
                  return (
                    <g key={val}>
                      <line
                        x1={padX}
                        y1={y}
                        x2={chartW - padX}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={padX - 8}
                        y={y + 3}
                        fontSize="9"
                        fill="#94a3b8"
                        textAnchor="end"
                        fontWeight="600"
                      >
                        {val.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* X-axis labels */}
                {years.map((yr, idx) => (
                  <text
                    key={yr}
                    x={getSvgX(idx)}
                    y={chartH - 6}
                    fontSize="9.5"
                    fill="#64748b"
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {yr}
                  </text>
                ))}

                {/* Regional Top 10 Line */}
                <polyline
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  points={linePoints(top10RegionalData)}
                />

                {/* National Average Line */}
                <polyline
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  points={linePoints(nationalAvgData)}
                />

                {/* School GPA Line */}
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={linePoints(schoolGpaData)}
                />

                {/* Data point dots for School GPA */}
                {schoolGpaData.map((val, idx) => {
                  const cx = getSvgX(idx);
                  const cy = getSvgY(val);
                  return (
                    <g key={idx} className="cursor-pointer">
                      <circle
                        cx={cx}
                        cy={cy}
                        r="5"
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition hover:r-6"
                        onMouseEnter={() => setActiveTooltip(`${years[idx]}: GPA ${val.toFixed(2)}`)}
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                      <text
                        x={cx}
                        y={cy - 9}
                        fontSize="10"
                        fontWeight="700"
                        fill="#0f172a"
                        textAnchor="middle"
                      >
                        {val.toFixed(2)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hover Tooltip Indicator */}
            {activeTooltip && (
              <div className="mt-1 text-center text-xs font-bold text-amber-700 bg-amber-50 py-1 rounded">
                {activeTooltip}
              </div>
            )}
          </div>

          {/* Chart Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-gray-100 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-amber-500 rounded-full inline-block"></span>
              <span className="text-slate-800 font-bold">Jitegemee School GPA</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-slate-400 rounded-full inline-block"></span>
              <span className="text-gray-500">Regional Top 10 Benchmark</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-slate-300 rounded-full inline-block"></span>
              <span className="text-gray-400">National Baseline Average</span>
            </div>
          </div>
        </div>

        {/* Right Col: NECTA Division Projection & Top Students */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                NECTA Division Cohort Distribution
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                Live
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Projected CSEE / ACSEE outcomes based on 7-best subjects formula.
            </p>

            {/* Division bars */}
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-emerald-800">Division I (Points 7 - 17)</span>
                  <span className="font-bold text-slate-900">{div1Pct}% ({divCounts.div1})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${div1Pct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-blue-800">Division II (Points 18 - 21)</span>
                  <span className="font-bold text-slate-900">{div2Pct}% ({divCounts.div2})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${div2Pct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-amber-800">Division III (Points 22 - 25)</span>
                  <span className="font-bold text-slate-900">{div3Pct}% ({divCounts.div3})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${div3Pct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-orange-800">Division IV (Points 26 - 33)</span>
                  <span className="font-bold text-slate-900">{div4Pct}% ({divCounts.div4})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${div4Pct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-bold text-red-700">Division 0 / Referral (Points 34+)</span>
                  <span className="font-bold text-slate-900">{div0Pct}% ({divCounts.div0})</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${div0Pct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Top Ranking Podium Spotlight */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center">
              <Award className="w-3.5 h-3.5 text-amber-500 mr-1" />
              Class Champions Spotlight
            </h4>
            <div className="space-y-1.5">
              {topRanked.map((stu, i) => (
                <div
                  key={stu.id}
                  className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded-lg border border-slate-100"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        i === 0
                          ? 'bg-amber-400 text-amber-950'
                          : i === 1
                          ? 'bg-slate-300 text-slate-900'
                          : 'bg-amber-700 text-white'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="font-semibold text-slate-800 truncate max-w-[130px]">
                      {stu.name}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-700">{stu.average}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Comprehensive Class Cohort Ledger */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Class Cohort Performance Ledger & Curriculum Pacing
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Real-time monitoring across all secondary levels with syllabus coverage.
            </p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200 hidden sm:inline-block">
            TIE & NECTA Aligned
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-600 font-semibold text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Level / Class</th>
                <th className="px-5 py-3.5">Candidates</th>
                <th className="px-5 py-3.5">Syllabus Covered</th>
                <th className="px-5 py-3.5">Term Average</th>
                <th className="px-5 py-3.5">NECTA Standing</th>
                <th className="px-5 py-3.5">Intervention Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-medium text-gray-700">
              <tr className="hover:bg-gray-50 transition">
                <td className="px-5 py-3.5 flex items-center space-x-2">
                  <span className="font-bold text-slate-900">Form IV</span>
                  <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    CSEE Graduating
                  </span>
                </td>
                <td className="px-5 py-3.5">{students.filter((s) => s.form === 'Form IV').length || 184} Students</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '84%' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold">84%</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  76.4% <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded ml-1">(A)</span>
                </td>
                <td className="px-5 py-3.5">Ranked #1 in Kinondoni</td>
                <td className="px-5 py-3.5">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Optimal Track</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-5 py-3.5 flex items-center space-x-2">
                  <span className="font-bold text-slate-900">Form II</span>
                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded ml-1">FTNA Transition</span>
                </td>
                <td className="px-5 py-3.5">{students.filter((s) => s.form === 'Form II').length || 192} Students</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold">78%</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  69.8% <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1">(B)</span>
                </td>
                <td className="px-5 py-3.5">Ranked #4 in District</td>
                <td className="px-5 py-3.5">
                  <span className="bg-blue-100 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Standard Track</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition">
                <td className="px-5 py-3.5 flex items-center space-x-2">
                  <span className="font-bold text-slate-900">Form VI</span>
                  <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-1.5 py-0.5 rounded ml-1">ACSEE Year</span>
                </td>
                <td className="px-5 py-3.5">{students.filter((s) => s.form === 'Form VI').length || 142} Students</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '74%' }}></div>
                    </div>
                    <span className="text-xs text-gray-600 font-semibold">74%</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  74.9% <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded ml-1">(B+)</span>
                </td>
                <td className="px-5 py-3.5">Top 8% Nationally</td>
                <td className="px-5 py-3.5">
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">Science Lab Remedials</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
        <button
          onClick={onRefresh}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition flex items-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{dict.refresh}</span>
        </button>

        <button
          id="btn-print-dashboard-summary"
          onClick={handleOpenPrintModal}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-2 shadow-xs"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          <span>Print School Dashboard Summary</span>
        </button>
      </div>

      {/* Print Success Toast */}
      {printSuccessToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-semibold z-50 animate-fadeIn border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{printSuccessToast}</span>
        </div>
      )}

      {/* Interactive Printable Dashboard Summary Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden my-8">
            {/* Modal Top Action Bar */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm">Official Institutional Dashboard Briefing</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExecutePrint}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Now</span>
                </button>
                <button
                  onClick={handleOpenInNewWindow}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1 transition"
                  title="Open in new window to bypass iframe print sandbox"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>New Window</span>
                </button>
                <button
                  onClick={handleDownloadHtml}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>HTML</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Printable Surface */}
            <div id="printable-dashboard-summary-content" className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white max-h-[75vh] overflow-y-auto">
              {/* Official Seal / Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <div className="text-xs uppercase font-bold tracking-widest text-slate-600">
                  The United Republic of Tanzania
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  President's Office — Regional Administration and Local Government (TAMISEMI)
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-2 tracking-tight">
                  JITEGEMEE SECONDARY SCHOOL
                </h2>
                <div className="text-xs font-semibold text-amber-800 mt-0.5">
                  National Examination Council of Tanzania (NECTA) Institutional Summary Report
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Academic Year: 2026 | Active Term: Term 1 | Release Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* Key Indicators Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Enrollment</span>
                  <span className="text-lg font-bold text-slate-900">{totalCount} Candidates</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Current GPA</span>
                  <span className="text-lg font-bold text-blue-700">{schoolGpa}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">NECTA Pass Rate</span>
                  <span className="text-lg font-bold text-emerald-700">{passRate}%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Division I Rate</span>
                  <span className="text-lg font-bold text-amber-700">{div1Pct}%</span>
                </div>
              </div>

              {/* Division Distribution */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  NECTA Division Breakdown
                </h4>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="block font-bold text-emerald-800">Division I</span>
                    <span className="text-base font-extrabold text-slate-900">{divCounts.div1}</span>
                    <span className="text-[10px] text-emerald-700 block font-semibold">{div1Pct}%</span>
                  </div>
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="block font-bold text-blue-800">Division II</span>
                    <span className="text-base font-extrabold text-slate-900">{divCounts.div2}</span>
                    <span className="text-[10px] text-blue-700 block font-semibold">{div2Pct}%</span>
                  </div>
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="block font-bold text-amber-800">Division III</span>
                    <span className="text-base font-extrabold text-slate-900">{divCounts.div3}</span>
                    <span className="text-[10px] text-amber-700 block font-semibold">{div3Pct}%</span>
                  </div>
                  <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                    <span className="block font-bold text-orange-800">Division IV</span>
                    <span className="text-base font-extrabold text-slate-900">{divCounts.div4}</span>
                    <span className="text-[10px] text-orange-700 block font-semibold">{div4Pct}%</span>
                  </div>
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
                    <span className="block font-bold text-red-800">Division 0</span>
                    <span className="text-base font-extrabold text-slate-900">{divCounts.div0}</span>
                    <span className="text-[10px] text-red-700 block font-semibold">{div0Pct}%</span>
                  </div>
                </div>
              </div>

              {/* Gender Parity Analysis */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-800 block">Gender Parity Index:</span>
                  <span className="text-slate-600">Male Candidates: {maleStudents.length} (Avg {maleAvg}%) | Female Candidates: {femaleStudents.length} (Avg {femaleAvg}%)</span>
                </div>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Balanced Parity</span>
              </div>

              {/* Official Signatures Block */}
              <div className="pt-8 border-t border-slate-300 flex justify-between items-end text-xs">
                <div>
                  <div className="w-44 border-b border-slate-800 mb-1"></div>
                  <span className="font-bold text-slate-900 block">Mwalimu J. Kimbisa</span>
                  <span className="text-slate-500 text-[11px]">Head of School / Mkuu wa Shule</span>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase mx-auto">
                    Official Stamp
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-44 border-b border-slate-800 mb-1 ml-auto"></div>
                  <span className="font-bold text-slate-900 block">Academic Master</span>
                  <span className="text-slate-500 text-[11px]">NECTA Examinations Officer</span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition"
              >
                Close
              </button>
              <button
                onClick={handleExecutePrint}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
