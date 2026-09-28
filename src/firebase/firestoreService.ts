import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  limit,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errors';
import {
  Student,
  CurriculumSubject,
  TeacherMark,
  PaymentRecord,
  AppSettings,
  DifferentiatedStudent,
} from '../types';

export interface CloudStats {
  studentCount: number;
  curriculumCount: number;
  marksCount: number;
  paymentsCount: number;
  auditLogsCount: number;
  estimatedStorageBytes: number;
  isLiveConnected: boolean;
  lastSyncTimestamp: string;
}

export interface CloudAuditLog {
  id: string;
  action: string;
  details: string;
  userEmail: string;
  timestamp: string;
  source: 'web' | 'mobile' | 'sync_engine';
}

// -------------------------------------------------------------
// Real-time Subscriptions with error wrapping
// -------------------------------------------------------------

export function subscribeToStudents(
  onData: (students: Student[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'students');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Student[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Student);
      });
      onData(list);
    },
    (error) => {
      console.warn('Students sync subscription listener info:', error.message);
      try {
        handleFirestoreError(error, OperationType.GET, 'students');
      } catch (wrapped) {
        if (onError) onError(wrapped as Error);
      }
    }
  );
}

export function subscribeToCurriculum(
  onData: (curriculum: CurriculumSubject[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'curriculum');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: CurriculumSubject[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CurriculumSubject);
      });
      onData(list);
    },
    (error) => {
      console.warn('Curriculum sync subscription listener info:', error.message);
      try {
        handleFirestoreError(error, OperationType.GET, 'curriculum');
      } catch (wrapped) {
        if (onError) onError(wrapped as Error);
      }
    }
  );
}

export function subscribeToTeacherMarks(
  onData: (marks: TeacherMark[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'teacherMarks');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: TeacherMark[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as TeacherMark);
      });
      onData(list);
    },
    (error) => {
      console.warn('Teacher marks sync subscription listener info:', error.message);
      try {
        handleFirestoreError(error, OperationType.GET, 'teacherMarks');
      } catch (wrapped) {
        if (onError) onError(wrapped as Error);
      }
    }
  );
}

export function subscribeToPayments(
  onData: (payments: PaymentRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'payments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: PaymentRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as PaymentRecord);
      });
      onData(list);
    },
    (error) => {
      console.warn('Payments sync subscription listener info:', error.message);
      try {
        handleFirestoreError(error, OperationType.GET, 'payments');
      } catch (wrapped) {
        if (onError) onError(wrapped as Error);
      }
    }
  );
}

export function subscribeToSettings(
  onData: (settings: AppSettings) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, 'settings', 'global_school_config');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as AppSettings);
      }
    },
    (error) => {
      console.warn('Settings sync subscription listener info:', error.message);
      try {
        handleFirestoreError(error, OperationType.GET, 'settings/global_school_config');
      } catch (wrapped) {
        if (onError) onError(wrapped as Error);
      }
    }
  );
}

export function subscribeToAuditLogs(
  onData: (logs: CloudAuditLog[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'auditLogs');
  const q = query(colRef, limit(50));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: CloudAuditLog[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CloudAuditLog);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onData(list);
    },
    (error) => {
      console.warn('Audit logs sync subscription listener info:', error.message);
    }
  );
}

// -------------------------------------------------------------
// Cloud Mutations
// -------------------------------------------------------------

export async function saveStudentToCloud(student: Student): Promise<void> {
  const docId = student.id || `TZ-${Date.now()}`;
  const docRef = doc(db, 'students', docId);
  try {
    const payload = {
      ...student,
      id: docId,
      ownerId: auth.currentUser?.uid || 'system',
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, payload, { merge: true });
    await logCloudAuditEvent('STUDENT_SAVE', `Saved student ${student.name} (${student.id})`, auth.currentUser?.email || 'authenticated_user');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `students/${docId}`);
  }
}

export async function deleteStudentFromCloud(studentId: string): Promise<void> {
  const docRef = doc(db, 'students', studentId);
  try {
    await deleteDoc(docRef);
    await logCloudAuditEvent('STUDENT_DELETE', `Deleted candidate record ID ${studentId}`, auth.currentUser?.email || 'authenticated_user');
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `students/${studentId}`);
  }
}

