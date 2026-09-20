import React, { useRef, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  BookOpen,
  School,
  Sparkles,
  Info,
  Filter,
  Check,
  FileCheck,
  Layers,
} from 'lucide-react';
import { Student, InstitutionType } from '../types';
import {
  formatTzs,
  generateCsvTemplate,
  getInstitutionSubjects,
  calculateStudentNectaMetrics,
  calculateClassPositions,
  parseStudentCsv,
} from '../utils/necta';
import {
  formatCsvPhone,
  formatCsvCurrency,
  escapeCsvCell,
  downloadCsvFile,
} from '../utils/csvFormatter';

interface DataCentreViewProps {
  students: Student[];
  onImportStudents: (newStudents: Student[]) => void;
  onRestoreDemo: () => void;
  language: 'en' | 'sw';
}

export const DataCentreView: React.FC<DataCentreViewProps> = ({
  students,
  onImportStudents,
  onRestoreDemo,
  language,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready.');
  const [filterText, setFilterText] = useState<string>('');
  const [templateType, setTemplateType] = useState<InstitutionType>('secondary_olevel');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importSummary, setImportSummary] = useState<{
    rowCount: number;
    detectedSubjects: string[];
    avgScore: number;
    schoolGpa: number;
    fileName: string;
    mode: 'merge' | 'replace';
  } | null>(null);

  // Determine all dynamic subject keys across the current student body
  const allDynamicSubjects = Array.from(
    new Set(
      students.flatMap((s) => (s.customSubjects ? Object.keys(s.customSubjects) : []))
    )
  );

  // Standard CSV Export supporting dynamic subjects, Excel phone formatting, and currency
  const handleExportCsv = () => {
    const standardHeaders = [
      'id',
      'name',
      'gender',
      'form',
      'stream',
      'school',
      'region',
      'district',
      'term',
      'year',
      'parent',
      'phone',
      'whatsapp',
      'email',
      'feeStatus',
      'feeBalance_TZS',
      'feeBalance_Formatted',
      'attendance',
      'mathematics',
      'english',
      'kiswahili',
      'science',
      'physics',
      'chemistry',
      'geography',
      'history',
    ];

    const exportHeaders = [...standardHeaders, ...allDynamicSubjects, 'average', 'gpa', 'classPosition', 'nectaDivision'];
    const headerRow = exportHeaders.map(escapeCsvCell).join(',');
    const rows = students.map((s) => {
      const rowMap: Record<string, string> = {
        id: escapeCsvCell(s.id),
        name: escapeCsvCell(s.name),
        gender: escapeCsvCell(s.gender || 'M'),
        form: escapeCsvCell(s.form),
        stream: escapeCsvCell(s.stream),
        school: escapeCsvCell(s.school),
        region: escapeCsvCell(s.region),
        district: escapeCsvCell(s.district),
        term: escapeCsvCell(s.term),
        year: escapeCsvCell(s.year),
        parent: escapeCsvCell(s.parent),
        phone: formatCsvPhone(s.phone),
        whatsapp: formatCsvPhone(s.whatsapp || s.phone),
        email: escapeCsvCell(s.email),
        feeStatus: escapeCsvCell(s.feeStatus),
        feeBalance_TZS: String(s.feeBalance || 0),
        feeBalance_Formatted: formatCsvCurrency(s.feeBalance, 'TZS'),
        attendance: String(s.attendance || 0),
        mathematics: String(s.mathematics || 0),
        english: String(s.english || 0),
        kiswahili: String(s.kiswahili || 0),
        science: String(s.science || 0),
        physics: String(s.physics ?? ''),
        chemistry: String(s.chemistry ?? ''),
        geography: String(s.geography ?? ''),
        history: String(s.history ?? ''),
      };

      const customVals = allDynamicSubjects.map((sub) => escapeCsvCell(s.customSubjects?.[sub] ?? ''));
      const metricVals = [
        String(s.average || 0),
        escapeCsvCell(s.gpa ? s.gpa.toFixed(2) : ''),
        escapeCsvCell(s.classPosition ?? ''),
        escapeCsvCell(s.nectaDivision),
      ];

      const standardVals = standardHeaders.map((h) => rowMap[h] ?? '""');
      return [...standardVals, ...customVals, ...metricVals].join(',');
    });

    const csvContent = [headerRow, ...rows].join('\n');
    downloadCsvFile(csvContent, `eduscore-tz-complete-records-${Date.now()}`);

    setStatusMessage(`✓ Exported ${students.length} student records with formatted phone and currency columns.`);
  };

  // Download Tailored CSV Template
  const handleDownloadTemplate = () => {
    const csvContent = generateCsvTemplate(templateType);
    downloadCsvFile(csvContent, `eduscore-tz-template-${templateType}`);
    setStatusMessage(`✓ Downloaded tailored CSV template for ${templateType.replace('_', ' ').toUpperCase()}.`);
  };

  // Robust CSV Line Parser
  const parseCsvLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  // Dynamic Column Matching & Importing via universal parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const result = parseStudentCsv(text, file.name);

        let finalStudents: Student[];
        if (importMode === 'replace') {
          finalStudents = result.students;
        } else {
          // Merge: update matching IDs, append new ones
          const map = new Map<string, Student>();
          students.forEach((s) => map.set(s.id, s));
          result.students.forEach((s) => map.set(s.id, s));
          finalStudents = calculateClassPositions(Array.from(map.values()));
        }

        onImportStudents(finalStudents);

        const overallAvg =
          finalStudents.reduce((a, s) => a + s.average, 0) / (finalStudents.length || 1);
        const overallGpa =
          finalStudents.reduce((a, s) => a + (s.gpa || 3.5), 0) / (finalStudents.length || 1);

        setImportSummary({
          rowCount: result.totalRows,
          detectedSubjects: result.detectedSubjects,
          avgScore: Math.round(overallAvg * 10) / 10,
          schoolGpa: Math.round(overallGpa * 100) / 100,
          fileName: file.name,
          mode: importMode,
        });

        setStatusMessage(
          `✓ Successfully ${importMode === 'replace' ? 'loaded fresh database of' : 'merged and updated'} ${result.totalRows} student records from ${file.name}.`
        );
      } catch (err: any) {
        alert('Failed to parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredStudents = students.filter((s) => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.form.toLowerCase().includes(q) ||
      s.school.toLowerCase().includes(q) ||
      s.parent.toLowerCase().includes(q) ||
      s.phone.includes(q)
    );
  });

  return (
    <div id="view-data-centre" className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner Card */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Data Centre & Flexible Excel / CSV Engine
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload student datasets with variable curriculum subjects across different schools, years, and levels (Primary, O-Level, A-Level, Colleges).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCsv}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export Full CSV</span>
            </button>
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-[11px] font-bold text-slate-600 pl-1.5">Mode:</span>
              <select
                value={importMode}
                onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                className="text-xs font-bold px-2 py-1 border-0 bg-transparent rounded focus:outline-hidden text-slate-800"
                title="Merge: updates matching IDs and appends new. Replace: clears and loads fresh sheet."
              >
                <option value="merge">Merge & Update</option>
                <option value="replace">Replace Database</option>
              </select>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV File</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
          </div>
        </div>

        {/* Download Tailored Template Bar */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Download Official CSV / Excel Template:
              </span>
              <span className="text-[11px] text-slate-500">
                Pre-formatted with the exact subject columns required for your school category.
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as InstitutionType)}
              className="text-xs font-bold px-3 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-hidden"
            >
              <option value="secondary_olevel">Secondary O-Level (Form I - IV)</option>
              <option value="secondary_alevel">Secondary A-Level (Form V - VI)</option>
              <option value="primary">Primary School (Standard I - VII)</option>
              <option value="vocational_college">Vocational / College (VETA)</option>
            </select>
            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import Success Summary Card */}
      {importSummary && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 animate-fadeIn">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-sm font-bold text-emerald-950">
                  Import Batch Successfully Processed: {importSummary.fileName}
                </h4>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {importSummary.rowCount} Records Active
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                All student scores were dynamically graded against NECTA algorithms. Class ranks, GPAs ({importSummary.schoolGpa}), averages ({importSummary.avgScore}%), and divisions were generated automatically.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="text-[11px] font-bold text-emerald-900">Detected Subjects:</span>
                {importSummary.detectedSubjects.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] font-bold bg-white text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md shadow-2xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Data Matrix & Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Active Student Data Ledger ({filteredStudents.length} Records)
            </h4>
            <p className="text-xs text-gray-500">
              Live database synchronized across all app views, reports, and parent messaging.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              onClick={onRestoreDemo}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-gray-200 rounded-lg transition"
              title="Restore demo dataset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-100 text-gray-600 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">ID / Reg</th>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Level / Stream</th>
                <th className="px-4 py-3">Term Average</th>
                <th className="px-4 py-3">GPA</th>
                <th className="px-4 py-3">NECTA Div</th>
                <th className="px-4 py-3">Parent / Contact</th>
                <th className="px-4 py-3">Fee Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((s, idx) => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-bold text-amber-700">
                    #{s.classPosition || idx + 1}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-500">{s.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {s.name}
                    {s.gender && (
                      <span className="text-[10px] ml-1 text-gray-400">({s.gender})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {s.form} — {s.stream}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900">{s.average}%</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-700">
                    {s.gpa ? s.gpa.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.nectaDivision === 'Division I'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.nectaDivision === 'Division II'
                          ? 'bg-blue-100 text-blue-800'
                          : s.nectaDivision === 'Division III'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {s.nectaDivision}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{s.parent}</div>
                    <div className="text-[10px] text-gray-500">{s.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.feeStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.feeStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
