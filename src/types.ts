export type FormLevel =
  | 'Standard I'
  | 'Standard II'
  | 'Standard III'
  | 'Standard IV'
  | 'Standard V'
  | 'Standard VI'
  | 'Standard VII'
  | 'Form I'
  | 'Form II'
  | 'Form III'
  | 'Form IV'
  | 'Form V'
  | 'Form VI'
  | 'Year 1'
  | 'Year 2'
  | 'Year 3';

export type InstitutionType =
  | 'secondary_olevel'
  | 'secondary_alevel'
  | 'secondary_combined'
  | 'primary'
  | 'vocational_college';

export type TermType = 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4';
export type StreamType = 'A' | 'B' | 'C' | 'Alpha' | 'Beta' | 'Science' | 'Arts' | 'Technical' | 'Commercial';
export type FeeStatus = 'Paid' | 'Partial' | 'Outstanding' | 'Scholarship' | 'Cleared';
export type DisciplineStatus = 'Good' | 'Satisfactory' | 'Monitoring' | 'Intervention';
export type NectaDivision = 'Division I' | 'Division II' | 'Division III' | 'Division IV' | 'Division 0';

export interface Student {
  id: string;
  name: string;
  gender?: 'M' | 'F';
  form: FormLevel;
  stream: StreamType;
  school: string;
  region: string;
  district: string;
  term: TermType | string;
  year: string;
  parent: string;
  phone: string;
  whatsapp: string;
  email: string;
  feeStatus: FeeStatus;
  feeBalance: number;
  discipline: DisciplineStatus;
  healthSupport: string;
  attendance: number; // percentage 0-100
  // Core Academic scores (0-100)
  mathematics: number;
  math_teacher?: string;
  english: number;
  english_teacher?: string;
  kiswahili: number;
  kis_teacher?: string;
  science: number; // General science or Biology
  science_teacher?: string;
  physics?: number;
  physics_teacher?: string;
  chemistry?: number;
  chemistry_teacher?: string;
  geography?: number;
  geo_teacher?: string;
  history?: number;
  hist_teacher?: string;
  // Dynamic custom subjects map for arbitrary school curricula
  customSubjects?: Record<string, number>;
  // Calculated metrics
  average: number;
  gpa?: number;
  classPosition?: number;
  cohortSize?: number;
  nectaGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  nectaPoints: number; // best subjects points sum
  nectaDivision: NectaDivision;
  notes: string;
  teacherRecommendation?: string;
  headteacherComment?: string;
  avatarColor?: string;
}

export interface CurriculumSubject {
  id: string;
  code: string;
  name: string;
  syllabusCategory: 'Core Science' | 'Core Arts' | 'Languages' | 'Commercial' | 'Practical' | 'Primary Core' | 'Vocational';
  formLevels: string;
  assignedTeachers: string[];
  coveredPct: number;
  targetPct: number;
  practicalLabs: number;
  behindDays: number;
  isBottleneck: boolean;
  bottleneckReason?: string;
  remedialAction?: string;
}

export interface TeacherMark {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  teacher: string;
  score: number;
  term: TermType | string;
  note: string;
  timestamp: string;
}

export interface DistrictBenchmark {
  rank: number;
  school: string;
  region: string;
  district: string;
  students: number;
  gpa: number;
  averageScore: number;
  passRate: number;
  divisionOneRate: number;
  riskLevel: 'Low' | 'Monitor' | 'Support';
}

export interface HistoricalExamResult {
  year: string;
  examType: 'CSEE' | 'ACSEE' | 'PSLE' | 'VETA';
  candidates: number;
  nationalRank: number;
  totalNationalSchools?: number;
  totalSchoolsNationally?: number;
  regionalRank: number;
  totalRegionalSchools?: number;
  passRate: number;
  schoolGpa?: number;
  gpa?: number;
  div1Pct?: number;
  divisionOnePct?: number;
  div2Pct?: number;
  div3Pct?: number;
  div4Pct?: number;
  div0Pct?: number;
  distinctionCount?: number;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  schoolName?: string;
  amount: number;
  currency: 'TZS' | 'USD' | 'EUR' | 'GBP';
  exchangeRateToTzs?: number;
  paymentMethod: string;
  controlNumber: string;
  reference?: string;
  transactionReference?: string;
  timestamp: string;
  status: 'Completed' | 'Pending';
  payerName?: string;
  phone?: string;
  purpose?: string;
  term?: string;
}

export interface DifferentiatedStudent {
  id: string;
  name: string;
  form: FormLevel;
  challenge: string;
  supportPlan: string;
  statusBadge: string;
  statusColor: 'emerald' | 'amber' | 'blue' | 'purple';
}

export interface AppSettings {
  schoolName: string;
  institutionType: InstitutionType;
  region: string;
  district: string;
  academicYear: string;
  activeTerm: TermType | string;
  language: 'en' | 'sw';
  headteacherName: string;
  schoolMotto: string;
  autoSmsAlerts: boolean;
  configuredSubjects?: string[];
}

export type ViewTab =
  | 'dashboard'
  | 'curriculum'
  | 'students'
  | 'recommendations'
  | 'parentPortal'
  | 'teacher'
  | 'district'
  | 'reports'
  | 'messages'
  | 'data'
  | 'settings';