export async function saveMultipleStudentsToCloud(studentsList: Student[], onProgress?: (percent: number) => void): Promise<number> {
  let savedCount = 0;
  // Firestore batches support up to 500 writes per batch
  const BATCH_SIZE = 400;
  const total = studentsList.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const chunk = studentsList.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const stu of chunk) {
      const docId = stu.id || `TZ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const docRef = doc(db, 'students', docId);
      const payload = {
        ...stu,
        id: docId,
        ownerId: auth.currentUser?.uid || 'system',
        updatedAt: new Date().toISOString(),
      };
      batch.set(docRef, payload, { merge: true });
    }

    try {
      await batch.commit();
      savedCount += chunk.length;
      if (onProgress) {
        onProgress(Math.round((savedCount / total) * 100));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'students/batch_chunk');
    }
  }

  await logCloudAuditEvent(
    'BATCH_STUDENT_SYNC',
    `Synchronized ${savedCount} student records to cloud storage database`,
    auth.currentUser?.email || 'system'
  );

  return savedCount;
}

export async function saveCurriculumToCloud(curriculum: CurriculumSubject[]): Promise<void> {
  const batch = writeBatch(db);
  for (const subject of curriculum) {
    const docRef = doc(db, 'curriculum', subject.id);
    batch.set(docRef, {
      ...subject,
      ownerId: auth.currentUser?.uid || 'system',
    }, { merge: true });
  }
  try {
    await batch.commit();
    await logCloudAuditEvent('CURRICULUM_SYNC', `Updated ${curriculum.length} syllabus subjects in cloud`, auth.currentUser?.email || 'system');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'curriculum/batch');
  }
}

export async function saveTeacherMarkToCloud(mark: TeacherMark): Promise<void> {
  const docRef = doc(db, 'teacherMarks', mark.id);
  try {
    await setDoc(docRef, {
      ...mark,
      ownerId: auth.currentUser?.uid || 'teacher',
    }, { merge: true });
    await logCloudAuditEvent('MARK_ENTRY', `Logged score for ${mark.studentName} in ${mark.subject}: ${mark.score}%`, auth.currentUser?.email || 'teacher');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `teacherMarks/${mark.id}`);
  }
}

export async function savePaymentToCloud(payment: PaymentRecord): Promise<void> {
  const docRef = doc(db, 'payments', payment.id);
  try {
    await setDoc(docRef, {
      ...payment,
      ownerId: auth.currentUser?.uid || 'bursar',
    }, { merge: true });
    await logCloudAuditEvent('PAYMENT_RECORD', `Payment registered: TZS ${payment.amount.toLocaleString()} - Control ${payment.controlNumber}`, auth.currentUser?.email || 'bursar');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `payments/${payment.id}`);
  }
}

export async function saveSettingsToCloud(settings: AppSettings): Promise<void> {
  const docRef = doc(db, 'settings', 'global_school_config');
  try {
    await setDoc(docRef, {
      ...settings,
      ownerId: auth.currentUser?.uid || 'admin',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    await logCloudAuditEvent('SETTINGS_UPDATE', `School configuration updated: ${settings.schoolName}`, auth.currentUser?.email || 'admin');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/global_school_config');
  }
}

export async function logCloudAuditEvent(action: string, details: string, userEmail: string): Promise<void> {
  try {
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const docRef = doc(db, 'auditLogs', id);
    const log: CloudAuditLog = {
      id,
      action,
      details,
      userEmail,
      timestamp: new Date().toISOString(),
      source: 'web',
    };
    await setDoc(docRef, log);
  } catch (error) {
    console.warn('Could not write audit log to cloud:', error);
  }
}

// -------------------------------------------------------------
// Cloud Data Inspector & Diagnostics
// -------------------------------------------------------------

export async function fetchCloudCollectionStats(): Promise<CloudStats> {
  try {
    const [stuSnap, currSnap, marksSnap, paySnap, logsSnap] = await Promise.all([
      getDocs(collection(db, 'students')),
      getDocs(collection(db, 'curriculum')),
      getDocs(collection(db, 'teacherMarks')),
      getDocs(collection(db, 'payments')),
      getDocs(collection(db, 'auditLogs')),
    ]);

    const stuCount = stuSnap.size;
    const currCount = currSnap.size;
    const marksCount = marksSnap.size;
    const payCount = paySnap.size;
    const logsCount = logsSnap.size;

    // Estimate document size bytes (approx 1.2KB per student, 0.5KB per mark/curr)
    const estBytes = (stuCount * 1250) + (currCount * 600) + (marksCount * 450) + (payCount * 550) + (logsCount * 300);

    return {
      studentCount: stuCount,
      curriculumCount: currCount,
      marksCount: marksCount,
      paymentsCount: payCount,
      auditLogsCount: logsCount,
      estimatedStorageBytes: estBytes,
      isLiveConnected: true,
      lastSyncTimestamp: new Date().toLocaleTimeString(),
    };
  } catch (error) {
    console.warn('Cloud stats fetch warning:', error);
    return {
      studentCount: 0,
      curriculumCount: 0,
      marksCount: 0,
      paymentsCount: 0,
      auditLogsCount: 0,
      estimatedStorageBytes: 0,
      isLiveConnected: false,
      lastSyncTimestamp: 'Offline/Local Mode',
    };
  }
}

// -------------------------------------------------------------
// Duplicate Detection & Cleaning Engine
// -------------------------------------------------------------

export interface DuplicateReport {
  duplicateCount: number;
  duplicateGroups: {
    key: string;
    reason: string;
    students: Student[];
  }[];
  uniqueCount: number;
  cleanedStudents: Student[];
}

export function analyzeAndDeduplicateStudents(studentList: Student[]): DuplicateReport {
  const seenIds = new Map<string, Student>();
  const seenNameForm = new Map<string, Student[]>();
  const duplicateGroups: { key: string; reason: string; students: Student[] }[] = [];
  const uniqueStudents: Student[] = [];

  for (const stu of studentList) {
    const cleanId = (stu.id || '').trim().toUpperCase();
    const cleanName = (stu.name || '').trim().toLowerCase();
    const form = (stu.form || '').trim().toLowerCase();
    const nameKey = `${cleanName}__${form}`;

    if (cleanId && seenIds.has(cleanId)) {
      const existing = seenIds.get(cleanId)!;
      duplicateGroups.push({
        key: cleanId,
        reason: `Duplicate Candidate ID: ${cleanId}`,
        students: [existing, stu],
      });
      continue;
    }

    if (seenNameForm.has(nameKey)) {
      const group = seenNameForm.get(nameKey)!;
      group.push(stu);
      duplicateGroups.push({
        key: nameKey,
        reason: `Duplicate Name & Form: "${stu.name}" in ${stu.form}`,
        students: group,
      });
      continue;
    }

    if (cleanId) seenIds.set(cleanId, stu);
    seenNameForm.set(nameKey, [stu]);
    uniqueStudents.push(stu);
  }

  return {
    duplicateCount: studentList.length - uniqueStudents.length,
    duplicateGroups,
    uniqueCount: uniqueStudents.length,
    cleanedStudents: uniqueStudents,
  };
}
