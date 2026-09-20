import React, { useState, useEffect } from 'react';
import {
  ViewTab,
  Student,
  CurriculumSubject,
  TeacherMark,
  AppSettings,
  DifferentiatedStudent,
  PaymentRecord,
  HistoricalExamResult
} from './types';
import {
  getInitialStudents,
  INITIAL_CURRICULUM_SUBJECTS,
  INITIAL_DISTRICT_BENCHMARKS,
  INITIAL_TEACHER_MARKS,
  INITIAL_DIFFERENTIATED_STUDENTS,
  DEFAULT_SETTINGS,
  INITIAL_PAYMENT_RECORDS,
  INITIAL_HISTORICAL_EXAMS,
} from './data/initialData';
import { calculateStudentNectaMetrics, calculateClassPositions } from './utils/necta';

// Components
import { TopBanner } from './components/TopBanner';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CurriculumView } from './components/CurriculumView';
import { StudentsView } from './components/StudentsView';
import { TeacherView } from './components/TeacherView';
import { AiInsightView } from './components/AiInsightView';
import { ParentPortalView } from './components/ParentPortalView';
import { DistrictView } from './components/DistrictView';
import { ReportsView } from './components/ReportsView';
import { MessagesView } from './components/MessagesView';
import { DataCentreView } from './components/DataCentreView';
import { SettingsView } from './components/SettingsView';

