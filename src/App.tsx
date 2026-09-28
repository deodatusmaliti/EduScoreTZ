import React, { useState, useEffect } from 'react';
import {
  ViewTab,
  Student,
  CurriculumSubject,
  TeacherMark,
  AppSettings,
  DifferentiatedStudent,
  PaymentRecord,
  HistoricalExamResult,
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

import { ShieldAlert, Lock, ShieldCheck } from 'lucide-react';

// In-Built Independent Backend Client & Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { backendApi } from './services/backendApi';

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
import { BackendControlRoom } from './components/BackendControlRoom';
import { AuthModal } from './components/AuthModal';
import { AnnouncementsModal } from './components/AnnouncementsModal';

function MainAppContent() {
  const { user, profile, isAdmin, canAccessControlRoom, setDemoUser, userRole } = useAuth();

  // Navigation & UI State
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('TZ-2023-CSEE-0941');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState<boolean>(false);

  // Core Persisted Datasets (with Optimistic Local Cache + In-Built Backend Real-Time Sync)
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

  // Sync to local storage for instant offline availability
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

  // Initial load from in-built backend on boot
  useEffect(() => {
    const loadInitialServerData = async () => {
      try {
        const [serverStudents, serverCurriculum, serverMarks, serverPayments] = await Promise.allSettled([
          backendApi.getCollection<Student>('students'),
          backendApi.getCollection<CurriculumSubject>('curriculum'),
          backendApi.getCollection<TeacherMark>('teacherMarks'),
          backendApi.getCollection<PaymentRecord>('payments'),
        ]);

        if (serverStudents.status === 'fulfilled' && serverStudents.value && serverStudents.value.length > 0) {
          setStudents(calculateClassPositions(serverStudents.value));
        } else {
          // Seed in-built backend with initial data if empty
          backendApi.batchImport('students', students).catch(() => {});
        }

        if (serverCurriculum.status === 'fulfilled' && serverCurriculum.value && serverCurriculum.value.length > 0) {
          setCurriculum(serverCurriculum.value);
        } else {
          backendApi.batchImport('curriculum', curriculum).catch(() => {});
        }

        if (serverMarks.status === 'fulfilled' && serverMarks.value && serverMarks.value.length > 0) {
          setTeacherMarks(serverMarks.value);
        } else {
          backendApi.batchImport('teacherMarks', teacherMarks).catch(() => {});
        }

        if (serverPayments.status === 'fulfilled' && serverPayments.value && serverPayments.value.length > 0) {
          setPayments(serverPayments.value);
        } else {
          backendApi.batchImport('payments', payments).catch(() => {});
        }
      } catch (err) {
        console.warn('[App] In-built backend initial sync note:', err);
      }
    };

    loadInitialServerData();
  }, []);

  // Real-time In-Built Server-Sent Events (SSE) Cross-Browser / Multi-Device Synchronization
  useEffect(() => {
    const unsubscribe = backendApi.subscribe((event, payload) => {
      if (event === 'doc_change') {
        const { collection, action, doc, id } = payload;
        if (collection === 'students') {
          setStudents((prev) => {
            if (action === 'DELETE') {
              return prev.filter((s) => s.id !== id);
            }
            const exists = prev.some((s) => s.id === doc.id);
            const nextList = exists ? prev.map((s) => (s.id === doc.id ? doc : s)) : [doc, ...prev];
            return calculateClassPositions(nextList);
          });
        } else if (collection === 'teacherMarks') {
          setTeacherMarks((prev) => {
            if (action === 'DELETE') return prev.filter((m) => m.id !== id);
            const exists = prev.some((m) => m.id === doc.id);
            return exists ? prev.map((m) => (m.id === doc.id ? doc : m)) : [doc, ...prev];
          });
        } else if (collection === 'payments') {
          setPayments((prev) => {
            if (action === 'DELETE') return prev.filter((p) => p.id !== id);
            const exists = prev.some((p) => p.id === doc.id);
            return exists ? prev.map((p) => (p.id === doc.id ? doc : p)) : [doc, ...prev];
          });
        }
      } else if (event === 'batch_sync' || event === 'deduplicate_sync') {
        if (payload.collection === 'students' || !payload.collection) {
          backendApi.getCollection<Student>('students').then((d) => {
            if (Array.isArray(d)) setStudents(calculateClassPositions(d));
          });
        }
        if (payload.collection === 'curriculum' || !payload.collection) {
          backendApi.getCollection<CurriculumSubject>('curriculum').then((d) => {
            if (Array.isArray(d)) setCurriculum(d);
          });
        }
        if (payload.collection === 'teacherMarks' || !payload.collection) {
          backendApi.getCollection<TeacherMark>('teacherMarks').then((d) => {
            if (Array.isArray(d)) setTeacherMarks(d);
          });
        }
        if (payload.collection === 'payments' || !payload.collection) {
          backendApi.getCollection<PaymentRecord>('payments').then((d) => {
            if (Array.isArray(d)) setPayments(d);
          });
        }
      }
    });

    const handleLocalReload = () => {
      try {
        const s = localStorage.getItem('eduscore_tz_students');
        if (s) setStudents(calculateClassPositions(JSON.parse(s)));
        const c = localStorage.getItem('eduscore_tz_curriculum');
        if (c) setCurriculum(JSON.parse(c));
        const m = localStorage.getItem('eduscore_tz_teacher_marks');
        if (m) setTeacherMarks(JSON.parse(m));
        const p = localStorage.getItem('eduscore_tz_payments');
        if (p) setPayments(JSON.parse(p));
        const set = localStorage.getItem('eduscore_tz_settings');
        if (set) setSettings(JSON.parse(set));
      } catch (e) {
        console.warn('[App] Local reload event parse note:', e);
      }
    };
    window.addEventListener('eduscore_local_reload', handleLocalReload);

    return () => {
      unsubscribe();
      window.removeEventListener('eduscore_local_reload', handleLocalReload);
    };
  }, []);

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

  // Student CRUD with immediate in-built backend persistence
  const handleAddStudent = (newStudent: Student) => {
    const updated = calculateClassPositions([newStudent, ...students]);
    setStudents(updated);
    backendApi.saveDocument('students', newStudent.id, newStudent).catch((err) =>
      console.warn('Backend persistence notice:', err)
    );
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
    let updatedTargetStudent: Student | undefined;

    setStudents((prev) =>
      prev.map((stu) => {
        if (stu.id === studentId) {
          const newBalance = Math.max(0, stu.feeBalance - amount);
          const updatedStu = {
            ...stu,
            feeBalance: newBalance,
            feeStatus: (newBalance === 0 ? 'Cleared' : 'Partial') as any,
          };
          updatedTargetStudent = updatedStu;
          return updatedStu;
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

    // Push to in-built backend
    backendApi.saveDocument('payments', newRecord.id, newRecord).catch((e) => console.warn('Payment backend sync notice:', e));
    if (updatedTargetStudent) {
      backendApi.saveDocument('students', (updatedTargetStudent as Student).id, updatedTargetStudent).catch((e) =>
        console.warn('Student balance backend sync notice:', e)
      );
    }
  };

  // Teacher Mark Entry with real-time in-built backend write
  const handleSaveTeacherMark = (
    studentId: string,
    subject: string,
    teacher: string,
    score: number,
    note: string
  ) => {
    let modifiedStudent: Student | undefined;

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
          const fullUpdated = {
            ...updatedStu,
            ...metrics,
          };
          modifiedStudent = fullUpdated;
          return fullUpdated;
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

    // Push mark & student metrics to in-built backend
    backendApi.saveDocument('teacherMarks', newEntry.id, newEntry).catch((e) => console.warn('Mark backend sync notice:', e));
    if (modifiedStudent) {
      backendApi.saveDocument('students', (modifiedStudent as Student).id, modifiedStudent).catch((e) =>
        console.warn('Student backend sync notice:', e)
      );
    }
  };

  const handleImportStudents = (importedList: Student[]) => {
    const positioned = calculateClassPositions(importedList);
    setStudents(positioned);
    backendApi.batchImport('students', positioned).catch((e) =>
      console.warn('Batch backend sync notice:', e)
    );
  };

  const handleRestoreDemo = () => {
    if (
      window.confirm(
        'Are you sure you want to restore the default Tanzanian national school dataset?'
      )
    ) {
      const initStudents = getInitialStudents();
      setStudents(initStudents);
      setCurriculum(INITIAL_CURRICULUM_SUBJECTS);
      setTeacherMarks(INITIAL_TEACHER_MARKS);
      setSettings(DEFAULT_SETTINGS);
      setDifferentiatedList(INITIAL_DIFFERENTIATED_STUDENTS);
      localStorage.clear();
      backendApi.batchImport('students', initStudents, 'replace').catch(() => {});
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
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenBackendTab={() => setCurrentTab('backend')}
        onOpenAnnouncements={() => setIsAnnouncementsOpen(true)}
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
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenAnnouncements={() => setIsAnnouncementsOpen(true)}
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
            onOpenAnnouncements={() => setIsAnnouncementsOpen(true)}
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

            {currentTab === 'backend' && (
              isAdmin ? (
                <BackendControlRoom
                  language={language}
                  onOpenAnnouncements={() => setIsAnnouncementsOpen(true)}
                />
              ) : (
                <div className="max-w-3xl mx-auto my-8 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1 mb-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{language === 'sw' ? 'Mamlaka ya Msimamizi Inahitajika' : 'Admin Authority Required'}</span>
                        </span>
                        <h2 className="text-lg sm:text-xl font-bold font-serif text-white">
                          {language === 'sw' ? 'Chumba cha Udhibiti wa Backend Kimezuiwa' : 'Backend Control Room Access Restricted'}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 text-amber-900 text-xs leading-relaxed">
                      <p className="font-bold text-sm mb-1 text-amber-950">
                        {language === 'sw' ? 'Ufikiaji Umezuiwa kwa Wadhifa Huu' : 'Restricted Administrative Clearance'}
                      </p>
                      <p>
                        {language === 'sw'
                          ? 'Chumba cha Udhibiti wa Backend kinashikilia mamlaka kuu ya hifadhidata ya wingu (1TB Scale), usawazishaji wa moja kwa moja wa vivinjari vyote, kumbukumbu za usalama na marekebisho ya migogoro ya data. Eneo hili limetengwa kwa watumiaji wenye wadhifa wa Msimamizi Mkuu (Admin) pekee.'
                          : 'The Backend Control Room holds master cloud database authority (1TB Scale), instant multi-device event dispatch, cryptographic security audit logs, user role assignment, and data conflict resolution. This zone is strictly restricted to the System Administrator (Admin) role.'}
                      </p>
                    </div>

                    {/* Current Active Account Profile Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {language === 'sw' ? 'Kipindi Chako cha Sasa:' : 'Your Current Session:'}
                        </span>
                        <div className="font-bold text-slate-900 text-sm mt-0.5">{profile?.displayName || user?.displayName || 'Active User'}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{profile?.email || user?.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium text-[11px]">{language === 'sw' ? 'Wadhifa:' : 'Current Role:'}</span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-200 text-slate-800 border border-slate-300">
                          {profile?.role || user?.role || userRole}
                        </span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentTab('dashboard')}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                      >
                        {language === 'sw' ? '← Rudi kwenye Dashibodi' : '← Return to Dashboard'}
                      </button>

                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setDemoUser('admin');
                          }}
                          className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{language === 'sw' ? 'Washa Wadhifa wa Admin' : 'Switch to Administrator Role'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAuthModalOpen(true)}
                          className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <span>{language === 'sw' ? 'Ingia Kama Admin' : 'Sign In as Admin'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSaveSettings={(newSettings) => {
                  setSettings(newSettings);
                  backendApi.saveDocument('settings', 'global_school_config', newSettings).catch((e) =>
                    console.warn('Settings backend sync notice:', e)
                  );
                }}
                language={language}
              />
            )}
          </main>

          {/* Institutional Footer */}
          <footer className="mt-auto border-t border-gray-200 bg-white px-6 py-4 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">EduScore TZ</span>
              <span>•</span>
              <span>Independent In-Built Server Cloud Engine (1TB Scale)</span>
              <span>•</span>
              <button
                onClick={() => setCurrentTab('backend')}
                className="text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
              >
                Backend Control Room
              </button>
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        language={language}
      />

      {/* Announcements Broadcast & Directives Suite Modal */}
      <AnnouncementsModal
        isOpen={isAnnouncementsOpen}
        onClose={() => setIsAnnouncementsOpen(false)}
        language={language}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
