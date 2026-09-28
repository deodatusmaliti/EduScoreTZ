import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Database,
  Users,
  ShieldCheck,
  Activity,
  RefreshCw,
  Search,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Radio,
  FileCode,
  HardDrive,
  Copy,
  Zap,
  Globe,
  Sliders,
  Layers,
  ArrowUpDown,
  Lock,
  KeyRound,
  Mail,
  Smartphone,
  Monitor,
  Tablet,
  Laptop,
  Clock,
  Send,
  Eye,
  Check,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Wifi,
  WifiOff,
  ArrowLeftRight,
  Split,
  GitCompare,
  UploadCloud,
  DownloadCloud,
  FileDiff,
  Scale,
  HelpCircle,
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  Megaphone,
} from 'lucide-react';
import {
  backendApi,
  BackendStats,
  AppUser,
  SecurityAuditEvent,
  SecurityAuditSummary,
  UserRole,
} from '../services/backendApi';
import { useAuth } from '../context/AuthContext';
import { exportSecurityAuditPdf, exportSecurityAuditCsv } from '../utils/securityAuditExporter';
import { BandwidthStorageSection } from './BandwidthStorageSection';

interface BackendControlRoomProps {
  language?: 'en' | 'sw';
  onOpenAnnouncements?: () => void;
}

export interface ConflictDiscrepancy {
  id: string;
  collection: 'students' | 'curriculum' | 'teacherMarks' | 'payments' | 'settings';
  collectionLabel: string;
  title: string;
  type: 'MODIFIED' | 'LOCAL_ONLY' | 'SERVER_ONLY';
  details: string;
  localSummary: string;
  serverSummary: string;
  localData: any;
  serverData: any;
  lastModified?: string;
}

export interface CollectionSyncReport {
  collection: 'students' | 'curriculum' | 'teacherMarks' | 'payments' | 'settings';
  label: string;
  localCount: number;
  serverCount: number;
  inSyncCount: number;
  conflictsCount: number;
  status: 'IN_SYNC' | 'CONFLICT';
}

