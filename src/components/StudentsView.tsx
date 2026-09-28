import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  LineChart,
  Bot,
  AlertCircle,
  MessageSquare,
  Printer,
  Plus,
  X,
  Award,
  Phone,
  Mail,
  HeartHandshake,
  Filter,
  SlidersHorizontal,
  Sparkles,
  BookOpen,
  DollarSign,
  Download,
  Upload,
  FileSpreadsheet,
  Layers,
  Trash2,
  FileCheck,
  CheckCircle2,
  School,
} from 'lucide-react';
import { Student, FormLevel, InstitutionType, TermType } from '../types';
import {
  getNectaGrade,
  formatTzs,
  calculateStudentNectaMetrics,
  formatOrdinal,
  generateCsvTemplate,
  parseStudentCsv,
  calculateClassPositions,
  getSubjectsForFormLevel,
} from '../utils/necta';
import {
  formatCsvPhone,
  formatCsvCurrency,
  escapeCsvCell,
  downloadCsvFile,
} from '../utils/csvFormatter';

interface StudentsViewProps {
  students: Student[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenMessageWithStudent: (studentId: string) => void;
  onOpenReportWithStudent: (studentId: string) => void;
  onAddStudent: (newStudent: Student) => void;
  onImportStudents?: (newStudents: Student[]) => void;
  language: 'en' | 'sw';
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  searchQuery,
  onSearchChange,
  onOpenMessageWithStudent,
  onOpenReportWithStudent,
  onAddStudent,
  onImportStudents,
  language,
}) => {
  // Advanced Filter System States
  const [formFilter, setFormFilter] = useState<string>('All');
  const [regionFilter, setRegionFilter] = useState<string>('All');
  const [schoolFilter, setSchoolFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [termFilter, setTermFilter] = useState<string>('All');
  const [performanceFilter, setPerformanceFilter] = useState<string>('All');
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [feeFilter, setFeeFilter] = useState<string>('All');
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);

  const [expandedId, setExpandedId] = useState<string | null>(students[0]?.id || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // CSV Upload Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'merge' | 'replace'>('merge');
  const [templateLevel, setTemplateLevel] = useState<InstitutionType>('secondary_olevel');
  const [uploadPreview, setUploadPreview] = useState<{
    students: Student[];
    detectedSubjects: string[];
    totalRows: number;
    fileName: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const csvModalInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Candidate Subjects State for Add Candidate Modal
  interface CandidateSubjectEntry {
    name: string;
    score: number;
  }

  const [candidateSubjects, setCandidateSubjects] = useState<CandidateSubjectEntry[]>([
    { name: 'Basic Mathematics', score: 65 },
    { name: 'English Language', score: 70 },
    { name: 'Kiswahili', score: 75 },
    { name: 'Biology', score: 68 },
    { name: 'Physics', score: 65 },
    { name: 'Chemistry', score: 64 },
    { name: 'Geography', score: 70 },
    { name: 'History', score: 72 },
    { name: 'Civics', score: 74 },
  ]);

  const [newSubjInput, setNewSubjInput] = useState('');
  const [newSubjScore, setNewSubjScore] = useState(65);

  const handleAddCandidateSubject = () => {
    if (!newSubjInput.trim()) return;
    setCandidateSubjects([...candidateSubjects, { name: newSubjInput.trim(), score: newSubjScore }]);
    setNewSubjInput('');
    setNewSubjScore(65);
  };

  const handleRemoveCandidateSubject = (idx: number) => {
    setCandidateSubjects(candidateSubjects.filter((_, i) => i !== idx));
  };

  const handleCandidateSubjectScoreChange = (idx: number, score: number) => {
    const copy = [...candidateSubjects];
    copy[idx].score = Math.max(0, Math.min(100, score || 0));
    setCandidateSubjects(copy);
  };

  const handleCandidateSubjectNameChange = (idx: number, name: string) => {
    const copy = [...candidateSubjects];
    copy[idx].name = name;
    setCandidateSubjects(copy);
  };

  const handleQuickAddSubject = (name: string) => {
    if (!candidateSubjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setCandidateSubjects([...candidateSubjects, { name, score: 65 }]);
    }
  };

  const handleLoadPresetSubjects = (preset: 'olevel' | 'alevel_science' | 'alevel_arts' | 'primary' | 'vocational') => {
    switch (preset) {
      case 'olevel':
        setCandidateSubjects([
          { name: 'Basic Mathematics', score: 65 },
          { name: 'English Language', score: 70 },
          { name: 'Kiswahili', score: 75 },
          { name: 'Biology', score: 68 },
          { name: 'Physics', score: 65 },
          { name: 'Chemistry', score: 64 },
          { name: 'Geography', score: 70 },
          { name: 'History', score: 72 },
          { name: 'Civics', score: 74 },
        ]);
        break;
      case 'alevel_science':
        setCandidateSubjects([
          { name: 'Advanced Mathematics', score: 68 },
          { name: 'Physics', score: 70 },
          { name: 'Chemistry', score: 72 },
          { name: 'Biology', score: 70 },
          { name: 'General Studies', score: 75 },
          { name: 'Basic Applied Mathematics', score: 65 },
        ]);
        break;
      case 'alevel_arts':
        setCandidateSubjects([
          { name: 'Economics', score: 70 },
          { name: 'Geography', score: 72 },
          { name: 'History', score: 74 },
          { name: 'English Language', score: 76 },
          { name: 'Kiswahili', score: 75 },
          { name: 'General Studies', score: 78 },
        ]);
        break;
      case 'primary':
        setCandidateSubjects([
          { name: 'Hisabati', score: 70 },
          { name: 'Kiingereza', score: 72 },
          { name: 'Kiswahili', score: 78 },
          { name: 'Sayansi na Teknolojia', score: 74 },
          { name: 'Maarifa ya Jamii', score: 72 },
          { name: 'Uraia na Maadili', score: 80 },
        ]);
        break;
      case 'vocational':
        setCandidateSubjects([
          { name: 'Trade Theory', score: 75 },
          { name: 'Trade Practical', score: 82 },
          { name: 'Technical Mathematics', score: 70 },
          { name: 'Communication Skills', score: 74 },
          { name: 'Entrepreneurship', score: 78 },
        ]);
        break;
    }
  };

  // Dynamic filter lists derived from data
  const availableRegions = useMemo(() => {
    const list = Array.from(new Set(students.map((s) => s.region).filter(Boolean)));
    return ['All', ...list];
  }, [students]);

  const availableSchools = useMemo(() => {
    const list = Array.from(new Set(students.map((s) => s.school).filter(Boolean)));
    return ['All', ...list];
  }, [students]);

  const availableForms = useMemo(() => {
    const list = Array.from(new Set(students.map((s) => s.form).filter(Boolean)));
    return ['All', ...list];
  }, [students]);

  const availableYears = useMemo(() => {
    const list = Array.from(new Set(students.map((s) => s.year).filter(Boolean)));
    return ['All', ...list];
  }, [students]);

  // New Student Form State with Dynamic Subject Support
  const [newForm, setNewForm] = useState({
    id: `TZ-2026-${Date.now().toString().slice(-4)}`,
    name: '',
    gender: 'M' as 'M' | 'F',
    form: 'Form IV' as FormLevel,
    stream: 'A' as any,
    school: 'Jitegemee Secondary School',
    region: 'Dar es Salaam',
    district: 'Kinondoni',
    term: 'Term 1' as TermType,
    year: '2026',
    parent: '',
    phone: '+2557',
    whatsapp: '+2557',
    email: '',
    attendance: 95,
    feeStatus: 'Paid' as any,
    feeBalance: 0,
    discipline: 'Good' as any,
    healthSupport: 'None recorded',
    notes: 'General student profile.',
    teacherRecommendation: '',
    headteacherComment: '',
  });

  // Preview metrics in modal computed dynamically from candidateSubjects
  const modalPreviewMetrics = useMemo(() => {
    const coreMap: Record<string, number> = {};
    const customMap: Record<string, number> = {};

    candidateSubjects.forEach((s) => {
      const clean = s.name.toLowerCase().replace(/[^a-z]/g, '');
      if (clean.includes('math') || clean.includes('hisabati')) {
        coreMap.mathematics = s.score;
      } else if (clean.includes('english') || clean.includes('kiingereza')) {
        coreMap.english = s.score;
      } else if (clean.includes('kiswahili') || clean.includes('swahili')) {
        coreMap.kiswahili = s.score;
      } else if (clean.includes('science') || clean.includes('sayansi') || clean.includes('biology') || clean.includes('biolojia')) {
        coreMap.science = s.score;
      } else if (clean.includes('physics') || clean.includes('fizikia')) {
        coreMap.physics = s.score;
      } else if (clean.includes('chemistry') || clean.includes('kemia')) {
        coreMap.chemistry = s.score;
      } else if (clean.includes('geography') || clean.includes('jiografia')) {
        coreMap.geography = s.score;
      } else if (clean.includes('history') || clean.includes('historia')) {
        coreMap.history = s.score;
      } else {
        customMap[s.name] = s.score;
      }
    });

    const guessType: InstitutionType = newForm.form.startsWith('Standard')
      ? 'primary'
      : newForm.form.startsWith('Form V') || newForm.form.startsWith('Form VI')
      ? 'secondary_alevel'
      : newForm.form.startsWith('Year')
      ? 'vocational_college'
      : 'secondary_olevel';

    return calculateStudentNectaMetrics(
      {
        ...newForm,
        ...coreMap,
        customSubjects: customMap,
      },
      guessType
    );
  }, [newForm, candidateSubjects]);

  // Comprehensive Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Region
      if (regionFilter !== 'All' && s.region !== regionFilter) return false;
      // School
      if (schoolFilter !== 'All' && s.school !== schoolFilter) return false;
      // Form
      if (formFilter !== 'All' && s.form !== formFilter) return false;
      // Year
      if (yearFilter !== 'All' && s.year !== yearFilter) return false;
      // Term
      if (termFilter !== 'All' && s.term !== termFilter) return false;
      // Gender
      if (genderFilter !== 'All' && s.gender !== genderFilter) return false;
      // Fee Status
      if (feeFilter !== 'All' && s.feeStatus !== feeFilter) return false;

      // Performance Criteria
      if (performanceFilter === 'Division I' && s.nectaDivision !== 'Division I') return false;
      if (performanceFilter === 'Division II' && s.nectaDivision !== 'Division II') return false;
      if (performanceFilter === 'Division III' && s.nectaDivision !== 'Division III') return false;
      if (performanceFilter === 'Division IV' && s.nectaDivision !== 'Division IV') return false;
      if (performanceFilter === 'Division 0' && s.nectaDivision !== 'Division 0') return false;
      if (performanceFilter === 'At-Risk' && s.average >= 45 && s.attendance >= 80) return false;
      if (performanceFilter === 'Top 10% Honors' && s.average < 75) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.parent.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.school.toLowerCase().includes(q) ||
          s.form.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    students,
    regionFilter,
    schoolFilter,
    formFilter,
    yearFilter,
    termFilter,
    genderFilter,
    feeFilter,
    performanceFilter,
    searchQuery,
  ]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();

    const coreMap: Record<string, number> = {};
    const customMap: Record<string, number> = {};

    candidateSubjects.forEach((s) => {
      const clean = s.name.toLowerCase().replace(/[^a-z]/g, '');
      if (clean.includes('math') || clean.includes('hisabati')) {
        coreMap.mathematics = s.score;
      } else if (clean.includes('english') || clean.includes('kiingereza')) {
        coreMap.english = s.score;
      } else if (clean.includes('kiswahili') || clean.includes('swahili')) {
        coreMap.kiswahili = s.score;
      } else if (clean.includes('science') || clean.includes('sayansi') || clean.includes('biology') || clean.includes('biolojia')) {
        coreMap.science = s.score;
      } else if (clean.includes('physics') || clean.includes('fizikia')) {
        coreMap.physics = s.score;
      } else if (clean.includes('chemistry') || clean.includes('kemia')) {
        coreMap.chemistry = s.score;
      } else if (clean.includes('geography') || clean.includes('jiografia')) {
        coreMap.geography = s.score;
      } else if (clean.includes('history') || clean.includes('historia')) {
        coreMap.history = s.score;
      } else {
        customMap[s.name] = s.score;
      }
    });

    const guessType: InstitutionType = newForm.form.startsWith('Standard')
      ? 'primary'
      : newForm.form.startsWith('Form V') || newForm.form.startsWith('Form VI')
      ? 'secondary_alevel'
      : newForm.form.startsWith('Year')
      ? 'vocational_college'
      : 'secondary_olevel';

    const metrics = calculateStudentNectaMetrics(
      {
        ...newForm,
        ...coreMap,
        customSubjects: customMap,
      },
      guessType
    );

    const createdStudent: Student = {
      mathematics: 0,
      english: 0,
      kiswahili: 0,
      science: 0,
      ...newForm,
      ...coreMap,
      customSubjects: customMap,
      average: metrics.average,
      gpa: metrics.gpa,
      nectaGrade: metrics.nectaGrade,
      nectaPoints: metrics.nectaPoints,
      nectaDivision: metrics.nectaDivision,
      avatarColor: 'bg-teal-700',
    };

    onAddStudent(createdStudent);
    setIsAddModalOpen(false);

    // Reset Form
    setNewForm({
      id: `TZ-2026-${Date.now().toString().slice(-4)}`,
      name: '',
      gender: 'M',
      form: 'Form IV',
      stream: 'A',
      school: 'Jitegemee Secondary School',
      region: 'Dar es Salaam',
      district: 'Kinondoni',
      term: 'Term 1',
      year: '2026',
      parent: '',
      phone: '+2557',
      whatsapp: '+2557',
      email: '',
      attendance: 95,
      feeStatus: 'Paid',
      feeBalance: 0,
      discipline: 'Good',
      healthSupport: 'None recorded',
      notes: 'General student profile.',
      teacherRecommendation: '',
      headteacherComment: '',
    });
  };

  // CSV Modal Operations
  const handleUploadModalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const result = parseStudentCsv(text, file.name);
        if (result.students.length === 0) {
          setUploadError('No valid student records found in the uploaded file.');
          return;
        }
        setUploadPreview({
          students: result.students,
          detectedSubjects: result.detectedSubjects,
          totalRows: result.totalRows,
          fileName: file.name,
        });
      } catch (err: any) {
        setUploadError(err.message || 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
    if (csvModalInputRef.current) csvModalInputRef.current.value = '';
  };

  const handleConfirmUpload = () => {
    if (!uploadPreview || !onImportStudents) return;

    let finalStudents: Student[];
    if (uploadMode === 'replace') {
      finalStudents = uploadPreview.students;
    } else {
      const map = new Map<string, Student>();
      students.forEach((s) => map.set(s.id, s));
      uploadPreview.students.forEach((s) => map.set(s.id, s));
      finalStudents = calculateClassPositions(Array.from(map.values()));
    }

    onImportStudents(finalStudents);
    setIsUploadModalOpen(false);
    setUploadPreview(null);
  };

  const handleDownloadModalTemplate = () => {
    const templateContent = generateCsvTemplate(templateLevel);
    downloadCsvFile(templateContent, `necta-template-${templateLevel}`);
  };

  const resetAllFilters = () => {
    setFormFilter('All');
    setRegionFilter('All');
    setSchoolFilter('All');
    setYearFilter('All');
    setTermFilter('All');
    setPerformanceFilter('All');
    setGenderFilter('All');
    setFeeFilter('All');
    onSearchChange('');
  };

  const handleExportFilteredCsv = () => {
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
      'average',
      'gpa',
      'classPosition',
      'nectaDivision',
      'feeStatus',
      'feeBalance_TZS',
      'feeBalance_Formatted',
      'attendance',
      'mathematics',
      'english',
      'kiswahili',
      'science',
    ];

    const allCustomKeys = Array.from(
      new Set(filteredStudents.flatMap((s) => (s.customSubjects ? Object.keys(s.customSubjects) : [])))
    );

    const headers = [...standardHeaders, ...allCustomKeys].map(escapeCsvCell).join(',');
    const rows = filteredStudents.map((s) => {
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
        average: String(s.average || 0),
        gpa: escapeCsvCell(s.gpa ? s.gpa.toFixed(2) : ''),
        classPosition: escapeCsvCell(s.classPosition ?? ''),
        nectaDivision: escapeCsvCell(s.nectaDivision),
        feeStatus: escapeCsvCell(s.feeStatus),
        feeBalance_TZS: String(s.feeBalance || 0),
        feeBalance_Formatted: formatCsvCurrency(s.feeBalance, 'TZS'),
        attendance: String(s.attendance || 0),
        mathematics: String(s.mathematics || 0),
        english: String(s.english || 0),
        kiswahili: String(s.kiswahili || 0),
        science: String(s.science || 0),
      };

      const customValues = allCustomKeys.map((k) => escapeCsvCell(s.customSubjects?.[k] ?? ''));
      const stdValues = standardHeaders.map((h) => rowMap[h] ?? '""');
      return [...stdValues, ...customValues].join(',');
    });

    const csvData = [headers, ...rows].join('\n');
    downloadCsvFile(csvData, `students-export-${formFilter !== 'All' ? formFilter.replace(/\s+/g, '_') : 'all'}-${Date.now()}`);
  };

  return (
    <div id="view-students" className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              id="searchStudentsInput"
              placeholder="Search by student name, ID, parent, phone, or region..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`px-3.5 py-2.5 border rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                showFiltersPanel || formFilter !== 'All' || performanceFilter !== 'All' || regionFilter !== 'All'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-gray-50 border-gray-300 text-slate-700 hover:bg-gray-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(formFilter !== 'All' || performanceFilter !== 'All' || regionFilter !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>

            <button
              onClick={handleExportFilteredCsv}
              title="Export currently filtered students to Excel-ready CSV"
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV ({filteredStudents.length})</span>
            </button>

            <button
              id="btn-open-add-student"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add Candidate</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {showFiltersPanel && (
          <div className="pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs animate-fadeIn">
            {/* Region */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Region</label>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
              >
                {availableRegions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* School */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">School</label>
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs truncate"
              >
                {availableSchools.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Form Level */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Class Level</label>
              <select
                value={formFilter}
                onChange={(e) => setFormFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
              >
                {availableForms.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Year</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Term */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Term</label>
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
              >
                <option value="All">All 4 Terms</option>
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
                <option value="Term 4">Term 4</option>
              </select>
            </div>

            {/* Performance Criteria */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Standing</label>
              <select
                value={performanceFilter}
                onChange={(e) => setPerformanceFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
              >
                <option value="All">All Grades</option>
                <option value="Division I">Division I</option>
                <option value="Division II">Division II</option>
                <option value="Division III">Division III</option>
                <option value="Division IV">Division IV</option>
                <option value="Division 0">Division 0</option>
                <option value="At-Risk">At-Risk (&lt;45%)</option>
                <option value="Top 10% Honors">Top Honors (75%+)</option>
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Gender</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
              >
                <option value="All">All</option>
                <option value="M">Male (M)</option>
                <option value="F">Female (F)</option>
              </select>
            </div>

            {/* Fee Status */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Fees</label>
              <select
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Outstanding">Outstanding</option>
              </select>
            </div>
          </div>
        )}

        {/* Filter Summary Tags & Active Count */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900">
              Showing {filteredStudents.length} of {students.length} Candidates
            </span>
            {(formFilter !== 'All' || performanceFilter !== 'All' || regionFilter !== 'All' || searchQuery) && (
              <button
                onClick={resetAllFilters}
                className="text-amber-700 font-bold hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Student Cards / Matrix */}
      <div className="space-y-4">
        {filteredStudents.map((stu) => {
          const isExpanded = expandedId === stu.id;
          const gradeInfo = getNectaGrade(stu.average);

          return (
            <div
              key={stu.id}
              className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-xs ${
                isExpanded ? 'border-amber-400 ring-1 ring-amber-400/40' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Card Summary Header Bar */}
              <div
                onClick={() => toggleExpand(stu.id)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer bg-white hover:bg-slate-50/50 select-none"
              >
                <div className="flex items-center space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                      stu.avatarColor || 'bg-teal-700'
                    }`}
                  >
                    {stu.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">{stu.name}</h4>
                      {stu.classPosition && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                          Class Rank: {formatOrdinal(stu.classPosition)}
                          {stu.cohortSize ? ` of ${stu.cohortSize}` : ''}
                        </span>
                      )}
                      {stu.gender && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                          {stu.gender === 'F' ? 'Female' : 'Male'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stu.id} | {stu.form} {stu.stream} | {stu.school} ({stu.region})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-900">
                      {stu.average}% ({gradeInfo.grade})
                    </div>
                    <div className="text-[10px] text-gray-500 font-medium">
                      {stu.nectaDivision} {stu.gpa ? `| GPA ${stu.gpa.toFixed(2)}` : ''}
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      stu.nectaDivision === 'Division I'
                        ? 'bg-emerald-100 text-emerald-800'
                        : stu.nectaDivision === 'Division II'
                        ? 'bg-blue-100 text-blue-800'
                        : stu.nectaDivision === 'Division III'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {stu.nectaDivision}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Detailed Matrix */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-slate-50/40 space-y-4">
                  {/* Subject Marks Grid */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Academic Subject Ledger & Continuous Assessment
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Mathematics</span>
                        <span className="font-bold text-slate-900 text-sm">{stu.mathematics}%</span>
                        <span className="text-[10px] text-emerald-700 block font-bold">
                          {getNectaGrade(stu.mathematics).grade}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">English</span>
                        <span className="font-bold text-slate-900 text-sm">{stu.english}%</span>
                        <span className="text-[10px] text-emerald-700 block font-bold">
                          {getNectaGrade(stu.english).grade}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Kiswahili</span>
                        <span className="font-bold text-slate-900 text-sm">{stu.kiswahili}%</span>
                        <span className="text-[10px] text-emerald-700 block font-bold">
                          {getNectaGrade(stu.kiswahili).grade}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Science / Bio</span>
                        <span className="font-bold text-slate-900 text-sm">{stu.science}%</span>
                        <span className="text-[10px] text-emerald-700 block font-bold">
                          {getNectaGrade(stu.science).grade}
                        </span>
                      </div>

                      {typeof stu.physics === 'number' && (
                        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="text-[10px] text-gray-500 block">Physics</span>
                          <span className="font-bold text-slate-900 text-sm">{stu.physics}%</span>
                          <span className="text-[10px] text-emerald-700 block font-bold">
                            {getNectaGrade(stu.physics).grade}
                          </span>
                        </div>
                      )}

                      {typeof stu.chemistry === 'number' && (
                        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="text-[10px] text-gray-500 block">Chemistry</span>
                          <span className="font-bold text-slate-900 text-sm">{stu.chemistry}%</span>
                          <span className="text-[10px] text-emerald-700 block font-bold">
                            {getNectaGrade(stu.chemistry).grade}
                          </span>
                        </div>
                      )}

                      {typeof stu.geography === 'number' && (
                        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="text-[10px] text-gray-500 block">Geography</span>
                          <span className="font-bold text-slate-900 text-sm">{stu.geography}%</span>
                          <span className="text-[10px] text-emerald-700 block font-bold">
                            {getNectaGrade(stu.geography).grade}
                          </span>
                        </div>
                      )}

                      {typeof stu.history === 'number' && (
                        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                          <span className="text-[10px] text-gray-500 block">History</span>
                          <span className="font-bold text-slate-900 text-sm">{stu.history}%</span>
                          <span className="text-[10px] text-emerald-700 block font-bold">
                            {getNectaGrade(stu.history).grade}
                          </span>
                        </div>
                      )}

                      {/* Any dynamic custom subjects */}
                      {stu.customSubjects &&
                        Object.entries(stu.customSubjects).map(([subj, val]) => (
                          <div
                            key={subj}
                            className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-200"
                          >
                            <span className="text-[10px] text-amber-900 font-semibold block truncate" title={subj}>
                              {subj}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{val}%</span>
                            <span className="text-[10px] text-emerald-700 block font-bold">
                              {getNectaGrade(val).grade}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Parent, Attendance, and Financial Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        Parent & Contact
                      </span>
                      <div className="font-bold text-slate-900">{stu.parent}</div>
                      <div className="text-gray-600 mt-0.5 flex items-center">
                        <Phone className="w-3 h-3 mr-1 text-gray-400" />
                        <span>{stu.phone}</span>
                      </div>
                      {stu.email && (
                        <div className="text-gray-600 mt-0.5 flex items-center truncate">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          <span>{stu.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        Attendance & Conduct
                      </span>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Attendance:</span>
                        <span className="font-bold text-slate-900">{stu.attendance}%</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-600">Discipline:</span>
                        <span className="font-semibold text-emerald-700">{stu.discipline}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 italic">
                        {stu.notes}
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                        Fee & Accounts
                      </span>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            stu.feeStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {stu.feeStatus}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-600">Balance:</span>
                        <span className="font-bold text-slate-900">
                          {formatTzs(stu.feeBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => onOpenMessageWithStudent(stu.id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message Guardian</span>
                    </button>
                    <button
                      onClick={() => onOpenReportWithStudent(stu.id)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Generate Report Card</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dynamic Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden my-8 animate-scaleIn">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm">Register New Candidate & Academic Ledger</h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Basic Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration ID</label>
                  <input
                    type="text"
                    required
                    value={newForm.id}
                    onChange={(e) => setNewForm({ ...newForm, id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Full Student Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Baraka Juma Mrema"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gender</label>
                  <select
                    value={newForm.gender}
                    onChange={(e) => setNewForm({ ...newForm, gender: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
                  >
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Form / Level</label>
                  <select
                    value={newForm.form}
                    onChange={(e) => setNewForm({ ...newForm, form: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs font-semibold"
                  >
                    <option value="Form I">Form I</option>
                    <option value="Form II">Form II</option>
                    <option value="Form III">Form III</option>
                    <option value="Form IV">Form IV</option>
                    <option value="Form V">Form V</option>
                    <option value="Form VI">Form VI</option>
                    <option value="Standard VI">Standard VI (Primary)</option>
                    <option value="Standard VII">Standard VII (PSLE)</option>
                    <option value="Year 1">Year 1 (College)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stream</label>
                  <input
                    type="text"
                    value={newForm.stream}
                    onChange={(e) => setNewForm({ ...newForm, stream: e.target.value as any })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={newForm.year}
                    onChange={(e) => setNewForm({ ...newForm, year: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Academic Subjects & Preset Loaders */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                  <div>
                    <h5 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
                      Subject Marks & Curriculum Assessment (0 - 100)
                    </h5>
                    <p className="text-[10px] text-gray-500">
                      Add and adjust scores for standard NECTA core subjects or specialized school subjects.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => handleLoadPresetSubjects('olevel')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                    >
                      O-Level
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPresetSubjects('alevel_science')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                    >
                      A-Level Sci
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPresetSubjects('alevel_arts')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                    >
                      A-Level Arts
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadPresetSubjects('primary')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                    >
                      Primary
                    </button>
                  </div>
                </div>

                {/* Candidate Subjects Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                    {candidateSubjects.map((sub, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 text-xs">
                        <div className="flex-1 pr-2">
                          <input
                            type="text"
                            value={sub.name}
                            onChange={(e) => handleCandidateSubjectNameChange(idx, e.target.value)}
                            className="w-full font-semibold text-slate-800 bg-transparent border-0 focus:ring-0 text-xs p-0"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={sub.score}
                            onChange={(e) => handleCandidateSubjectScoreChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-16 p-1 border border-gray-300 rounded text-center text-xs font-bold text-slate-900 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCandidateSubject(idx)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                            title="Remove subject"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Custom Subject Bar */}
                <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    placeholder="Add subject (e.g. Commerce, Arabic, French, Civics)"
                    value={newSubjInput}
                    onChange={(e) => setNewSubjInput(e.target.value)}
                    className="flex-1 p-1.5 border border-gray-300 rounded-lg bg-white text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCandidateSubject();
                      }
                    }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newSubjScore}
                    onChange={(e) => setNewSubjScore(parseFloat(e.target.value) || 0)}
                    className="w-16 p-1.5 border border-gray-300 rounded-lg bg-white text-xs text-center font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddCandidateSubject}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {/* Parent & Fees */}
              <div className="pt-2 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Parent / Guardian</label>
                  <input
                    type="text"
                    required
                    placeholder="Parent Full Name"
                    value={newForm.parent}
                    onChange={(e) => setNewForm({ ...newForm, parent: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fee Balance (TZS)</label>
                  <input
                    type="number"
                    value={newForm.feeBalance}
                    onChange={(e) => setNewForm({ ...newForm, feeBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white text-xs"
                  />
                </div>
              </div>

              {/* Real-time Computed Grading Preview */}
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-950 block">Calculated NECTA Assessment Preview:</span>
                  <span className="text-amber-900">
                    Average: {modalPreviewMetrics.average}% | Points: {modalPreviewMetrics.nectaPoints} | Division: {modalPreviewMetrics.nectaDivision}
                  </span>
                </div>
                <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                  GPA: {modalPreviewMetrics.gpa.toFixed(2)}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end space-x-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition shadow-xs flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Candidate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
