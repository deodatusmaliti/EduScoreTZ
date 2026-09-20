import { NectaDivision, Student, InstitutionType, TermType } from '../types';
import { formatCsvPhone, escapeCsvCell } from './csvFormatter';

export const ALL_TERMS: { id: TermType; nameEn: string; nameSw: string; period: string }[] = [
  { id: 'Term 1', nameEn: 'Term 1', nameSw: 'Muhula wa 1', period: 'Jan - Mar' },
  { id: 'Term 2', nameEn: 'Term 2', nameSw: 'Muhula wa 2', period: 'Apr - Jun' },
  { id: 'Term 3', nameEn: 'Term 3', nameSw: 'Muhula wa 3', period: 'Jul - Sep' },
  { id: 'Term 4', nameEn: 'Term 4', nameSw: 'Muhula wa 4', period: 'Oct - Dec' },
];

export interface GradeDetail {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  points: number;
  remarksEn: string;
  remarksSw: string;
  color: string;
  bgLight: string;
}

export function getNectaGrade(score: number): GradeDetail {
  if (score >= 75) {
    return { grade: 'A', points: 1, remarksEn: 'Excellent', remarksSw: 'Bora Sana', color: 'text-emerald-700', bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (score >= 65) {
    return { grade: 'B', points: 2, remarksEn: 'Very Good', remarksSw: 'Nzuri Sana', color: 'text-blue-700', bgLight: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  if (score >= 45) {
    return { grade: 'C', points: 3, remarksEn: 'Good', remarksSw: 'Nzuri', color: 'text-amber-700', bgLight: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (score >= 30) {
    return { grade: 'D', points: 4, remarksEn: 'Satisfactory', remarksSw: 'Inaridhisha', color: 'text-orange-700', bgLight: 'bg-orange-50 text-orange-700 border-orange-200' };
  }
  return { grade: 'F', points: 5, remarksEn: 'Fail', remarksSw: 'Kufeli', color: 'text-red-700', bgLight: 'bg-red-50 text-red-700 border-red-200' };
}

export function calculateStudentNectaMetrics(
  student: Partial<Student>,
  institutionType: InstitutionType = 'secondary_olevel'
): {
  average: number;
  gpa: number;
  nectaGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  nectaPoints: number;
  nectaDivision: NectaDivision;
} {
  const scores: number[] = [];
  if (typeof student.mathematics === 'number' && !isNaN(student.mathematics)) scores.push(student.mathematics);
  if (typeof student.english === 'number' && !isNaN(student.english)) scores.push(student.english);
  if (typeof student.kiswahili === 'number' && !isNaN(student.kiswahili)) scores.push(student.kiswahili);
  if (typeof student.science === 'number' && !isNaN(student.science)) scores.push(student.science);
  if (typeof student.physics === 'number' && !isNaN(student.physics)) scores.push(student.physics);
  if (typeof student.chemistry === 'number' && !isNaN(student.chemistry)) scores.push(student.chemistry);
  if (typeof student.geography === 'number' && !isNaN(student.geography)) scores.push(student.geography);
  if (typeof student.history === 'number' && !isNaN(student.history)) scores.push(student.history);

  // Include any dynamic custom subjects entered via CSV or form
  if (student.customSubjects) {
    Object.values(student.customSubjects).forEach((val) => {
      if (typeof val === 'number' && !isNaN(val)) {
        scores.push(val);
      }
    });
  }

  if (scores.length === 0) {
    return {
      average: 0,
      gpa: institutionType === 'primary' ? 0 : 5.0,
      nectaGrade: 'F',
      nectaPoints: 35,
      nectaDivision: 'Division 0',
    };
  }

  const average = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  const gradeDetail = getNectaGrade(average);

  // Calculate points for NECTA Division: take up to top 7 subjects points
  const pointsList = scores.map((s) => getNectaGrade(s).points).sort((a, b) => a - b);
  const best7Points = pointsList.slice(0, 7);
  // Pad if fewer than 7 subjects with 5 (Grade F)
  while (best7Points.length < 7) {
    best7Points.push(5);
  }
  const nectaPoints = best7Points.reduce((a, b) => a + b, 0);

  let nectaDivision: NectaDivision = 'Division 0';
  if (nectaPoints <= 17) {
    nectaDivision = 'Division I';
  } else if (nectaPoints <= 21) {
    nectaDivision = 'Division II';
  } else if (nectaPoints <= 25) {
    nectaDivision = 'Division III';
  } else if (nectaPoints <= 33) {
    nectaDivision = 'Division IV';
  } else {
    nectaDivision = 'Division 0';
  }

  // GPA calculation based on Tanzanian NECTA standard:
  // In NECTA Secondary O-level, school/student GPA is computed as weighted average of points (1.0 to 5.0 where 1.0 is highest):
  // Conventional 4.0 academic scale: A=4, B=3, C=2, D=1, F=0
  let gpa = 0;
  if (institutionType === 'primary') {
    // Primary schools commonly evaluate on average percentage out of 100 or total marks out of 250/300
    gpa = average;
  } else if (institutionType === 'vocational_college') {
    // 4.0 GPA scale (A=4, B=3, C=2, D=1, F=0)
    const points4: number[] = scores.map((s) => (s >= 75 ? 4 : s >= 65 ? 3 : s >= 45 ? 2 : s >= 30 ? 1 : 0));
    gpa = Math.round((points4.reduce((a: number, b: number) => a + b, 0) / points4.length) * 100) / 100;
  } else {
    // NECTA Secondary (O-Level & A-Level):
    // GPA = sum of grade points / total subjects (official NECTA benchmark scale: 1.0 - 5.0)
    const pointsSum = scores.map((s) => getNectaGrade(s).points).reduce((a, b) => a + b, 0);
    gpa = Math.round((pointsSum / scores.length) * 100) / 100;
  }

  return {
    average,
    gpa,
    nectaGrade: gradeDetail.grade,
    nectaPoints,
    nectaDivision,
  };
}

/**
 * Calculates and assigns class position (1st, 2nd, 3rd, etc.) for each student
 * within their respective form/class level (or stream) based on average score.
 */
export function calculateClassPositions(students: Student[]): Student[] {
  // Group students by form level
  const formGroups: Record<string, Student[]> = {};
  students.forEach((s) => {
    const key = s.form || 'Unknown';
    if (!formGroups[key]) formGroups[key] = [];
    formGroups[key].push(s);
  });

  const updatedStudents: Student[] = [];

  Object.values(formGroups).forEach((cohort) => {
    // Sort descending by average, then by nectaPoints ascending (lower points = better)
    const sorted = [...cohort].sort((a, b) => {
      if (b.average !== a.average) return b.average - a.average;
      return (a.nectaPoints || 35) - (b.nectaPoints || 35);
    });

    const cohortSize = sorted.length;
    sorted.forEach((stu, idx) => {
      updatedStudents.push({
        ...stu,
        classPosition: idx + 1,
        cohortSize,
      });
    });
  });

  // Preserve original order or sorted order
  return updatedStudents;
}

export function formatTzs(amount: number): string {
  return 'TZS ' + Number(amount || 0).toLocaleString('en-US');
}

export function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Subject catalogues for various Tanzanian institutional types
 */
export function getInstitutionSubjects(type: InstitutionType): { code: string; name: string; category: string }[] {
  switch (type) {
    case 'primary':
      return [
        { code: '01', name: 'Hisabati', category: 'Core Science' },
        { code: '02', name: 'Kiingereza (English)', category: 'Languages' },
        { code: '03', name: 'Kiswahili', category: 'Languages' },
        { code: '04', name: 'Sayansi na Teknolojia', category: 'Core Science' },
        { code: '05', name: 'Maarifa ya Jamii', category: 'Core Arts' },
        { code: '06', name: 'Uraia na Maadili', category: 'Core Arts' },
      ];
    case 'secondary_alevel':
      return [
        { code: '111', name: 'General Studies', category: 'Core Arts' },
        { code: '112', name: 'Basic Applied Mathematics (BAM)', category: 'Core Science' },
        { code: '113', name: 'Advanced Mathematics', category: 'Core Science' },
        { code: '114', name: 'Physics', category: 'Core Science' },
        { code: '115', name: 'Chemistry', category: 'Core Science' },
        { code: '116', name: 'Biology', category: 'Core Science' },
        { code: '117', name: 'Geography', category: 'Core Arts' },
        { code: '118', name: 'History', category: 'Core Arts' },
        { code: '119', name: 'Economics', category: 'Commercial' },
      ];
    case 'vocational_college':
      return [
        { code: 'VT01', name: 'Technical Drawing / CAD', category: 'Practical' },
        { code: 'VT02', name: 'Trade Theory', category: 'Vocational' },
        { code: 'VT03', name: 'Workshop Practice', category: 'Practical' },
        { code: 'VT04', name: 'Engineering Science', category: 'Core Science' },
        { code: 'VT05', name: 'Applied Mathematics', category: 'Core Science' },
        { code: 'VT06', name: 'ICT & Computing', category: 'Practical' },
        { code: 'VT07', name: 'Entrepreneurship & Business', category: 'Commercial' },
        { code: 'VT08', name: 'Communication Skills', category: 'Languages' },
      ];
    case 'secondary_olevel':
    case 'secondary_combined':
    default:
      return [
        { code: '041', name: 'Basic Mathematics', category: 'Core Science' },
        { code: '022', name: 'English Language', category: 'Languages' },
        { code: '021', name: 'Kiswahili', category: 'Languages' },
        { code: '033', name: 'Biology', category: 'Core Science' },
        { code: '031', name: 'Physics', category: 'Core Science' },
        { code: '032', name: 'Chemistry', category: 'Core Science' },
        { code: '013', name: 'Geography', category: 'Core Arts' },
        { code: '012', name: 'History', category: 'Core Arts' },
        { code: '011', name: 'Civics', category: 'Core Arts' },
        { code: '061', name: 'Commerce', category: 'Commercial' },
        { code: '062', name: 'Bookkeeping', category: 'Commercial' },
        { code: '036', name: 'Computer Studies', category: 'Practical' },
      ];
  }
}

/**
 * Returns subjects according to the specific Form or Level
 */
export function getSubjectsForFormLevel(form: string): { code: string; name: string; category: string }[] {
  if (form.startsWith('Standard') || form.startsWith('Darasa')) {
    return getInstitutionSubjects('primary');
  }
  if (form.startsWith('Form V') || form.startsWith('Form VI') || form.startsWith('Kidato cha 5') || form.startsWith('Kidato cha 6')) {
    return getInstitutionSubjects('secondary_alevel');
  }
  if (form.startsWith('Year') || form.startsWith('Mwaka')) {
    return getInstitutionSubjects('vocational_college');
  }
  return getInstitutionSubjects('secondary_olevel');
}

/**
 * Generates an Excel-ready CSV template tailored to the institution type
 */
export function generateCsvTemplate(
  institutionType: InstitutionType,
  schoolName: string = 'Jitegemee Secondary School'
): string {
  const subjects = getInstitutionSubjects(institutionType);
  const subjectHeaders = subjects.map((s) => s.name);

  const baseHeaders = [
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
    'feeBalance',
    'attendance',
    ...subjectHeaders,
  ];

  // Sample row 1
  const row1 = [
    escapeCsvCell('TZ-2026-001'),
    escapeCsvCell('Baraka Juma Mrema'),
    escapeCsvCell('M'),
    escapeCsvCell(institutionType === 'primary' ? 'Standard VI' : institutionType === 'secondary_alevel' ? 'Form V' : 'Form IV'),
    escapeCsvCell('A'),
    escapeCsvCell(schoolName),
    escapeCsvCell('Dar es Salaam'),
    escapeCsvCell('Kinondoni'),
    escapeCsvCell('Term 1'),
    escapeCsvCell('2026'),
    escapeCsvCell('Juma Mrema'),
    formatCsvPhone('+255754123456'),
    formatCsvPhone('+255754123456'),
    escapeCsvCell('juma.mrema@gmail.com'),
    escapeCsvCell('Paid'),
    escapeCsvCell('0'),
    escapeCsvCell('98'),
    ...subjects.map(() => escapeCsvCell('78')),
  ];

  // Sample row 2
  const row2 = [
    escapeCsvCell('TZ-2026-002'),
    escapeCsvCell('Amina Said Mwakalukwa'),
    escapeCsvCell('F'),
    escapeCsvCell(institutionType === 'primary' ? 'Standard VI' : institutionType === 'secondary_alevel' ? 'Form V' : 'Form IV'),
    escapeCsvCell('A'),
    escapeCsvCell(schoolName),
    escapeCsvCell('Dar es Salaam'),
    escapeCsvCell('Kinondoni'),
    escapeCsvCell('Term 1'),
    escapeCsvCell('2026'),
    escapeCsvCell('Said Mwakalukwa'),
    formatCsvPhone('+255712987654'),
    formatCsvPhone('+255712987654'),
    escapeCsvCell('said.mwaka@yahoo.com'),
    escapeCsvCell('Partial'),
    escapeCsvCell('150000'),
    escapeCsvCell('92'),
    ...subjects.map(() => escapeCsvCell('85')),
  ];

  return [
    baseHeaders.map(escapeCsvCell).join(','),
    row1.join(','),
    row2.join(','),
  ].join('\n');
}

export const DICTIONARY = {
  en: {
    systemTitle: 'EDUSCORE TZ',
    systemTagline: 'National Analytical Portal',
    curriculumBanner: 'EduScore TZ Core v1.0 | Tanzanian National Curriculum Engine Active',
    academicYear: 'Academic Year: 2026',
    nectaAlignment: 'NECTA Framework Alignment',
    mainManagement: 'Main Management',
    stakeholderAccess: 'Stakeholder Access',
    navDashboard: 'National & School Board',
    navCurriculum: 'Curriculum Coverage',
    navStudents: 'Student Tracker Matrix',
    navAi: 'AI Insight & Support',
    navParent: 'Parent Real-Time Desk',
    navTeacher: 'Teacher Workspace',
    navDistrict: 'District Benchmarking',
    navReports: 'Reports Centre',
    navMessages: 'Parent Messaging',
    navData: 'Data Centre & CSV',
    navSettings: 'System Settings',
    standaloneExport: 'Standalone HTML',
    searchPlaceholder: 'Search student, school, parent, ID or phone...',
    exportCsvPdf: 'Export CSV / Data',
    totalEnrollment: 'Total Enrollment',
    schoolGpa: 'Current School GPA',
    syllabusCompletion: 'Syllabus Completion',
    projectedDiv1: 'Projected Division I',
    atRiskStudents: 'At-Risk Students',
    feeBalance: 'Outstanding Fees',
    printReport: 'Print Report',
    saveAssessment: 'Save Assessment',
    refresh: 'Refresh Dashboard',
  },
  sw: {
    systemTitle: 'EDUSCORE TZ',
    systemTagline: 'Tovuti ya Takwimu za Kitaifa',
    curriculumBanner: 'Mfumo wa EduScore TZ v1.0 | Mtaala wa Kitaifa wa Tanzania Unaendeshwa',
    academicYear: 'Mwaka wa Masomo: 2026',
    nectaAlignment: 'Mfumo Unaozingatia NECTA',
    mainManagement: 'Usimamizi Mkuu',
    stakeholderAccess: 'Mawasiliano na Wadau',
    navDashboard: 'Dashibodi ya Shule & NECTA',
    navCurriculum: 'Ufikiaji wa Mtaala',
    navStudents: 'Ufuatiliaji wa Wanafunzi',
    navAi: 'Uchambuzi & Ushauri wa AI',
    navParent: 'Lango la Wazazi',
    navTeacher: 'Dawati la Mwalimu',
    navDistrict: 'Ulinganisho wa Wilaya',
    navReports: 'Kituo cha Ripoti',
    navMessages: 'Ujumbe kwa Wazazi',
    navData: 'Kituo cha Data & CSV',
    navSettings: 'Mipangilio ya Mfumo',
    standaloneExport: 'Pakua HTML',
    searchPlaceholder: 'Tafuta mwanafunzi, shule, mzazi, kitambulisho au simu...',
    exportCsvPdf: 'Pakua CSV / Data',
    totalEnrollment: 'Jumla ya Wanafunzi',
    schoolGpa: 'Wastani wa Shule (GPA)',
    syllabusCompletion: 'Utekelezaji wa Muhtasari',
    projectedDiv1: 'Makadirio ya Daraja la I',
    atRiskStudents: 'Wanafunzi Hatarini',
    feeBalance: 'Deni la Ada',
    printReport: 'Chapa Ripoti',
    saveAssessment: 'Hifadhi Tathmini',
    refresh: 'Sasisha Dashibodi',
  },
};

/**
 * Parses single CSV row respecting quoted strings and Excel formula quotes
 */
export function parseCsvLine(text: string): string[] {
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
}

/**
 * Sanitizes cell values exported by Excel (e.g. ="0712345678", ="TZS 500,000", """...")
 */
export function sanitizeCsvValue(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v !== 'string') return String(v);
  return v
    .replace(/^="*|"*$/g, '')
    .replace(/^"+|"+$/g, '')
    .replace(/""/g, '"')
    .trim();
}

/**
 * Universal CSV Parser for Tanzanian School Records
 * Supports any Form/Level (Primary, O-Level, A-Level, Vocational) and custom subjects.
 */
export function parseStudentCsv(
  csvText: string,
  sourceFileName: string = 'imported-records.csv'
): {
  students: Student[];
  detectedSubjects: string[];
  schoolNames: string[];
  totalRows: number;
} {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file is empty or missing data rows.');
  }

  const rawHeaders = parseCsvLine(lines[0]);
  const cleanHeaderMap = rawHeaders.map((h) => ({
    raw: h,
    clean: h.toLowerCase().replace(/[^a-z0-9]/g, ''),
  }));

  const standardAttrMap: Record<string, string> = {
    id: 'id',
    regno: 'id',
    admissionno: 'id',
    namba: 'id',
    studentno: 'id',
    name: 'name',
    studentname: 'name',
    jina: 'name',
    candidate: 'name',
    gender: 'gender',
    jinsia: 'gender',
    sex: 'gender',
    form: 'form',
    class: 'form',
    level: 'form',
    darasa: 'form',
    kidato: 'form',
    stream: 'stream',
    mkondo: 'stream',
    section: 'stream',
    school: 'school',
    shule: 'school',
    institution: 'school',
    region: 'region',
    mkoa: 'region',
    district: 'district',
    wilaya: 'district',
    term: 'term',
    muhula: 'term',
    year: 'year',
    mwaka: 'year',
    parent: 'parent',
    mzazi: 'parent',
    mlezi: 'parent',
    guardian: 'parent',
    phone: 'phone',
    simu: 'phone',
    nambayasimu: 'phone',
    mobile: 'phone',
    whatsapp: 'whatsapp',
    wasap: 'whatsapp',
    email: 'email',
    baruapepe: 'email',
    feestatus: 'feeStatus',
    haliyaada: 'feeStatus',
    feebalance: 'feeBalance',
    salio: 'feeBalance',
    denilaada: 'feeBalance',
    attendance: 'attendance',
    mahudhurio: 'attendance',
    notes: 'notes',
    maoni: 'notes',
    teacherrecommendation: 'teacherRecommendation',
    headteachercomment: 'headteacherComment',
  };

  const coreSubjectMap: Record<string, keyof Student> = {
    mathematics: 'mathematics',
    math: 'mathematics',
    basicmathematics: 'mathematics',
    hisabati: 'mathematics',
    appliedmath: 'mathematics',
    english: 'english',
    englishlanguage: 'english',
    kiingereza: 'english',
    kiswahili: 'kiswahili',
    swahili: 'kiswahili',
    science: 'science',
    sayansi: 'science',
    generalscience: 'science',
    biology: 'science',
    physics: 'physics',
    fizikia: 'physics',
    chemistry: 'chemistry',
    kemia: 'chemistry',
    geography: 'geography',
    jiografia: 'geography',
    history: 'history',
    historia: 'history',
  };

  const detectedSubjects: string[] = [];
  const schoolNamesSet = new Set<string>();

  const parsedStudents: Student[] = lines.slice(1).map((line, idx) => {
    const values = parseCsvLine(line);
    const studentObj: any = {
      customSubjects: {} as Record<string, number>,
    };

    cleanHeaderMap.forEach((col, cIdx) => {
      const rawVal = values[cIdx] !== undefined ? values[cIdx] : '';
      const cleanVal = sanitizeCsvValue(rawVal);

      if (standardAttrMap[col.clean]) {
        const field = standardAttrMap[col.clean];
        studentObj[field] = cleanVal;
      } else if (coreSubjectMap[col.clean]) {
        const subjField = coreSubjectMap[col.clean];
        const numVal = parseFloat(cleanVal.replace(/[^0-9.]/g, ''));
        studentObj[subjField] = isNaN(numVal) ? 0 : numVal;
        if (!detectedSubjects.includes(col.raw)) detectedSubjects.push(col.raw);
      } else if (
        ![
          'average',
          'gpa',
          'nectadivision',
          'nectapoints',
          'rank',
          'classposition',
          'cohortsize',
          'feebalanceformatted',
          'phoneformatted',
        ].includes(col.clean)
      ) {
        // Variable / customized subject for this school
        const numVal = parseFloat(cleanVal.replace(/[^0-9.]/g, ''));
        if (!isNaN(numVal) && cleanVal !== '') {
          studentObj.customSubjects[col.raw] = numVal;
          if (!detectedSubjects.includes(col.raw)) detectedSubjects.push(col.raw);
        } else {
          studentObj[col.raw] = cleanVal;
        }
      }
    });

    const formVal = studentObj.form || 'Form IV';
    const institutionTypeGuess: InstitutionType = formVal.startsWith('Standard') || formVal.startsWith('Darasa')
      ? 'primary'
      : formVal.startsWith('Form V') || formVal.startsWith('Form VI')
      ? 'secondary_alevel'
      : formVal.startsWith('Year')
      ? 'vocational_college'
      : 'secondary_olevel';

    const schoolName = studentObj.school || 'Jitegemee Secondary School';
    schoolNamesSet.add(schoolName);

    // Clean numeric fee balance (strip TZS, commas)
    let parsedFeeBalance = 0;
    if (studentObj.feeBalance) {
      const cleanFee = String(studentObj.feeBalance).replace(/[^0-9.-]/g, '');
      parsedFeeBalance = parseFloat(cleanFee) || 0;
    }

    const studentRecord: Student = {
      id: studentObj.id || `TZ-IMP-${Date.now().toString().slice(-4)}-${idx + 1}`,
      name: studentObj.name || `Candidate ${idx + 1}`,
      gender:
        studentObj.gender?.toUpperCase() === 'F' ||
        studentObj.gender?.toLowerCase() === 'female' ||
        studentObj.gender?.toLowerCase() === 'kike'
          ? 'F'
          : 'M',
      form: formVal,
      stream: studentObj.stream || 'A',
      school: schoolName,
      region: studentObj.region || 'Dar es Salaam',
      district: studentObj.district || 'Kinondoni',
      term: studentObj.term || 'Term 1',
      year: studentObj.year || '2026',
      parent: studentObj.parent || 'Parent/Guardian',
      phone: studentObj.phone || '+255700000000',
      whatsapp: studentObj.whatsapp || studentObj.phone || '+255700000000',
      email: studentObj.email || 'parent@example.com',
      feeStatus: studentObj.feeStatus || (parsedFeeBalance > 0 ? 'Partial' : 'Paid'),
      feeBalance: parsedFeeBalance,
      discipline: studentObj.discipline || 'Good',
      healthSupport: studentObj.healthSupport || 'None recorded',
      attendance: parseFloat(String(studentObj.attendance).replace(/[^0-9.]/g, '')) || 92,
      mathematics: studentObj.mathematics ?? 55,
      math_teacher: 'M. Mwakalinga',
      english: studentObj.english ?? 60,
      english_teacher: 'S. Mtei',
      kiswahili: studentObj.kiswahili ?? 65,
      kis_teacher: 'R. Joseph',
      science: studentObj.science ?? 60,
      science_teacher: 'P. Mushi',
      physics: studentObj.physics,
      chemistry: studentObj.chemistry,
      geography: studentObj.geography,
      history: studentObj.history,
      customSubjects: studentObj.customSubjects,
      average: 0,
      nectaGrade: 'B',
      nectaPoints: 18,
      nectaDivision: 'Division II',
      notes: studentObj.notes || `Imported record from ${sourceFileName}.`,
      teacherRecommendation: studentObj.teacherRecommendation || '',
      headteacherComment: studentObj.headteacherComment || '',
      avatarColor: 'bg-teal-700',
    };

    const metrics = calculateStudentNectaMetrics(studentRecord, institutionTypeGuess);
    studentRecord.average = metrics.average;
    studentRecord.gpa = metrics.gpa;
    studentRecord.nectaGrade = metrics.nectaGrade;
    studentRecord.nectaPoints = metrics.nectaPoints;
    studentRecord.nectaDivision = metrics.nectaDivision;

    return studentRecord;
  });

  const rankedStudents = calculateClassPositions(parsedStudents);

  return {
    students: rankedStudents,
    detectedSubjects,
    schoolNames: Array.from(schoolNamesSet),
    totalRows: rankedStudents.length,
  };
}