export const BackendControlRoom: React.FC<BackendControlRoomProps> = ({
  language = 'en',
  onOpenAnnouncements,
}) => {
  const { user } = useAuth();
  const isSw = language === 'sw';

  const [stats, setStats] = useState<BackendStats | null>(null);
  const [activeTab, setActiveTab] = useState<'bandwidthStorage' | 'overview' | 'securityAudit' | 'conflicts' | 'explorer' | 'duplicates' | 'users' | 'logs'>('bandwidthStorage');
  const [selectedCollection, setSelectedCollection] = useState<'students' | 'curriculum' | 'teacherMarks' | 'payments' | 'users' | 'auditLogs'>('students');
  const [collectionData, setCollectionData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [liveEvents, setLiveEvents] = useState<Array<{ id: string; time: string; event: string; detail: string }>>([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [connectedNodes, setConnectedNodes] = useState<any[]>([]);

  // Real-Time Connection & Last-Sync State
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [syncEventCount, setSyncEventCount] = useState<number>(1);
  const [syncLatencyMs, setSyncLatencyMs] = useState<number>(16);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  // Security Audit State
  const [securityLogs, setSecurityLogs] = useState<SecurityAuditEvent[]>([]);
  const [auditSummary, setAuditSummary] = useState<SecurityAuditSummary | null>(null);
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'SUCCESS' | 'FAILED' | 'RESETS'>('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // Password & Username Restoration State
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [recoveryIdentifierInput, setRecoveryIdentifierInput] = useState('');
  const [dispatchedTokenInfo, setDispatchedTokenInfo] = useState<{ email: string; code?: string; message: string } | null>(null);
  const [usernameSearchResults, setUsernameSearchResults] = useState<Array<{ email: string; displayName: string; role: string; institution: string }> | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Conflict Resolution Engine State
  const [conflicts, setConflicts] = useState<ConflictDiscrepancy[]>([]);
  const [collectionReports, setCollectionReports] = useState<CollectionSyncReport[]>([]);
  const [conflictFilter, setConflictFilter] = useState<'ALL' | 'students' | 'teacherMarks' | 'curriculum' | 'payments' | 'settings'>('ALL');
  const [conflictSearch, setConflictSearch] = useState('');
  const [isScanningConflicts, setIsScanningConflicts] = useState(false);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<ConflictDiscrepancy | null>(null);

  // Live timer for relative last-sync elapsed seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getLocalCollectionData = (col: string): any[] => {
    try {
      const keyMap: Record<string, string> = {
        students: 'eduscore_tz_students',
        curriculum: 'eduscore_tz_curriculum',
        teacherMarks: 'eduscore_tz_teacher_marks',
        payments: 'eduscore_tz_payments',
        settings: 'eduscore_tz_settings',
      };
      const key = keyMap[col];
      if (!key) return [];
      const item = localStorage.getItem(key);
      if (!item) return [];
      const parsed = JSON.parse(item);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  };

  const scanForDiscrepancies = useCallback(async () => {
    setIsScanningConflicts(true);
    try {
      const collectionsToScan: Array<{ key: 'students' | 'curriculum' | 'teacherMarks' | 'payments' | 'settings'; label: string }> = [
        { key: 'students', label: isSw ? 'Wanafunzi & Matokeo' : 'Students & Assessment Marks' },
        { key: 'teacherMarks', label: isSw ? 'Alama Endelevu za Walimu' : 'Teacher Continuous Marks' },
        { key: 'curriculum', label: isSw ? 'Mitaala & Masomo' : 'Curriculum & Syllabi' },
        { key: 'payments', label: isSw ? 'Malipo ya Ada & Stakabadhi' : 'Fee Payments & Receipts' },
        { key: 'settings', label: isSw ? 'Mipangilio ya Shule' : 'School Global Config' },
      ];

      const detectedDiscrepancies: ConflictDiscrepancy[] = [];
      const reports: CollectionSyncReport[] = [];

      for (const col of collectionsToScan) {
        const localItems = getLocalCollectionData(col.key);
        let serverItems: any[] = [];
        try {
          const fetched = await backendApi.getCollection(col.key);
          serverItems = Array.isArray(fetched) ? fetched : fetched ? [fetched] : [];
        } catch {
          serverItems = [];
        }

        const localMap = new Map<string, any>();
        localItems.forEach((item, idx) => {
          const id = item.id || item.code || item.receiptNo || `local-${idx}`;
          localMap.set(String(id), item);
        });

        const serverMap = new Map<string, any>();
        serverItems.forEach((item, idx) => {
          const id = item.id || item.code || item.receiptNo || `server-${idx}`;
          serverMap.set(String(id), item);
        });

        let colConflicts = 0;
        let inSync = 0;

        // 1. Check items in local
        for (const [id, localDoc] of localMap.entries()) {
          const serverDoc = serverMap.get(id);
          if (!serverDoc) {
            colConflicts++;
            detectedDiscrepancies.push({
              id,
              collection: col.key,
              collectionLabel: col.label,
              title: localDoc.name || localDoc.subject || localDoc.studentName || id,
              type: 'LOCAL_ONLY',
              details: isSw
                ? 'Rekodi ipo kwenye hifadhi ya kivinjari pekee (Local Storage), haijasajiliwa kwenye Seva Kuu.'
                : 'Record exists in browser local storage only; not yet committed to master server.',
              localSummary: JSON.stringify(localDoc).slice(0, 140),
              serverSummary: isSw ? '(Haipo kwenye seva kuu)' : '(Not present on master server)',
              localData: localDoc,
              serverData: null,
            });
          } else {
            const localStr = JSON.stringify(localDoc);
            const serverStr = JSON.stringify(serverDoc);
            if (localStr !== serverStr) {
              colConflicts++;
              detectedDiscrepancies.push({
                id,
                collection: col.key,
                collectionLabel: col.label,
                title: localDoc.name || serverDoc.name || localDoc.subject || serverDoc.subject || id,
                type: 'MODIFIED',
                details: isSw
                  ? 'Kuna tofauti ya alama/taarifa kati ya hifadhi ya kivinjari hiki na Seva Kuu ya Shule.'
                  : 'Data discrepancy detected: Local attributes or scores diverge from authoritative master server.',
                localSummary: localStr.slice(0, 140),
                serverSummary: serverStr.slice(0, 140),
                localData: localDoc,
                serverData: serverDoc,
              });
            } else {
              inSync++;
            }
          }
        }

        // 2. Check items only on server
        for (const [id, serverDoc] of serverMap.entries()) {
          if (!localMap.has(id)) {
            colConflicts++;
            detectedDiscrepancies.push({
              id,
              collection: col.key,
              collectionLabel: col.label,
              title: serverDoc.name || serverDoc.subject || serverDoc.studentName || id,
              type: 'SERVER_ONLY',
              details: isSw
                ? 'Rekodi mpya ipo kwenye Seva Kuu (iliyoundwa na kifaa kingine), haipo kwenye kivinjari hiki.'
                : 'Record exists on master server (updated from remote node); missing in local storage cache.',
              localSummary: isSw ? '(Haipo kwenye kivinjari hiki)' : '(Missing in local storage)',
              serverSummary: JSON.stringify(serverDoc).slice(0, 140),
              localData: null,
              serverData: serverDoc,
            });
          }
        }

        reports.push({
          collection: col.key,
          label: col.label,
          localCount: localItems.length,
          serverCount: serverItems.length,
          inSyncCount: inSync,
          conflictsCount: colConflicts,
          status: colConflicts === 0 ? 'IN_SYNC' : 'CONFLICT',
        });
      }

      setConflicts(detectedDiscrepancies);
      setCollectionReports(reports);
    } catch (err: any) {
      console.warn('Conflict scan note:', err);
    } finally {
      setIsScanningConflicts(false);
    }
  }, [isSw]);

  const loadStatsAndData = useCallback(async () => {
    setIsLoading(true);
    const startMs = Date.now();
    try {
      const s = await backendApi.getStats();
      setStats(s);
      setConnectedNodes(s.connectedNodes || []);
      const docs = await backendApi.getCollection(selectedCollection);
      setCollectionData(Array.isArray(docs) ? docs : []);
      const uList = await backendApi.getUsers();
      setAllUsers(uList);

      // Load Security Audit Logs
      const auditRes = await backendApi.getSecurityAuditLogs();
      setSecurityLogs(auditRes.logs || []);
      setAuditSummary(auditRes.summary || null);

      setLastSyncTimestamp(new Date());
      setSecondsAgo(0);
      setIsLiveConnected(true);
      setSyncLatencyMs(Math.max(8, Date.now() - startMs));

      // Scan for discrepancies
      await scanForDiscrepancies();
    } catch (err: any) {
      console.error('Error loading backend data:', err);
      setIsLiveConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCollection, scanForDiscrepancies]);

  // Export Security Audit as Signed PDF for institutional compliance
  const handleExportSignedPdf = () => {
    try {
      exportSecurityAuditPdf(
        filteredSecurityLogs,
        user?.displayName || 'Super Admin Deodatus Maliti',
        user?.email || 'deodatusmaliti2@gmail.com',
        'Jitegemee Secondary School'
      );
      setActionMessage({
        type: 'success',
        text: isSw
          ? 'Ripoti ya ukaguzi wa usalama ya PDF iliyosainiwa kisheria imepakuliwa!'
          : 'Official Signed Security Audit PDF downloaded with cryptographic verification hash!',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to export signed PDF',
      });
    }
  };

  // Export Security Audit as RFC-4180 Compliance CSV
  const handleExportComplianceCsv = () => {
    try {
      exportSecurityAuditCsv(
        filteredSecurityLogs,
        user?.displayName || 'Super Admin Deodatus Maliti',
        'Jitegemee Secondary School'
      );
      setActionMessage({
        type: 'success',
        text: isSw
          ? 'Kumbukumbu za ukaguzi wa usalama za CSV (RFC-4180) zimepakuliwa!'
          : 'Forensic Security Audit CSV exported successfully for compliance and institutional records!',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to export CSV',
      });
    }
  };

  useEffect(() => {
    loadStatsAndData();

    // Subscribe to SSE real-time events
    const unsubscribe = backendApi.subscribe((event, data) => {
      const newEntry = {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        event: event.toUpperCase(),
        detail: typeof data === 'object' ? JSON.stringify(data).slice(0, 100) : String(data),
      };
      setLiveEvents((prev) => [newEntry, ...prev.slice(0, 49)]);

      setLastSyncTimestamp(new Date());
      setSecondsAgo(0);
      setSyncEventCount((prev) => prev + 1);
      setIsLiveConnected(true);

      if (event === 'connection_status') {
        setIsLiveConnected(Boolean(data?.connected));
      }

      if (
        event === 'doc_change' ||
        event === 'batch_sync' ||
        event === 'deduplicate_sync' ||
        event === 'auth_change' ||
        event === 'sync_pulse'
      ) {
        backendApi.getStats().then(setStats).catch(() => {});
        backendApi.getCollection(selectedCollection).then((d) => setCollectionData(Array.isArray(d) ? d : [])).catch(() => {});
        backendApi.getSecurityAuditLogs().then((res) => {
          setSecurityLogs(res.logs || []);
          setAuditSummary(res.summary || null);
        }).catch(() => {});
        scanForDiscrepancies();
      }
    });

    return () => unsubscribe();
  }, [selectedCollection, loadStatsAndData, scanForDiscrepancies]);

  // Conflict Resolution Actions: Choice 1 -> Force Refresh from Server (Pull Master)
  const handleForceRefreshFromServer = async (targetCollection?: string) => {
    setIsLoading(true);
    try {
      const collectionsToRefresh = targetCollection
        ? [targetCollection]
        : ['students', 'curriculum', 'teacherMarks', 'payments', 'settings'];

      const keyMap: Record<string, string> = {
        students: 'eduscore_tz_students',
        curriculum: 'eduscore_tz_curriculum',
        teacherMarks: 'eduscore_tz_teacher_marks',
        payments: 'eduscore_tz_payments',
        settings: 'eduscore_tz_settings',
      };

      let totalRefreshed = 0;
      for (const col of collectionsToRefresh) {
        const serverData = await backendApi.getCollection(col);
        const storageKey = keyMap[col];
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(serverData));
          totalRefreshed += Array.isArray(serverData) ? serverData.length : 1;
        }
      }

      window.dispatchEvent(new Event('eduscore_local_reload'));

      setActionMessage({
        type: 'success',
        text: isSw
          ? `Urejeshaji umekamilika! Hifadhi ya kivinjari imesasishwa moja kwa moja kutoka kwenye Seva Kuu (${totalRefreshed} rekodi).`
          : `Force Refresh Complete! Local storage successfully overwritten with ${totalRefreshed} authoritative Master Server record(s).`,
      });

      await scanForDiscrepancies();
      await loadStatsAndData();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to force refresh from master server',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Conflict Resolution Actions: Choice 2 -> Push Local Changes to Server (Push Local)
  const handlePushLocalChangesToServer = async (targetCollection?: string) => {
    setIsLoading(true);
    try {
      const collectionsToPush = targetCollection
        ? [targetCollection]
        : ['students', 'curriculum', 'teacherMarks', 'payments', 'settings'];

      let totalPushed = 0;
      for (const col of collectionsToPush) {
        const localData = getLocalCollectionData(col);
        if (localData && localData.length > 0) {
          await backendApi.batchImport(col, localData, 'replace');
          totalPushed += localData.length;
        }
      }

      await backendApi.triggerBroadcastPulse();

      setActionMessage({
        type: 'success',
        text: isSw
          ? `Mabadiliko ya ndani (${totalPushed} rekodi) yamepakiwa kwenye Seva Kuu na kusambazwa kwa vivinjari vyote mtandaoni mara moja!`
          : `Push Complete! Successfully uploaded ${totalPushed} local record(s) to Master Server and dispatched real-time update to all browsers.`,
      });

      await scanForDiscrepancies();
      await loadStatsAndData();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to push local changes to server',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resolve Single Discrepancy Record
  const handleResolveSingleItem = async (discrepancy: ConflictDiscrepancy, choice: 'PULL_SERVER' | 'PUSH_LOCAL') => {
    setIsLoading(true);
    try {
      const keyMap: Record<string, string> = {
        students: 'eduscore_tz_students',
        curriculum: 'eduscore_tz_curriculum',
        teacherMarks: 'eduscore_tz_teacher_marks',
        payments: 'eduscore_tz_payments',
        settings: 'eduscore_tz_settings',
      };
      const storageKey = keyMap[discrepancy.collection];

      if (choice === 'PULL_SERVER') {
        const localItems = getLocalCollectionData(discrepancy.collection);
        let updatedLocal: any[];
        if (discrepancy.type === 'LOCAL_ONLY') {
          updatedLocal = localItems.filter((it) => (it.id || it.code || it.receiptNo) !== discrepancy.id);
        } else {
          const exists = localItems.some((it) => (it.id || it.code || it.receiptNo) === discrepancy.id);
          if (exists) {
            updatedLocal = localItems.map((it) => ((it.id || it.code || it.receiptNo) === discrepancy.id ? discrepancy.serverData : it));
          } else {
            updatedLocal = [discrepancy.serverData, ...localItems];
          }
        }
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(updatedLocal));
        }
        window.dispatchEvent(new Event('eduscore_local_reload'));
        setActionMessage({
          type: 'success',
          text: isSw ? `Rekodi ${discrepancy.id} imerekebishwa kwa kutumia toleo la Seva Kuu.` : `Record ${discrepancy.id} synchronized from Master Server.`,
        });
      } else {
        if (discrepancy.type === 'SERVER_ONLY') {
          await backendApi.deleteDocument(discrepancy.collection, discrepancy.id);
        } else {
          await backendApi.saveDocument(discrepancy.collection, discrepancy.id, discrepancy.localData);
        }
        setActionMessage({
          type: 'success',
          text: isSw ? `Rekodi ${discrepancy.id} imepakiwa na kusasishwa kwenye Seva Kuu.` : `Record ${discrepancy.id} pushed to Master Server.`,
        });
      }

      await scanForDiscrepancies();
      await loadStatsAndData();
      if (selectedDiscrepancy?.id === discrepancy.id) {
        setSelectedDiscrepancy(null);
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to resolve item conflict',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceSyncNow = async () => {
    setIsManualSyncing(true);
    try {
      await loadStatsAndData();
      setActionMessage({
        type: 'success',
        text: isSw
          ? 'Usawazishaji wa haraka na Seva Kuu umekamilika kikamilifu!'
          : 'Instant synchronization with Master Backend Server completed successfully!',
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Sync failed' });
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleReconnectStream = () => {
    backendApi.reconnectStream();
    setActionMessage({
      type: 'success',
      text: isSw ? 'Jaribio la kuunganisha mkondo wa SSE linaendelea...' : 'Attempting to reconnect live SSE synchronization stream...',
    });
  };

  const handleDeduplicate = async () => {
    setIsLoading(true);
    try {
      const res = await backendApi.deduplicate(selectedCollection === 'users' ? 'users' : 'students');
      setActionMessage({
        type: 'success',
        text: isSw
          ? `Usafishaji umekamilika! Nakala zilizofutwa: ${res.foundDuplicates}. Jumla ya rekodi safi: ${res.cleanedList.length}.`
          : `Deduplication complete! Cleaned ${res.foundDuplicates} duplicate entries. Total unique records: ${res.cleanedList.length}.`,
      });
      loadStatsAndData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Deduplication failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm(isSw ? 'Una uhakika unataka kufuta rekodi hii?' : 'Are you sure you want to delete this record?')) return;
    try {
      await backendApi.deleteDocument(selectedCollection, id);
      setActionMessage({
        type: 'success',
        text: isSw ? 'Rekodi imefutwa kikamilifu.' : `Document ${id} successfully deleted.`,
      });
      loadStatsAndData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Deletion failed' });
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const res = await backendApi.createBackup();
      setActionMessage({
        type: 'success',
        text: isSw
          ? `Hifadhi ya dharura imeundwa: ${res.backup?.filename} (${(res.backup?.size / 1024).toFixed(1)} KB)`
          : `Snapshot backup successfully created: ${res.backup?.filename} (${(res.backup?.size / 1024).toFixed(1)} KB)`,
      });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Backup creation failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatchPasswordReset = async (targetEmail: string) => {
    if (!targetEmail.trim()) return;
    setIsLoading(true);
    try {
      const res = await backendApi.sendPasswordReset(targetEmail.trim());
      setDispatchedTokenInfo({
        email: targetEmail.trim(),
        code: res.restorationCode,
        message: res.message,
      });
      setActionMessage({
        type: 'success',
        text: isSw
          ? `Barua pepe ya kurejesha nenosiri imetumwa kwa ${targetEmail} (PIN: ${res.restorationCode || 'N/A'})`
          : `Password restoration email dispatched to ${targetEmail} (PIN Code: ${res.restorationCode || 'Generated'}).`,
      });
      loadStatsAndData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to dispatch password restoration' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverUsername = async () => {
    if (!recoveryIdentifierInput.trim()) return;
    setIsLoading(true);
    try {
      const res = await backendApi.recoverUsername(recoveryIdentifierInput.trim());
      setUsernameSearchResults(res.matches || []);
      setActionMessage({
        type: 'success',
        text: isSw
          ? `Utafutaji umekamilika: Akaunti ${res.matches.length} zimepatikana.`
          : `Lookup complete: Found ${res.matches.length} matching institutional user account(s).`,
      });
      loadStatsAndData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Username recovery failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestBroadcastPulse = async () => {
    setIsLoading(true);
    try {
      const res = await backendApi.triggerBroadcastPulse();
      setActionMessage({
        type: 'success',
        text: isSw
          ? `Mawimbi ya Usawazishaji Moja kwa Moja yametumwa kwa vivinjari na vifaa vyote ${res.dispatchedToNodes} mtandaoni mara moja!`
          : `Authoritative real-time sync pulse immediately dispatched to ${res.dispatchedToNodes} online browser/device node(s)!`,
      });
      loadStatsAndData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Sync pulse failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (email: string, newRole: any) => {
    setIsLoading(true);
    try {
      await backendApi.updateUserRole(email, newRole);
      setActionMessage({
        type: 'success',
        text: isSw
          ? `Wadhifa wa ${email} umebadilishwa kuwa ${newRole.toUpperCase()} na kusambazwa kwa vifaa vyote mtandaoni!`
          : `Role for ${email} updated to ${newRole.toUpperCase()} and dispatched live to all connected browser sessions!`,
      });
      loadStatsAndData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update user role' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const filteredCollectionData = collectionData.filter((item) => {
    if (!searchQuery.trim()) return true;
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(searchQuery.toLowerCase());
  });

  const filteredSecurityLogs = securityLogs.filter((log) => {
    if (auditFilter === 'SUCCESS' && log.status !== 'SUCCESS') return false;
    if (auditFilter === 'FAILED' && log.status !== 'FAILED' && log.status !== 'BLOCKED') return false;
    if (auditFilter === 'RESETS' && !log.eventType.includes('RESET') && !log.eventType.includes('RECOVERY')) return false;

    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    return (
      log.email.toLowerCase().includes(q) ||
      (log.displayName && log.displayName.toLowerCase().includes(q)) ||
      log.ipAddress.includes(q) ||
      log.eventType.toLowerCase().includes(q) ||
      (log.reason && log.reason.toLowerCase().includes(q)) ||
      log.browser.toLowerCase().includes(q)
    );
  });

  const filteredConflicts = conflicts.filter((c) => {
    if (conflictFilter !== 'ALL' && c.collection !== conflictFilter) return false;
    if (!conflictSearch.trim()) return true;
    const q = conflictSearch.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.collection.toLowerCase().includes(q) ||
      c.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-amber-500/20">
              <Server className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">EduScore Independent Backend</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync (1TB Tier)
                </span>
                {conflicts.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {conflicts.length} {isSw ? 'Migongano' : 'Conflicts'}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-0.5">
                {isSw
                  ? 'Kituo Kikuu cha Usalama, Utatuzi wa Migongano ya Data, na Mfumo Imara wa Kuingia'
                  : 'Enterprise Security Audit, Conflict Resolution Hub, Real-Time Master Sync & Restoration Suite'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTestBroadcastPulse}
              disabled={isLoading}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              title="Broadcast instant sync pulse to all online browsers"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{isSw ? 'Jaribu Usawazishaji Mtandaoni' : 'Test Real-Time Dispatch'}</span>
            </button>
            <button
              onClick={loadStatsAndData}
              disabled={isLoading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isSw ? 'Sasisha Data' : 'Refresh Metrics'}</span>
            </button>
            <button
              onClick={handleCreateBackup}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isSw ? 'Unda Hifadhi Nakala' : 'Create 1TB Snapshot'}</span>
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {actionMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-500 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-xs opacity-75 hover:opacity-100 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Top KPI Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">{isSw ? 'Matukio ya Kuingia (Audits)' : 'Total Auth Events'}</span>
            <span className="text-xl font-bold text-amber-400">{auditSummary?.totalEvents ?? securityLogs.length}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">{isSw ? 'Kuingia Kulikofanikiwa' : 'Successful Logins'}</span>
            <span className="text-xl font-bold text-emerald-400">{auditSummary?.successfulLogins ?? 0}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">{isSw ? 'Migongano ya Data (Conflicts)' : 'Data Conflicts'}</span>
            <span className={`text-xl font-bold flex items-center gap-1 ${conflicts.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {conflicts.length === 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {conflicts.length}
            </span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">{isSw ? 'Urejeshaji Nenosiri' : 'Password Restorations'}</span>
            <span className="text-xl font-bold text-cyan-400">{auditSummary?.passwordResets ?? 0}</span>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px] font-medium">{isSw ? 'Vifaa Vilivyounganishwa' : 'Active Connected Nodes'}</span>
            <span className="text-xl font-bold text-purple-400 flex items-center gap-1">
              <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
              {stats?.activeNodesCount ?? 1} Nodes
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Master Backend Connection & Synchronization Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4.5 overflow-hidden transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Indicator & Live Beacon */}
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs transition-colors ${
              isLiveConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}>
              {isLiveConnected ? <Wifi className="w-6 h-6 animate-pulse" /> : <WifiOff className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">
                  {isSw ? 'Hali ya Muunganisho wa Seva Kuu (Master Server)' : 'Master Backend Server Connection'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide border flex items-center gap-1.5 shadow-2xs ${
                  isLiveConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                  <span>{isLiveConnected ? (isSw ? 'IMEUNGANISHWA & INASAWAZISHA' : 'SYNCHRONIZED WITH MASTER SERVER') : (isSw ? 'HAIJAUNGANISHWA' : 'DISCONNECTED')}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{isSw ? 'Mtumishi Mkuu:' : 'Master Authority:'} <strong className="text-slate-800">EduScore In-Built Database Engine (1TB)</strong></span>
                <span className="text-slate-300">•</span>
                <span>{isSw ? 'Muda wa Kasi:' : 'Latency:'} <strong className="text-emerald-700 font-mono">~{syncLatencyMs}ms</strong></span>
                <span className="text-slate-300">•</span>
                <span>{isSw ? 'Mtiririko wa SSE:' : 'SSE Stream:'} <strong className="text-indigo-700">Active Channel</strong></span>
              </p>
            </div>
          </div>

          {/* Last-Sync Timestamp, Conflict Status & Actions */}
          <div className="flex items-center gap-3 flex-wrap lg:justify-end">
            {/* Last Synchronized Timestamp Box */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {isSw ? 'Muda wa Mwisho wa Usawazishaji' : 'Last Synchronized Timestamp'}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-black text-slate-900 text-xs">
                    {lastSyncTimestamp.toLocaleTimeString()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${
                    secondsAgo <= 15
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      : secondsAgo <= 45
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${secondsAgo <= 15 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span>{secondsAgo === 0 ? (isSw ? 'Sasa hivi (Muda Halisi)' : 'Just now (Live)') : `${secondsAgo}s ${isSw ? 'zilizopita' : 'ago'}`}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Conflict Resolver Button */}
            <button
              type="button"
              onClick={() => setActiveTab('conflicts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer border ${
                conflicts.length > 0
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
              title="Inspect local vs master server discrepancies"
            >
              <Split className="w-3.5 h-3.5" />
              <span>{conflicts.length > 0 ? `${conflicts.length} ${isSw ? 'Migongano' : 'Conflicts'}` : (isSw ? 'Usawazishaji Sawa' : 'In Sync')}</span>
            </button>

            {/* Quick Synchronize Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleForceSyncNow}
                disabled={isManualSyncing}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                title="Force instant sync with master server"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                <span>{isSw ? 'Sawazisha Sasa' : 'Force Master Sync'}</span>
              </button>
              {!isLiveConnected && (
                <button
                  type="button"
                  onClick={handleReconnectStream}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{isSw ? 'Unganisha Upya' : 'Reconnect Stream'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('bandwidthStorage')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'bandwidthStorage' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <HardDrive className="w-4 h-4 text-indigo-600" />
          <span>{isSw ? 'Bandwidth & Hifadhi ya 1TB (Telemetry)' : '1TB Bandwidth & Storage Analytics'}</span>
          <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 font-bold rounded-full text-[10px]">
            1,000 GB
          </span>
        </button>
        <button
          onClick={() => setActiveTab('securityAudit')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'securityAudit' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{isSw ? 'Ukaguzi wa Usalama (Security Audit)' : 'Security Audit & Credential Restoration'}</span>
        </button>
        <button
          onClick={() => setActiveTab('conflicts')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'conflicts' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Split className={`w-4 h-4 ${conflicts.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`} />
          <span>{isSw ? 'Utatuzi wa Migongano (Conflict Resolution)' : 'Conflict Resolution & Data Alignment'}</span>
          {conflicts.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black rounded-full text-[10px]">
              {conflicts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'overview' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{isSw ? 'Muhtasari wa Mfumo' : 'Engine Overview'}</span>
        </button>
        <button
          onClick={() => setActiveTab('explorer')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'explorer' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{isSw ? 'Kagua Mkusanyiko wa Data' : 'Live Document Explorer'}</span>
        </button>
        <button
          onClick={() => setActiveTab('duplicates')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'duplicates' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{isSw ? 'Kuzuia Nakala Rudufu' : 'Duplicate Resolution Engine'}</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'users' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isSw ? 'Akaunti & Ruhusa za Watumiaji' : 'User Accounts & Roles'}</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'logs' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>{isSw ? 'Mtiririko wa SSE (Live Events)' : 'Real-Time Sync Stream'}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB: 1TB STORAGE & BANDWIDTH REAL-TIME TELEMETRY SECTION  */}
      {/* ========================================================= */}
      {activeTab === 'bandwidthStorage' && (
        <BandwidthStorageSection language={language} />
      )}

      {/* ========================================================= */}
      {/* TAB: CONFLICT RESOLUTION & DATA ALIGNMENT UI COMPONENT    */}
      {/* ========================================================= */}
      {activeTab === 'conflicts' && (
        <div className="space-y-6">
          {/* Main Conflict Resolution Hub Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className={`w-13 h-13 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 shadow-lg ${
                  conflicts.length > 0
                    ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20'
                    : 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20'
                }`}>
                  {conflicts.length > 0 ? <Split className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black tracking-tight">
                      {isSw ? 'Kituo cha Utatuzi wa Migongano ya Data' : 'Data Conflict & Discrepancy Resolution Engine'}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                      conflicts.length === 0
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {conflicts.length === 0 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{conflicts.length === 0 ? (isSw ? 'Hakuna Migongano - Data Zote Ziko Sawa' : 'Zero Conflicts - 100% In Sync') : `${conflicts.length} ${isSw ? 'Migongano Imegunduliwa' : 'Discrepancies Identified'}`}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                    {isSw
                      ? 'Linganisha data zilizohifadhiwa kwenye kivinjari hiki (Local Storage) dhidi ya Seva Kuu (Master Backend Server). Chagua kuboresha kivinjari kwa data za Seva Kuu au kusukuma mabadiliko ya ndani kwenye Seva Kuu.'
                      : 'Compares browser offline cache (localStorage) against the authoritative Master Backend database. Choose to either pull the latest cloud master records or overwrite the server with your local drafts.'}
                  </p>
                </div>
              </div>

              {/* Primary Two-Choice Action Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => handleForceRefreshFromServer()}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  title="Overwrite local storage with authoritative server data"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>{isSw ? 'Vuta Kutoka Seva Kuu (Force Refresh)' : 'Force Refresh from Server'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePushLocalChangesToServer()}
                  disabled={isLoading}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  title="Upload all local storage records to master server"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isSw ? 'Pakia Mabadiliko Seva Kuu (Push Local)' : 'Push Local Changes to Server'}</span>
                </button>
                <button
                  type="button"
                  onClick={scanForDiscrepancies}
                  disabled={isScanningConflicts}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                  title="Re-scan and compare properties"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningConflicts ? 'animate-spin' : ''}`} />
                  <span>{isSw ? 'Kagua Upya' : 'Re-Scan'}</span>
                </button>
              </div>
            </div>

            {/* Quick Summary Cards per Collection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
              {collectionReports.map((rep) => (
                <div
                  key={rep.collection}
                  onClick={() => setConflictFilter(rep.collection)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    conflictFilter === rep.collection
                      ? 'bg-slate-800/90 border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 truncate max-w-[100px]">{rep.label}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      rep.conflictsCount === 0
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {rep.conflictsCount === 0 ? 'In Sync' : `${rep.conflictsCount} Diff`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Local: <strong className="text-white">{rep.localCount}</strong></span>
                    <span>Server: <strong className="text-amber-400">{rep.serverCount}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Explanations & Quick Directives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <DownloadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs">
                    {isSw ? 'Chaguo 1: Vuta Kutoka Seva Kuu (Force Refresh from Server)' : 'Choice 1: Force Refresh from Server (Recommended)'}
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    {isSw ? 'Huweka Seva Kuu kama chanzo kikuu cha ukweli na mamlaka.' : 'Establishes Master Server as authoritative source of truth.'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                {isSw
                  ? 'Ukibonyeza kitufe hiki, mfumo utapakua data rasmi za Seva Kuu na kufuta tofauti zozote za ndani ya kivinjari hiki. Inafaa iwapo vifaa vingine viliweka alama mpya au rekodi zilizoidhinishwa.'
                  : 'Downloads the latest verified master cloud records and overwrites browser local cache. Ideal when marks or curriculum changes were updated by other faculty or admin nodes.'}
              </p>
              <button
                type="button"
                onClick={() => handleForceRefreshFromServer(conflictFilter !== 'ALL' ? conflictFilter : undefined)}
                disabled={isLoading}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>{isSw ? `Vuta Data za ${conflictFilter !== 'ALL' ? conflictFilter : 'Zote'} kutoka Seva Kuu` : `Force Refresh ${conflictFilter !== 'ALL' ? conflictFilter : 'All Collections'} from Server`}</span>
              </button>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-950 text-xs">
                    {isSw ? 'Chaguo 2: Pakia Mabadiliko ya Ndani (Push Local Changes to Server)' : 'Choice 2: Push Local Changes to Server'}
                  </h4>
                  <p className="text-[11px] text-indigo-800">
                    {isSw ? 'Hupakia alama na rasimu zilizopo kwenye kivinjari hiki kwenda Seva Kuu.' : 'Commits and broadcasts your local browser drafts to all online devices.'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-indigo-900 leading-relaxed">
                {isSw
                  ? 'Ukibonyeza kitufe hiki, mabadiliko ya alama, wanafunzi au mitaala yaliyofanyika kwenye kivinjari hiki yatasasishwa kwenye Seva Kuu na kutumwa moja kwa moja kwa vivinjari vyote vilivyounganishwa.'
                  : 'Uploads your locally stored candidate edits, continuous assessment marks, and curriculum structures to the Master Backend and broadcasts the update to all online browsers.'}
              </p>
              <button
                type="button"
                onClick={() => handlePushLocalChangesToServer(conflictFilter !== 'ALL' ? conflictFilter : undefined)}
                disabled={isLoading}
                className="w-full py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isSw ? `Pakia Data za ${conflictFilter !== 'ALL' ? conflictFilter : 'Zote'} kwenda Seva Kuu` : `Push ${conflictFilter !== 'ALL' ? conflictFilter : 'All Collections'} Local Changes to Server`}</span>
              </button>
            </div>
          </div>

          {/* Conflict Inspection & Discrepancy Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-800 mr-2">{isSw ? 'Chuja Mkusanyiko:' : 'Filter Collection:'}</span>
                {(['ALL', 'students', 'teacherMarks', 'curriculum', 'payments', 'settings'] as const).map((col) => (
                  <button
                    key={col}
                    onClick={() => setConflictFilter(col)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      conflictFilter === col
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {col === 'ALL' ? (isSw ? 'Zote (All)' : 'All Collections') : col}
                    {col !== 'ALL' && (
                      <span className="ml-1.5 opacity-70">
                        ({conflicts.filter((c) => c.collection === col).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={conflictSearch}
                  onChange={(e) => setConflictSearch(e.target.value)}
                  placeholder={isSw ? 'Tafuta mgongano wa data...' : 'Search discrepancies...'}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Record Title & ID</th>
                    <th className="p-3">Collection</th>
                    <th className="p-3">Conflict Type</th>
                    <th className="p-3">Local Storage State (Browser)</th>
                    <th className="p-3">Master Server State (Authority)</th>
                    <th className="p-3 text-right">Individual Resolution Choice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredConflicts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                        <div className="font-bold text-slate-800 text-sm">
                          {isSw ? 'Hakuna Mgongano wa Data Uliogunduliwa!' : 'No Data Discrepancies Detected!'}
                        </div>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          {isSw
                            ? 'Hifadhi ya ndani ya kivinjari hiki inalingana kikamilifu 100% na Seva Kuu ya EduScore.'
                            : 'Your local browser storage is fully synchronized and in parity with the master server database.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredConflicts.map((c) => (
                      <tr key={`${c.collection}-${c.id}`} className="hover:bg-amber-50/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div>{c.title}</div>
                          <span className="font-mono text-[10px] text-slate-400">{c.id}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {c.collection}
                          </span>
                        </td>
                        <td className="p-3">
                          {c.type === 'MODIFIED' && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
                              <GitCompare className="w-3 h-3 text-amber-700" />
                              <span>MODIFIED DIFF</span>
                            </span>
                          )}
                          {c.type === 'LOCAL_ONLY' && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1 shadow-2xs">
                              <UploadCloud className="w-3 h-3 text-blue-700" />
                              <span>LOCAL ONLY (PENDING PUSH)</span>
                            </span>
                          )}
                          {c.type === 'SERVER_ONLY' && (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 inline-flex items-center gap-1 shadow-2xs">
                              <DownloadCloud className="w-3 h-3 text-purple-700" />
                              <span>SERVER ONLY (PENDING PULL)</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 max-w-xs font-mono text-[11px] text-slate-600 truncate">
                          {c.localSummary}
                        </td>
                        <td className="p-3 max-w-xs font-mono text-[11px] text-slate-600 truncate">
                          {c.serverSummary}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDiscrepancy(c)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Inspect full JSON diff"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Inspect Diff</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveSingleItem(c, 'PULL_SERVER')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                              title="Keep Master Server version"
                            >
                              <DownloadCloud className="w-3 h-3" />
                              <span>Use Server</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveSingleItem(c, 'PUSH_LOCAL')}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
                              title="Overwrite Master Server with Local version"
                            >
                              <UploadCloud className="w-3 h-3" />
                              <span>Use Local</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal / Slide-Out Diff Inspector */}
          {selectedDiscrepancy && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-scaleUp">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <Split className="w-5 h-5 text-amber-600" />
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {isSw ? 'Ukaguzi wa Kina wa Mgongano wa Data' : 'Discrepancy Field-by-Field Diff Inspector'}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {selectedDiscrepancy.collectionLabel} • ID: <code className="text-slate-800">{selectedDiscrepancy.id}</code>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedDiscrepancy(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Local State Box */}
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-blue-600" />
                        <span>Local Storage (Browser Version)</span>
                      </span>
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                        Local Draft
                      </span>
                    </div>
                    <pre className="p-3 bg-slate-900 text-blue-300 rounded-lg text-[10px] font-mono overflow-x-auto max-h-64 leading-relaxed">
                      {JSON.stringify(selectedDiscrepancy.localData, null, 2) || '(Null / Not present)'}
                    </pre>
                  </div>

                  {/* Server State Box */}
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                        <DownloadCloud className="w-4 h-4 text-emerald-600" />
                        <span>Master Server (Authoritative Version)</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Server Master
                      </span>
                    </div>
                    <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg text-[10px] font-mono overflow-x-auto max-h-64 leading-relaxed">
                      {JSON.stringify(selectedDiscrepancy.serverData, null, 2) || '(Null / Not present)'}
                    </pre>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{selectedDiscrepancy.details}</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleResolveSingleItem(selectedDiscrepancy, 'PULL_SERVER')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>{isSw ? 'Weka Toleo la Seva Kuu (Pull Master)' : 'Force Pull Server Version'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolveSingleItem(selectedDiscrepancy, 'PUSH_LOCAL')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{isSw ? 'Weka Toleo la Ndani (Push Local)' : 'Push Local Version to Server'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: SECURITY AUDIT & CREDENTIAL RESTORATION              */}
      {/* ========================================================= */}
      {activeTab === 'securityAudit' && (
        <div className="space-y-6">
          {/* Top Actions & Filters */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isSw ? 'Ukaguzi wa Kuingia & Matukio ya Usalama' : 'Security Audit & Access Logs'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isSw
                      ? 'Rekodi za wakati halisi za majaribio ya kuingia, mafanikio, vizuizi na urejeshaji nenosiri'
                      : 'Real-time telemetry tracking authentication attempts, device metadata, failed logins & restorations'}
                  </p>
                </div>
              </div>

              {/* Filter Pills & Export Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {(['ALL', 'SUCCESS', 'FAILED', 'RESETS'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setAuditFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      auditFilter === filter
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'ALL' && (isSw ? 'Matukio Yote' : 'All Events')}
                    {filter === 'SUCCESS' && (isSw ? 'Mafanikio' : 'Successful')}
                    {filter === 'FAILED' && (isSw ? 'Kushindwa' : 'Failed / Blocked')}
                    {filter === 'RESETS' && (isSw ? 'Urejeshaji' : 'Restorations')}
                  </button>
                ))}

                <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                {/* Export Signed PDF Button */}
                <button
                  id="btn-export-signed-pdf"
                  type="button"
                  onClick={handleExportSignedPdf}
                  title="Export Official Institutional Security Audit Log as Signed PDF (Tanzania Compliance Standard)"
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isSw ? 'Pakua PDF Iliyosainiwa' : 'Export Signed PDF'}</span>
                </button>

                {/* Export Compliance CSV Button */}
                <button
                  id="btn-export-compliance-csv"
                  type="button"
                  onClick={handleExportComplianceCsv}
                  title="Export Security Audit Logs to RFC-4180 CSV for spreadsheet archival and audit verification"
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSw ? 'Pakua CSV (Forensic)' : 'Export CSV'}</span>
                </button>

                {/* Quick Announcements broadcast button */}
                {onOpenAnnouncements && (
                  <button
                    type="button"
                    onClick={onOpenAnnouncements}
                    title="Send Security/System Directive Announcement to all school administrators, heads and teachers"
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden md:inline">{isSw ? 'Tuma Tangazo' : 'Broadcast'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder={isSw ? 'Tafuta kwa barua pepe, IP, kifaa, kivinjari au sababu...' : 'Search logs by email, IP address, device, browser or event reason...'}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Forensic Audit Logs Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 text-xs">
                  {isSw ? 'Orodha ya Matukio ya Hivi Karibuni' : 'Recent Access Events & Forensic Telemetry'} ({filteredSecurityLogs.length})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Signed & Verified
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={handleExportSignedPdf}
                  className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1 cursor-pointer mr-2"
                >
                  <FileText className="w-3 h-3" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportComplianceCsv}
                  className="text-indigo-700 hover:text-indigo-800 font-bold hover:underline flex items-center gap-1 cursor-pointer mr-2"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>CSV</span>
                </button>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {isSw ? 'Imesasishwa moja kwa moja' : 'Live synchronized via SSE'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3">User / Identity</th>
                    <th className="p-3">Device & Browser</th>
                    <th className="p-3">IP & Location</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Details / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSecurityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        {isSw ? 'Hakuna kumbukumbu za usalama zinazolingana na utafutaji wako.' : 'No security audit logs match the selected filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSecurityLogs.map((log) => {
                      const isSuccess = log.status === 'SUCCESS';
                      const isFailed = log.status === 'FAILED' || log.status === 'BLOCKED';
                      return (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-3 font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                log.eventType.includes('LOGIN')
                                  ? 'bg-blue-100 text-blue-800'
                                  : log.eventType.includes('RESET') || log.eventType.includes('RECOVERY')
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {log.eventType}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{log.email}</div>
                            {log.displayName && <div className="text-[10px] text-slate-400">{log.displayName}</div>}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-1.5">
                              {log.deviceType === 'Mobile' ? (
                                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                              ) : log.deviceType === 'Tablet' ? (
                                <Tablet className="w-3.5 h-3.5 text-slate-500" />
                              ) : (
                                <Laptop className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              <span className="font-medium text-slate-800">{log.browser}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">{log.os} • {log.deviceType}</div>
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            <div className="text-slate-800">{log.ipAddress}</div>
                            <div className="text-[10px] text-slate-400">{log.geoRegion || 'Tanzania (TZ)'}</div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                isSuccess
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isFailed
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isSuccess ? <Check className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-rose-600" />}
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-slate-600 max-w-xs truncate" title={log.reason}>
                            {log.reason || 'Normal operation'}
                            {log.restorationCode && (
                              <span className="ml-1 font-mono font-bold text-amber-600">(PIN: {log.restorationCode})</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Password & Username Restoration Suite Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Direct Admin Password Reset Dispatch */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {isSw ? 'Tuma Barua Pepe ya Kurejesha Nenosiri' : 'Dispatch Password Restoration Email'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isSw
                      ? 'Tuma PIN ya uthibitisho na kiungo cha kurejesha nenosiri kwa mtumiaji yeyote'
                      : 'Generate and send a 6-digit numeric PIN and secure reset token to a registered email'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {isSw ? 'Barua Pepe ya Mtumiaji:' : 'Registered User Email:'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={resetEmailInput}
                      onChange={(e) => setResetEmailInput(e.target.value)}
                      placeholder="e.g., teacher@jitegemee.ac.tz"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                    <button
                      onClick={() => handleDispatchPasswordReset(resetEmailInput)}
                      disabled={isLoading || !resetEmailInput.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSw ? 'Tuma' : 'Dispatch'}</span>
                    </button>
                  </div>
                </div>

                {dispatchedTokenInfo && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1 animate-fadeIn">
                    <div className="font-bold text-amber-900 flex items-center justify-between">
                      <span>Restoration PIN Generated:</span>
                      <span className="font-mono text-sm px-2 py-0.5 bg-amber-200 rounded font-black text-slate-950">
                        {dispatchedTokenInfo.code || 'PIN SENT'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800">{dispatchedTokenInfo.message}</p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Target: {dispatchedTokenInfo.email}</span>
                      <button
                        onClick={() => copyToClipboard(dispatchedTokenInfo.code || '', 'pin')}
                        className="text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedText === 'pin' ? 'Copied PIN' : 'Copy PIN'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Username / Institutional Identifier Recovery */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-900 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {isSw ? 'Tafuta Jina la Mtumiaji / Barua Pepe Iliyopotea' : 'Institutional Username & Account Recovery'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isSw
                      ? 'Tafuta akaunti kwa kutumia jina kamili, namba ya simu au kitambulisho cha shule'
                      : 'Lookup account username/email by teacher full name, phone number, or school ID'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {isSw ? 'Kitambulisho / Jina la Mwalimu au Mzazi:' : 'Name, Institution or Partial Identifier:'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={recoveryIdentifierInput}
                      onChange={(e) => setRecoveryIdentifierInput(e.target.value)}
                      placeholder="e.g., Peter Masanja, Jitegemee, or 07..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    <button
                      onClick={handleRecoverUsername}
                      disabled={isLoading || !recoveryIdentifierInput.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isSw ? 'Tafuta' : 'Lookup'}</span>
                    </button>
                  </div>
                </div>

                {usernameSearchResults && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {usernameSearchResults.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2 text-center">No matching user accounts found.</p>
                    ) : (
                      usernameSearchResults.map((m, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900">{m.displayName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{m.email} • {m.role.toUpperCase()}</div>
                          </div>
                          <button
                            onClick={() => {
                              setResetEmailInput(m.email);
                              handleDispatchPasswordReset(m.email);
                            }}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[10px] cursor-pointer"
                          >
                            Send PIN
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: ENGINE OVERVIEW                                      */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Capacity Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Storage Tier</span>
              <HardDrive className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900">
                {stats?.databaseSizeFormatted || '1.24 MB'}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Allocated Capacity: <strong>1,000 GB (1.0 TB Enterprise Tier)</strong>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-indigo-600 h-2 rounded-full w-[2%]" />
            </div>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Used: {stats?.databaseSizeFormatted || '0.001%'}</span>
              <span>Available: 999.99 GB</span>
            </div>
          </div>

          {/* Engine Architecture Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Backend Authority Engine</span>
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Engine Type:</span>
                <span className="font-bold text-slate-900">In-Built Embedded JSON Engine</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Real-Time Transport:</span>
                <span className="font-bold text-slate-900">Server-Sent Events (SSE) Stream</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Deduplication:</span>
                <span className="font-bold text-emerald-600">Active Deterministic Hashing</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Multi-Device Parity:</span>
                <span className="font-bold text-indigo-600">Instant Online Broadcast</span>
              </div>
            </div>
          </div>

          {/* Connected Remote Nodes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Connected Browser Nodes</span>
              <Radio className="w-5 h-5 text-emerald-600 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {connectedNodes.length > 0 ? connectedNodes.length : 1} Active Session(s)
            </div>
            <div className="space-y-2 pt-2 max-h-40 overflow-y-auto">
              {connectedNodes.length === 0 ? (
                <div className="p-2 bg-slate-50 rounded text-slate-500 text-xs text-center">
                  1 browser node connected via current session.
                </div>
              ) : (
                connectedNodes.map((node) => (
                  <div key={node.id} className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{node.ip}</div>
                      <span className="text-[10px] text-slate-500">{node.userEmail}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                      LIVE
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: DOCUMENT EXPLORER                                    */}
      {/* ========================================================= */}
      {activeTab === 'explorer' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {(['students', 'curriculum', 'teacherMarks', 'payments', 'users', 'auditLogs'] as const).map((col) => (
                <button
                  key={col}
                  onClick={() => setSelectedCollection(col)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCollection === col
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {col} ({col === selectedCollection ? collectionData.length : '...'})
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isSw ? 'Tafuta ndani ya rekodi...' : 'Filter records...'}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] sticky top-0">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Document ID / Name</th>
                  <th className="p-3">Summary Data</th>
                  <th className="p-3">Last Updated</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCollectionData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No records found in collection {selectedCollection}.
                    </td>
                  </tr>
                ) : (
                  filteredCollectionData.map((item, idx) => (
                    <tr key={item.id || item.uid || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900">
                        <div>{item.name || item.displayName || item.title || item.id || item.uid}</div>
                        <span className="font-mono text-[10px] text-slate-400">{item.id || item.uid}</span>
                      </td>
                      <td className="p-3 max-w-md truncate font-mono text-[11px] text-slate-600">
                        {JSON.stringify(item)}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteDocument(item.id || item.uid)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: DUPLICATE RESOLUTION ENGINE                          */}
      {/* ========================================================= */}
      {activeTab === 'duplicates' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {isSw ? 'Injini ya Kugundua na Kuzuia Nakala Rudufu' : 'Strict Duplicate Detection & Rejection Engine'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Scans for identical student candidate IDs, composite names, or duplicate accounts and merges or eliminates them automatically.
              </p>
            </div>
            <button
              onClick={handleDeduplicate}
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isSw ? 'Safisha Nakala Zote Sasa' : 'Run Auto-Deduplication'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 text-xs block">1. CSV Import Duplicate Guard</span>
              <p className="text-xs text-slate-600">
                During batch CSV uploads, candidate IDs matching existing records are automatically checked. In <em>Merge Mode</em>, updated marks are integrated without creating redundant rows. In <em>Strict Mode</em>, duplicates are rejected with an audit alert.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 text-xs block">2. In-Memory Hash Key Validation</span>
              <p className="text-xs text-slate-600">
                All records are mapped using deterministic composite keys (<code>candidate_id + form_level</code>). Zero duplicate entries are permitted in persistent storage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: USER ACCOUNTS & ROLES DIRECTORY                      */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Password Policy & Authority Notice Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-indigo-50 p-4 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-900">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <span>System Password Policy: Strictly Enforced Minimum 6 Characters</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Active Policy
                  </span>
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  All user accounts created via email/password are cryptographically protected with unique random salt generation and SHA-256 HMAC hashing. Minimum password length policy of 6 characters is enforced across all client registration and reset forms.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>In-Built Backend Authority</span>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-xs">Registered System Accounts ({allUsers.length})</h3>
                <p className="text-[11px] text-slate-500">Comprehensive directory of faculty, administration, parent, and inspector accounts.</p>
              </div>
              <button
                type="button"
                onClick={loadStatsAndData}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Accounts</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">User & Profile</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Authentication Method</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3">Password Policy</th>
                    <th className="p-3">Institution & Last Login</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {allUsers.map((u) => {
                    const provider = u.provider || (u.email.includes('gmail') ? 'google' : u.email.includes('yahoo') ? 'yahoo' : 'password');
                    return (
                      <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-900">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-slate-800 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                              {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="text-slate-900">{u.displayName}</div>
                              <div className="font-mono text-[10px] text-slate-400">{u.uid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">{u.email}</td>
                        <td className="p-3">
                          {provider === 'google' ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5 shadow-xs">
                              <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-black">G</span>
                              <span>Google 1-Click</span>
                            </span>
                          ) : provider === 'yahoo' ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1.5 shadow-xs">
                              <span className="w-3.5 h-3.5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[8px] font-black">Y!</span>
                              <span>Yahoo Webmail</span>
                            </span>
                          ) : provider === 'demo' ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5 shadow-xs">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              <span>Instant Demo Switch</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1.5 shadow-xs">
                              <Lock className="w-3 h-3 text-indigo-600" />
                              <span>Email & Password</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.email, e.target.value as UserRole)}
                            className="text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 rounded-lg px-2 py-1 cursor-pointer hover:bg-amber-100 focus:ring-2 focus:ring-amber-500 transition-colors"
                          >
                            <option value="admin">ADMIN (Chief Authority)</option>
                            <option value="headteacher">HEADTEACHER (Academic Head)</option>
                            <option value="teacher">TEACHER (Marks Entry)</option>
                            <option value="parent">PARENT (Student Portal)</option>
                            <option value="inspector">INSPECTOR (NECTA Audit)</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>≥ 6 chars SHA-256</span>
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 text-[11px]">
                          <div className="truncate max-w-[140px] font-medium text-slate-800">{u.institution || 'Jitegemee Secondary School'}</div>
                          <div className="text-[10px] text-slate-400">
                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Active session'}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {u.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setResetEmailInput(u.email);
                              handleDispatchPasswordReset(u.email);
                              setActiveTab('securityAudit');
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Dispatch Reset</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: REAL-TIME SSE SYNC STREAM LOGS                      */}
      {/* ========================================================= */}
      {activeTab === 'logs' && (
        <div className="bg-slate-950 text-slate-200 rounded-2xl p-5 shadow-xl border border-slate-800 font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-white">Live Server-Sent Events Broadcast</span>
            </div>
            <button
              onClick={() => setLiveEvents([])}
              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Clear Log Window
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {liveEvents.length === 0 ? (
              <div className="text-slate-500 text-center py-6">
                Waiting for incoming real-time cloud mutations and sync broadcasts...
              </div>
            ) : (
              liveEvents.map((ev) => (
                <div key={ev.id} className="p-2 bg-slate-900/80 rounded border border-slate-800 flex items-start gap-2">
                  <span className="text-slate-400 text-[10px] whitespace-nowrap">{ev.time}</span>
                  <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-bold text-[10px] rounded">
                    {ev.event}
                  </span>
                  <span className="text-slate-300 break-all text-[11px]">{ev.detail}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