export default function App() {
  // Navigation & UI State
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('TZ-2023-CSEE-0941');

  // Core Persisted Datasets
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('eduscore_tz_students');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored students:', e);
      }
    }
    return getInitialStudents();
  });

  const [curriculum, setCurriculum] = useState<CurriculumSubject[]>(() => {
    const saved = localStorage.getItem('eduscore_tz_curriculum');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored curriculum:', e);
      }
    }
    return INITIAL_CURRICULUM_SUBJECTS;
  });

  const [teacherMarks, setTeacherMarks] = useState<TeacherMark[]>(() => {
    const saved = localStorage.getItem('eduscore_tz_teacher_marks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored marks:', e);
      }
    }
    return INITIAL_TEACHER_MARKS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('eduscore_tz_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored settings:', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [differentiatedList, setDifferentiatedList] = useState<DifferentiatedStudent[]>(() => {
    const saved = localStorage.getItem('eduscore_tz_differentiated');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored differentiated:', e);
      }
    }
    return INITIAL_DIFFERENTIATED_STUDENTS;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('eduscore_tz_payments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored payments:', e);
      }
    }
    return INITIAL_PAYMENT_RECORDS;
  });

  const [historicalExams] = useState<HistoricalExamResult[]>(INITIAL_HISTORICAL_EXAMS);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('eduscore_tz_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('eduscore_tz_curriculum', JSON.stringify(curriculum));
  }, [curriculum]);

  useEffect(() => {
    localStorage.setItem('eduscore_tz_teacher_marks', JSON.stringify(teacherMarks));
  }, [teacherMarks]);

  useEffect(() => {
    localStorage.setItem('eduscore_tz_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('eduscore_tz_differentiated', JSON.stringify(differentiatedList));
  }, [differentiatedList]);

  useEffect(() => {
    localStorage.setItem('eduscore_tz_payments', JSON.stringify(payments));
  }, [payments]);

  // Handlers
  const handleLanguageToggle = () => {
    setLanguage((prev) => (prev === 'en' ? 'sw' : 'en'));
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      // safe fallback
    }
  };

  const handleOpenStandaloneHtml = () => {
    window.open('/eduscore-tz-standalone.html', '_blank');
  };

  // Student CRUD
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => calculateClassPositions([newStudent, ...prev]));
  };

  const handlePaymentSuccess = (
    studentId: string,
    amount: number,
    method: string,
    reference: string,
    term?: string,
    purpose?: string,
    schoolName?: string
  ) => {
    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.id === studentId) {
          const newBalance = Math.max(0, stu.feeBalance - amount);
          return {
            ...stu,
            feeBalance: newBalance,
            feeStatus: newBalance === 0 ? 'Cleared' : 'Partial',
          };
        }
        return stu;
      })
    );

    const targetStudent = students.find((s) => s.id === studentId);
    const newRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      studentId,
      studentName: targetStudent ? targetStudent.name : 'Unknown Student',
      schoolName: schoolName || targetStudent?.school || settings.schoolName,
      amount,
      currency: 'TZS',
      paymentMethod: method,
      transactionReference: reference,
      status: 'Completed',
      timestamp: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      term: term || targetStudent?.term || settings.activeTerm,
      purpose: purpose || `${term || settings.activeTerm} Tuition & School Fees`,
      controlNumber: `99${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    };

    setPayments((prev) => [newRecord, ...prev]);
  };

  // Teacher Mark Entry
  const handleSaveTeacherMark = (
    studentId: string,
    subject: string,
    teacher: string,
    score: number,
    note: string
  ) => {
    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.id === studentId) {
          const lowerSub = subject.toLowerCase();
          const updatedStu = { ...stu };

          if (lowerSub.includes('math')) updatedStu.mathematics = score;
          else if (lowerSub.includes('eng')) updatedStu.english = score;
          else if (lowerSub.includes('kis')) updatedStu.kiswahili = score;
          else if (lowerSub.includes('sci') || lowerSub.includes('bio')) updatedStu.science = score;
          else if (lowerSub.includes('phy')) updatedStu.physics = score;
          else if (lowerSub.includes('chem')) updatedStu.chemistry = score;
          else if (lowerSub.includes('geo')) updatedStu.geography = score;
          else if (lowerSub.includes('hist')) updatedStu.history = score;
          else {
            updatedStu.customSubjects = {
              ...(updatedStu.customSubjects || {}),
              [subject]: score,
            };
          }

          const metrics = calculateStudentNectaMetrics(updatedStu);
          return {
            ...updatedStu,
            ...metrics,
          };
        }
        return stu;
      })
    );

    const targetStudent = students.find((s) => s.id === studentId);
    const newEntry: TeacherMark = {
      id: `tm-${Date.now()}`,
      studentId,
      studentName: targetStudent ? targetStudent.name : 'Unknown Student',
      subject,
      teacher,
      score,
      note: note || 'Continuous assessment logged.',
      timestamp: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      term: settings.activeTerm,
    };

    setTeacherMarks((prev) => [newEntry, ...prev]);
  };

  const handleImportStudents = (importedList: Student[]) => {
    setStudents(importedList);
  };

  const handleRestoreDemo = () => {
    if (
      window.confirm(
        'Are you sure you want to restore the default Tanzanian national school dataset?'
      )
    ) {
      setStudents(getInitialStudents());
      setCurriculum(INITIAL_CURRICULUM_SUBJECTS);
      setTeacherMarks(INITIAL_TEACHER_MARKS);
      setSettings(DEFAULT_SETTINGS);
      setDifferentiatedList(INITIAL_DIFFERENTIATED_STUDENTS);
      localStorage.clear();
      alert('Default Tanzanian national datasets successfully restored.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-amber-500 selection:text-slate-950">
      {/* 1. Global NECTA Status Bar */}
      <TopBanner
        language={language}
        onToggleLanguage={handleLanguageToggle}
        onOpenStandalone={handleOpenStandaloneHtml}
      />

      {/* 2. Main Flex Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row relative">
        {/* Sidebar Drawer */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileOpen(false);
          }}
          mobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
          language={language}
          onExportStandalone={handleOpenStandaloneHtml}
          headteacherName={settings.headteacherName}
        />

        {/* Primary Analytical Stage */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Header Bar */}
          <Header
            currentTab={currentTab}
            onOpenMobileMenu={() => setIsMobileOpen((prev) => !prev)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            language={language}
            onPrint={handlePrint}
            onExportCsv={() => setCurrentTab('data')}
          />

          {/* View Container */}
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                students={students}
                language={language}
                onPrint={handlePrint}
                onRefresh={() => setStudents([...students])}
                onSelectStudentTab={() => setCurrentTab('students')}
              />
            )}

            {currentTab === 'curriculum' && (
              <CurriculumView
                subjects={curriculum}
                language={language}
              />
            )}

            {currentTab === 'students' && (
              <StudentsView
                students={students}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenMessageWithStudent={(stuId: string) => {
                  setSelectedStudentId(stuId);
                  setCurrentTab('messages');
                }}
                onOpenReportWithStudent={(stuId: string) => {
                  setSelectedStudentId(stuId);
                  setCurrentTab('reports');
                }}
                onAddStudent={handleAddStudent}
                onImportStudents={handleImportStudents}
                language={language}
              />
            )}

            {currentTab === 'teacher' && (
              <TeacherView
                students={students}
                teacherMarks={teacherMarks}
                onSaveMark={handleSaveTeacherMark}
                onPrint={handlePrint}
                language={language}
              />
            )}

            {currentTab === 'recommendations' && (
              <AiInsightView
                students={students}
                differentiatedList={differentiatedList}
                onUpdateDifferentiatedList={setDifferentiatedList}
                language={language}
              />
            )}

            {currentTab === 'parentPortal' && (
              <ParentPortalView
                students={students}
                initialStudentId={selectedStudentId}
                onPaymentSuccess={handlePaymentSuccess}
                language={language}
                schoolName={settings.schoolName}
                activeTerm={settings.activeTerm}
              />
            )}

            {currentTab === 'district' && (
              <DistrictView
                benchmarks={INITIAL_DISTRICT_BENCHMARKS}
                historicalExams={historicalExams}
                onPrint={handlePrint}
                language={language}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                students={students}
                settings={settings}
                initialStudentId={selectedStudentId}
                onPrint={handlePrint}
                language={language}
              />
            )}

            {currentTab === 'messages' && (
              <MessagesView
                students={students}
                initialStudentId={selectedStudentId}
                language={language}
              />
            )}

            {currentTab === 'data' && (
              <DataCentreView
                students={students}
                onImportStudents={handleImportStudents}
                onRestoreDemo={handleRestoreDemo}
                language={language}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSaveSettings={(newSettings) => setSettings(newSettings)}
                language={language}
              />
            )}
          </main>

          {/* Institutional Footer */}
          <footer className="mt-auto border-t border-gray-200 bg-white px-6 py-4 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">EduScore TZ</span>
              <span>•</span>
              <span>Tanzanian Academic Analytics & NECTA Prognostic Engine</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleOpenStandaloneHtml}
                className="text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
              >
                Launch Standalone HTML Version
              </button>
              <span>•</span>
              <span>Session: Term 1, 2026</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
