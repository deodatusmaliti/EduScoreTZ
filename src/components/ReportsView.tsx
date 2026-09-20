import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Award,
  CheckCircle,
  GraduationCap,
  Calendar,
  School,
  ExternalLink,
  Download,
  Sparkles,
  UserCheck,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { Student, AppSettings } from '../types';
import { getNectaGrade, formatTzs, formatOrdinal, ALL_TERMS } from '../utils/necta';

interface ReportsViewProps {
  students: Student[];
  settings: AppSettings;
  initialStudentId?: string;
  onPrint: () => void;
  language: 'en' | 'sw';
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  students,
  settings,
  initialStudentId,
  onPrint,
  language,
}) => {
  const [reportType, setReportType] = useState<string>('Student Progress Report');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );
  const [teacherRemarkEdit, setTeacherRemarkEdit] = useState<string>('');
  const [headteacherRemarkEdit, setHeadteacherRemarkEdit] = useState<string>('');

  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  const reportTypes = [
    'Student Progress Report',
    'Class Broad Sheet & Ledger',
    'School Performance Summary',
    'Attendance Risk Report',
    'Fee Balance Ledger',
  ];

  // Dynamic subjects calculation for selected student
  const baseSubjects = [
    { name: 'Basic Mathematics', code: '041', score: selectedStudent?.mathematics ?? 60, teacher: selectedStudent?.math_teacher || 'M. Mwakalinga' },
    { name: 'English Language', code: '022', score: selectedStudent?.english ?? 65, teacher: selectedStudent?.english_teacher || 'S. Mtei' },
    { name: 'Kiswahili', code: '021', score: selectedStudent?.kiswahili ?? 70, teacher: selectedStudent?.kis_teacher || 'R. Joseph' },
    { name: 'Biology / Science', code: '033', score: selectedStudent?.science ?? 65, teacher: selectedStudent?.science_teacher || 'P. Mushi' },
  ];

  if (typeof selectedStudent?.physics === 'number') {
    baseSubjects.push({ name: 'Physics', code: '031', score: selectedStudent.physics, teacher: selectedStudent.physics_teacher || 'P. Mushi' });
  }
  if (typeof selectedStudent?.chemistry === 'number') {
    baseSubjects.push({ name: 'Chemistry', code: '032', score: selectedStudent.chemistry, teacher: selectedStudent.chemistry_teacher || 'D. Mtani' });
  }
  if (typeof selectedStudent?.geography === 'number') {
    baseSubjects.push({ name: 'Geography', code: '013', score: selectedStudent.geography, teacher: selectedStudent.geo_teacher || 'S. Mtei' });
  }
  if (typeof selectedStudent?.history === 'number') {
    baseSubjects.push({ name: 'History', code: '012', score: selectedStudent.history, teacher: selectedStudent.hist_teacher || 'R. Joseph' });
  }

  // Any custom subjects from CSV
  if (selectedStudent?.customSubjects) {
    Object.entries(selectedStudent.customSubjects).forEach(([subjName, score], idx) => {
      baseSubjects.push({
        name: subjName,
        code: `05${idx + 1}`,
        score: score,
        teacher: 'Department Instructor',
      });
    });
  }

  // Automated smart recommendation based on student performance
  const automatedTeacherComment =
    selectedStudent?.average >= 75
      ? `${selectedStudent.name} demonstrates exemplary scholastic competence across all subjects. Outstanding critical thinking and leadership in class. Recommended for national academic honors and science Olympiad.`
      : selectedStudent?.average >= 60
      ? `${selectedStudent.name} has performed commendably well this term with good consistency. Encouraged to dedicate additional weekend study time to mathematics and physics to secure a strong Division I in national exams.`
      : `${selectedStudent.name} requires sustained academic intervention in core sciences and regular attendance monitoring. Recommended for supervised afternoon study hall and peer mentoring.`;

  const automatedHeadComment =
    selectedStudent?.average >= 75
      ? `Promoted with distinction. Commendable discipline and academic dedication. Keep up the high standard!`
      : selectedStudent?.average >= 50
      ? `Promising academic trajectory. Target minimum 70% in all subjects during upcoming term.`
      : `Conditional standing. Immediate parent conference requested to align remedial roadmap.`;

  const currentTeacherRemark = teacherRemarkEdit || selectedStudent?.teacherRecommendation || automatedTeacherComment;
  const currentHeadRemark = headteacherRemarkEdit || selectedStudent?.headteacherComment || automatedHeadComment;

  // Print Handlers
  const handlePrintDocument = () => {
    try {
      window.print();
    } catch {
      handleOpenInNewWindow();
    }
  };

  const handleOpenInNewWindow = () => {
    const reportElem = document.getElementById('official-report-sheet');
    if (!reportElem) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>EduScore TZ - Official Student Report: ${selectedStudent?.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; font-size: 13px; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .crest { font-size: 13px; font-weight: bold; letter-spacing: 1px; color: #334155; }
          .tamisemi { font-size: 11px; font-weight: bold; color: #475569; }
          .school { font-size: 24px; font-weight: 900; color: #020617; margin-top: 4px; font-family: Georgia, serif; }
          .motto { font-size: 12px; font-style: italic; color: #64748b; }
          .badge { display: inline-block; background: #0f172a; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: bold; margin-top: 8px; }
          .grid-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
          .meta-label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; display: block; }
          .meta-val { font-size: 14px; font-weight: bold; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; }
          .summary-band { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #0f172a; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
          .summary-val { font-size: 20px; font-weight: 900; color: #fbbf24; }
          .summary-label { font-size: 10px; text-transform: uppercase; color: #94a3b8; display: block; }
          .remarks-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 15px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
          .sig-line { width: 220px; border-top: 1px solid #0f172a; padding-top: 6px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="crest">THE UNITED REPUBLIC OF TANZANIA</div>
          <div class="tamisemi">PRESIDENT'S OFFICE - REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT (TAMISEMI)</div>
          <div class="school">${settings.schoolName}</div>
          <div class="motto">"${settings.schoolMotto}" • Region: ${settings.region} • District: ${settings.district}</div>
          <div class="badge">OFFICIAL TERMLY ACADEMIC PROGRESS REPORT — ${settings.activeTerm}, ${settings.academicYear}</div>
        </div>

        <div class="grid-meta">
          <div><span class="meta-label">Candidate Name</span><span class="meta-val">${selectedStudent?.name}</span></div>
          <div><span class="meta-label">Registration ID</span><span class="meta-val">${selectedStudent?.id}</span></div>
          <div><span class="meta-label">Class & Stream</span><span class="meta-val">${selectedStudent?.form} — ${selectedStudent?.stream}</span></div>
          <div><span class="meta-label">Class Standing</span><span class="meta-val">${selectedStudent?.classPosition ? formatOrdinal(selectedStudent.classPosition) : '1st'} ${selectedStudent?.cohortSize ? `of ${selectedStudent.cohortSize}` : ''}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Subject Name</th>
              <th style="text-align:center;">Score (%)</th>
              <th style="text-align:center;">Grade</th>
              <th style="text-align:center;">Points</th>
              <th>Educator</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${baseSubjects
              .map((sub) => {
                const gr = getNectaGrade(sub.score);
                return `<tr>
                  <td><b>${sub.name}</b></td>
                  <td style="text-align:center; font-weight:bold;">${sub.score}%</td>
                  <td style="text-align:center; font-weight:bold;">${gr.grade}</td>
                  <td style="text-align:center;">${gr.points}</td>
                  <td>${sub.teacher}</td>
                  <td>${gr.remarksEn}</td>
                </tr>`;
              })
              .join('')}
          </tbody>
        </table>

        <div class="summary-band">
          <div><span class="summary-label">Term Average</span><div class="summary-val">${selectedStudent?.average}%</div></div>
          <div><span class="summary-label">NECTA GPA</span><div class="summary-val" style="color: #60a5fa;">${selectedStudent?.gpa ? selectedStudent.gpa.toFixed(2) : '1.86'}</div></div>
          <div><span class="summary-label">NECTA Best 7</span><div class="summary-val" style="color: white;">${selectedStudent?.nectaPoints} pts</div></div>
          <div><span class="summary-label">Standing</span><div class="summary-val" style="color: #34d399;">${selectedStudent?.nectaDivision}</div></div>
        </div>

        <div class="remarks-box">
          <b>Class Teacher Remarks:</b>
          <p>${currentTeacherRemark}</p>
        </div>

        <div class="remarks-box">
          <b>Head of School Assessment:</b>
          <p>${currentHeadRemark}</p>
        </div>

        <div class="signatures">
          <div class="sig-line">
            <b>Class Teacher</b><br/>
            Signature & Date
          </div>
          <div style="text-align:center; border: 2px dashed #94a3b8; width: 80px; height: 80px; border-radius: 50%; line-height: 80px; font-size: 10px; color: #94a3b8;">
            OFFICIAL STAMP
          </div>
          <div class="sig-line" style="text-align: right;">
            <b>${settings.headteacherName}</b><br/>
            Head of School / Mkuu wa Shule
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div id="view-reports" className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Controls Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          {/* Report Type */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Select Report Format:
            </label>
            <select
              id="reportTypeSelect"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="text-xs font-semibold px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg focus:outline-hidden focus:bg-white"
            >
              {reportTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Student Picker if applicable */}
          {reportType === 'Student Progress Report' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Candidate / Student:
              </label>
              <select
                id="reportStudentSelect"
                value={selectedStudent?.id}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setTeacherRemarkEdit('');
                  setHeadteacherRemarkEdit('');
                }}
                className="text-xs font-semibold px-3 py-2 border border-gray-300 bg-gray-50 rounded-lg focus:outline-hidden focus:bg-white"
              >
                {students.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.name} ({stu.form} {stu.stream}) — Rank #{stu.classPosition || 1}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleOpenInNewWindow}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition flex items-center space-x-1.5"
            title="Open printable transcript in standalone tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Standalone Tab</span>
          </button>
          <button
            id="btn-print-transcript"
            onClick={handlePrintDocument}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition flex items-center space-x-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Official Transcript</span>
          </button>
        </div>
      </div>

      {/* Official Report Card Sheet */}
      <div
        id="official-report-sheet"
        className="bg-white rounded-2xl border border-gray-300 p-6 sm:p-10 shadow-md max-w-4xl mx-auto print:border-0 print:shadow-none print:p-0 print-break-inside-avoid"
      >
        {/* Ministry & School Header */}
        <div className="text-center border-b-2 border-slate-900 pb-5 mb-6">
          <p className="text-[11px] uppercase font-bold tracking-widest text-slate-600">
            THE UNITED REPUBLIC OF TANZANIA
          </p>
          <p className="text-xs uppercase font-extrabold tracking-wider text-slate-700 mt-0.5">
            PRESIDENT'S OFFICE - REGIONAL ADMINISTRATION AND LOCAL GOVERNMENT (TAMISEMI)
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-2 font-serif uppercase">
            {settings.schoolName}
          </h2>
          <p className="text-xs text-slate-600 italic mt-0.5">
            "{settings.schoolMotto}" • Region: {settings.region} • District: {settings.district}
          </p>
          <div className="mt-3 inline-block bg-slate-900 text-white font-bold text-xs px-4 py-1 rounded-full uppercase tracking-wider">
            {reportType.toUpperCase()} — {settings.activeTerm}, {settings.academicYear}
          </div>
        </div>

        {/* Student Credential Header Grid */}
        {reportType === 'Student Progress Report' && selectedStudent ? (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Candidate Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{selectedStudent.name}</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Gender: {selectedStudent.gender === 'F' ? 'Female (F)' : 'Male (M)'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Registration ID</span>
                <span className="font-mono font-bold text-slate-800">{selectedStudent.id}</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Year: {selectedStudent.year || settings.academicYear}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Class & Stream</span>
                <span className="font-bold text-slate-800">{selectedStudent.form} — Stream {selectedStudent.stream}</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Active: {settings.activeTerm}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px] font-medium">Class Position & Rank</span>
                <span className="font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-xs">
                  {selectedStudent.classPosition ? formatOrdinal(selectedStudent.classPosition) : '1st'}
                  {selectedStudent.cohortSize ? ` of ${selectedStudent.cohortSize}` : ''}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">
                  {selectedStudent.attendance}% Attendance
                </span>
              </div>
            </div>

            {/* 4-Term Progress Bar */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-bold text-slate-700 text-[11px] uppercase block mb-1.5">
                4-Term Academic Progression Tracker (2026)
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="p-1.5 bg-amber-50 border border-amber-300 rounded font-bold text-amber-900">
                  Term 1 (Current: {selectedStudent.average}%)
                </div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-400">
                  Term 2 (Projected: 78%)
                </div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-400">
                  Term 3 (Upcoming)
                </div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-400">
                  Term 4 (Final NECTA)
                </div>
              </div>
            </div>

            {/* Subject Grade Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-300">
                  <tr>
                    <th className="p-2.5 border-r border-slate-300">Subject Code & Name</th>
                    <th className="p-2.5 border-r border-slate-300 text-center">Score (%)</th>
                    <th className="p-2.5 border-r border-slate-300 text-center">NECTA Grade</th>
                    <th className="p-2.5 border-r border-slate-300 text-center">Points</th>
                    <th className="p-2.5 border-r border-slate-300">Assigned Educator</th>
                    <th className="p-2.5">Official Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {baseSubjects.map((sub, idx) => {
                    const gr = getNectaGrade(sub.score);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="p-2.5 border-r border-slate-300 font-semibold text-slate-900">
                          <span className="font-mono text-[11px] text-slate-400 mr-2">{sub.code}</span>
                          {sub.name}
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-900">
                          {sub.score}%
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-center font-black">
                          <span className={gr.color}>{gr.grade}</span>
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-center font-bold font-mono">
                          {gr.points}
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-slate-600">
                          {sub.teacher}
                        </td>
                        <td className="p-2.5 text-slate-600 font-medium italic">
                          {gr.remarksEn} ({gr.remarksSw})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Academic Summary Badge Matrix */}
            <div className="p-4 bg-slate-900 text-white rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Term Average</span>
                <span className="text-2xl font-black text-amber-400">{selectedStudent.average}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">NECTA GPA</span>
                <span className="text-2xl font-black text-blue-400 font-mono">
                  {selectedStudent.gpa ? selectedStudent.gpa.toFixed(2) : '1.86'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Best 7 Points</span>
                <span className="text-2xl font-black text-white font-mono">{selectedStudent.nectaPoints} pts</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">NECTA Standing</span>
                <span className="text-lg font-black text-emerald-400">{selectedStudent.nectaDivision}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Fee Clearance</span>
                <span className="text-xs font-bold text-slate-200 mt-1.5 block">
                  {selectedStudent.feeBalance === 0 ? '✓ Cleared' : formatTzs(selectedStudent.feeBalance)}
                </span>
              </div>
            </div>

            {/* Formative Comments and Signatures */}
            <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900 block">Class Teacher Remarks:</span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    Automated & Editable
                  </span>
                </div>
                <textarea
                  value={currentTeacherRemark}
                  onChange={(e) => setTeacherRemarkEdit(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white italic focus:outline-hidden"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-900 block">Head of School Assessment:</span>
                    <span className="text-[10px] text-slate-500 font-bold">{settings.headteacherName}</span>
                  </div>
                  <textarea
                    value={currentHeadRemark}
                    onChange={(e) => setHeadteacherRemarkEdit(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg bg-white italic focus:outline-hidden"
                  />
                </div>
                <div className="pt-3 flex items-center justify-between border-t border-slate-200 mt-2 text-[11px] text-slate-400">
                  <span className="border-t border-slate-400 w-24 text-center">School Stamp</span>
                  <span>Date: 20 September 2026</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Institutional Summary Report View */
          <div className="space-y-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-0.5">Aggregate School Performance Summary</h4>
                <p className="text-slate-600">
                  Total Candidates: <strong>{students.length}</strong> | School Term Average: <strong>{(students.reduce((a, s) => a + s.average, 0) / students.length).toFixed(1)}%</strong>
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                NECTA National Standards
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-300">
                <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border">Rank</th>
                    <th className="p-2 border">ID</th>
                    <th className="p-2 border">Candidate</th>
                    <th className="p-2 border">Level</th>
                    <th className="p-2 border">Average</th>
                    <th className="p-2 border">GPA</th>
                    <th className="p-2 border">Standing</th>
                    <th className="p-2 border">Fee Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((stu, i) => (
                    <tr key={stu.id} className="hover:bg-slate-50">
                      <td className="p-2 border font-bold text-amber-700">#{stu.classPosition || i + 1}</td>
                      <td className="p-2 border font-mono">{stu.id}</td>
                      <td className="p-2 border font-bold text-slate-900">{stu.name}</td>
                      <td className="p-2 border">{stu.form} {stu.stream}</td>
                      <td className="p-2 border font-bold">{stu.average}%</td>
                      <td className="p-2 border font-bold text-blue-700">{stu.gpa ? stu.gpa.toFixed(2) : '-'}</td>
                      <td className="p-2 border font-bold text-emerald-700">{stu.nectaDivision}</td>
                      <td className="p-2 border">{formatTzs(stu.feeBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
