// EduScore In-Built Independent Backend API Client

export type UserRole = 'admin' | 'headteacher' | 'teacher' | 'parent' | 'inspector';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  institution: string;
  createdAt?: string;
  lastLogin?: string;
  provider?: string;
  photoURL?: string;
  status?: string;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  eventType:
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILED'
    | 'REGISTRATION'
    | 'PASSWORD_RESET_REQUEST'
    | 'PASSWORD_RESET_CONFIRM'
    | 'USERNAME_RECOVERY_REQUEST'
    | 'ADMIN_DISPATCH_RESET'
    | 'OAUTH_LOGIN'
    | 'OAUTH_REGISTER'
    | 'ACCOUNT_LOCKED';
  email: string;
  displayName?: string;
  role?: string;
  ipAddress: string;
  userAgent: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet' | 'Unknown';
  browser: string;
  os: string;
  status: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'PENDING';
  reason?: string;
  geoRegion?: string;
  restorationCode?: string;
}

export interface SecurityAuditSummary {
  totalEvents: number;
  successfulLogins: number;
  failedAttempts: number;
  passwordResets: number;
  lastAuditTimestamp: string;
}

export interface AnnouncementAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  authorEmail: string;
  authorName: string;
  authorRole: string;
  targetAudience: 'all' | 'heads' | 'admins' | 'teachers' | 'staff';
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
  attachments?: AnnouncementAttachment[];
  readBy?: string[];
}

export interface RealtimeBandwidthPoint {
  time: string;
  inboundKBps: number;
  outboundKBps: number;
  totalKBps: number;
  requestsPerSec: number;
  activeSockets: number;
}

export interface HourlyBandwidthTrend {
  hour: string;
  inboundMB: number;
  outboundMB: number;
  totalMB: number;
  requestCount: number;
  peakThroughputMBps: number;
}

export interface DailyStorageBandwidthTrend {
  date: string;
  storageUsedGB: number;
  bandwidthConsumedGB: number;
  activeStudents: number;
  auditEvents: number;
  syncTransactions: number;
}

export interface StorageCategoryBreakdown {
  id: string;
  name: string;
  category: string;
  sizeMB: number;
  sizeFormatted: string;
  percentOf1TB: number;
  percentOfUsed: number;
  itemCount: number;
  color: string;
}

export interface BackendStorageBandwidthTelemetry {
  storage: {
    totalCapacityGB: number;
    totalCapacityFormatted: string;
    totalUsedBytes: number;
    totalUsedGB: number;
    totalUsedMB: number;
    totalUsedFormatted: string;
    freeHeadroomGB: number;
    freeHeadroomFormatted: string;
    usedPercentage: number;
    freePercentage: number;
    compressionRatio: string;
    deduplicationSavingsMB: number;
    categories: StorageCategoryBreakdown[];
    growthRateMBPerDay: number;
    healthStatus: 'OPTIMAL' | 'ATTENTION' | 'CRITICAL';
  };
  bandwidth: {
    currentInboundKBps: number;
    currentOutboundKBps: number;
    currentTotalKBps: number;
    peakBandwidthMBps24h: number;
    totalTransferredTodayGB: number;
    totalTransferredMonthGB: number;
    activeNodesCount: number;
    averageLatencyMs: number;
    iopsCapacity: number;
    liveSlidingWindow: RealtimeBandwidthPoint[];
  };
  historicalTrends: {
    hourly24h: HourlyBandwidthTrend[];
    daily7d: DailyStorageBandwidthTrend[];
    monthly30d: DailyStorageBandwidthTrend[];
  };
  clusterInfo: {
    engineName: string;
    tier: string;
    storageEngine: string;
    activeNodes: Array<{ id: string; name: string; region: string; status: string; latencyMs: number; storageAllocatedGB: number }>;
  };
  generatedAt: string;
}

export interface BackendStats {
  totalStudents: number;
  totalCurriculum: number;
  totalTeacherMarks: number;
  totalPayments: number;
  totalUsers: number;
  totalAuditLogs: number;
  totalSecurityAudits?: number;
  databaseSizeBytes: number;
  databaseSizeFormatted: string;
  maxStorageCapacity: string;
  status: string;
  engine: string;
  activeNodesCount: number;
  connectedNodes?: Array<{
    id: string;
    userAgent: string;
    ip: string;
    connectedAt: string;
    userEmail: string;
  }>;
}

/**
 * Validates standard email address RFC 5322 compliance
 */
export function isStandardEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  if (clean.length < 6 || clean.length > 254) return false;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean)) return false;

  const parts = clean.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;

  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) return false;

  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

  return true;
}

const TOKEN_KEY = 'eduscore_tz_auth_token';
const USER_KEY = 'eduscore_tz_user_profile';

class BackendApiService {
  private token: string | null = null;
  private eventSource: EventSource | null = null;
  private syncListeners: Set<(event: string, data: any) => void> = new Set();
  private isConnected: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
      this.initRealtimeStream();
    }
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const tok = this.getToken();
    if (tok) {
      headers['Authorization'] = `Bearer ${tok}`;
    }
    return headers;
  }

  // --- Realtime Sync via Server-Sent Events ---
  public initRealtimeStream() {
    if (typeof window === 'undefined') return;
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource('/api/sync/stream');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.notifyListeners('connection_status', { connected: true });
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notifyListeners('connection_status', { connected: false });
      };

      // Custom events including login notifications & security alerts
      const eventNames = [
        'handshake',
        'ping',
        'doc_change',
        'batch_sync',
        'deduplicate_sync',
        'auth_change',
        'sync_pulse',
        'announcement_broadcast',
        'login_notification',
        'security_alert',
      ];
      eventNames.forEach((name) => {
        this.eventSource?.addEventListener(name, (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            this.notifyListeners(name, parsed);
          } catch {
            this.notifyListeners(name, e.data);
          }
        });
      });
    } catch (err) {
      console.warn('[BackendApi] EventSource init failed:', err);
    }
  }

  public subscribe(callback: (event: string, data: any) => void): () => void {
    this.syncListeners.add(callback);
    return () => {
      this.syncListeners.delete(callback);
    };
  }

  private notifyListeners(event: string, data: any) {
    this.syncListeners.forEach((cb) => {
      try {
        cb(event, data);
      } catch (err) {
        console.error('[BackendApi] Listener error:', err);
      }
    });
  }

  // --- Authentication ---

  public async login(email: string, password: string): Promise<{ user: AppUser; token: string }> {
    const cleanEmail = (email || '').trim();
    if (!isStandardEmail(cleanEmail)) {
      throw new Error('NON_STANDARD_EMAIL: Please enter a valid standard email address (e.g. user@domain.com or teacher@school.ac.tz).');
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email: cleanEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    this.setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  }

  public async register(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'teacher',
    institution: string = 'Jitegemee Secondary School'
  ): Promise<{ user: AppUser; token: string }> {
    const cleanEmail = (email || '').trim();
    if (!isStandardEmail(cleanEmail)) {
      throw new Error('NON_STANDARD_EMAIL: Please enter a valid standard email address (e.g. user@domain.com or teacher@school.ac.tz).');
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email: cleanEmail, password, displayName, role, institution }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    this.setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  }

  public async loginOAuth(
    provider: 'google' | 'yahoo' | 'demo',
    email: string,
    displayName?: string,
    photoURL?: string,
    role?: UserRole
  ): Promise<{ user: AppUser; token: string }> {
    const cleanEmail = (email || '').trim();
    if (!isStandardEmail(cleanEmail)) {
      throw new Error('NON_STANDARD_EMAIL: Please enter a valid standard email address.');
    }

    const res = await fetch('/api/auth/oauth', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ provider, email: cleanEmail, displayName, photoURL, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'OAuth login failed');
    }
    this.setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  }

  public async forgotPassword(email: string): Promise<{ success: boolean; message: string; restorationCode?: string; resetToken?: string }> {
    const cleanEmail = (email || '').trim();
    if (!isStandardEmail(cleanEmail)) {
      throw new Error('NON_STANDARD_EMAIL: Please enter a valid standard email address.');
    }

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email: cleanEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Password restoration request failed');
    }
    return data;
  }

  public async confirmPasswordReset(tokenOrCode: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/reset-password-confirm', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ tokenOrCode, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Password reset confirmation failed');
    }
    return data;
  }

  public async recoverUsername(identifier: string): Promise<{ success: boolean; message: string; matches: Array<{ email: string; displayName: string; role: string; institution: string }> }> {
    const res = await fetch('/api/auth/recover-username', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ identifier }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Username recovery failed');
    }
    return data;
  }

  public async adminDispatchReset(email: string): Promise<{ success: boolean; message: string; restorationCode?: string }> {
    const res = await fetch('/api/auth/admin-dispatch-reset', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Admin reset dispatch failed');
    }
    return data;
  }

  public async getSecurityAudit(): Promise<{ logs: SecurityAuditEvent[]; summary: SecurityAuditSummary }> {
    const res = await fetch('/api/auth/security-audit', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch security audit logs');
    }
    return res.json();
  }

  public async getMe(): Promise<{ user: AppUser } | null> {
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  public async updateUserRole(email: string, role: UserRole): Promise<{ success: boolean; user: AppUser }> {
    const res = await fetch('/api/auth/update-role', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update user role');
    }
    return data;
  }

  public async getAllUsers(): Promise<AppUser[]> {
    try {
      const res = await fetch('/api/auth/users', {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.users || [];
    } catch {
      return [];
    }
  }

  public logout() {
    this.setToken(null);
    localStorage.removeItem(USER_KEY);
    this.notifyListeners('auth_change', { action: 'LOGOUT' });
  }

  // --- Database & Statistics ---

  public async getStats(): Promise<BackendStats> {
    const res = await fetch('/api/db/stats', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch backend stats');
    }
    return res.json();
  }

  public async getBandwidthStorageMetrics(): Promise<BackendStorageBandwidthTelemetry> {
    const res = await fetch('/api/db/bandwidth-storage-metrics', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch bandwidth and storage telemetry metrics');
    }
    return res.json();
  }

  public async testBandwidthPulse(simulatedBytes: number = 2500000): Promise<{ success: boolean; simulatedBytes: number; telemetry: BackendStorageBandwidthTelemetry }> {
    const res = await fetch('/api/db/test-bandwidth-pulse', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ simulatedBytes }),
    });
    if (!res.ok) {
      throw new Error('Failed to trigger bandwidth test pulse');
    }
    return res.json();
  }

  public async broadcastSyncPulse(): Promise<{ success: boolean; dispatchedToNodes: number; timestamp: string }> {
    const res = await fetch('/api/sync/broadcast-pulse', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to dispatch instant sync pulse');
    }
    return res.json();
  }

  public async getCollection<T = any>(collection: string): Promise<T[]> {
    const res = await fetch(`/api/db/collections/${collection}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch collection ${collection}`);
    }
    const data = await res.json();
    return data.data || [];
  }

  public async setDocument<T = any>(collection: string, id: string, docData: T): Promise<T> {
    const res = await fetch(`/api/db/collections/${collection}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id, data: docData }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to save document');
    }
    return data.doc;
  }

  public async deleteDocument(collection: string, id: string): Promise<boolean> {
    const res = await fetch(`/api/db/collections/${collection}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    return data.success || false;
  }

  public async batchImport(collection: string, items: any[], mode: 'replace' | 'merge' = 'merge') {
    const res = await fetch('/api/db/batch-import', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ collection, items, mode }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Batch import failed');
    }
    return data;
  }

  public async deduplicate(collection: string) {
    const res = await fetch('/api/db/deduplicate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ collection }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Deduplication failed');
    }
    return data;
  }

  public async createBackup() {
    const res = await fetch('/api/db/backup', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  // --- Institutional Announcements & Circulars ---

  public async getAnnouncements(): Promise<AnnouncementItem[]> {
    try {
      const res = await fetch('/api/announcements', {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.announcements || [];
    } catch {
      return [];
    }
  }

  public async sendAnnouncement(payload: {
    title: string;
    content: string;
    targetAudience: 'all' | 'heads' | 'admins' | 'teachers' | 'staff';
    priority: 'normal' | 'important' | 'urgent';
    attachments?: AnnouncementAttachment[];
    authorEmail?: string;
    authorName?: string;
    authorRole?: string;
  }): Promise<{ success: boolean; announcement: AnnouncementItem }> {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to dispatch announcement');
    }
    return data;
  }

  public async deleteAnnouncement(id: string): Promise<boolean> {
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.ok;
  }

  // --- Convenience Alias Methods ---
  public async saveDocument<T = any>(collection: string, id: string, docData: T): Promise<T> {
    return this.setDocument(collection, id, docData);
  }

  public async getUsers(): Promise<AppUser[]> {
    return this.getAllUsers();
  }

  public async getSecurityAuditLogs(): Promise<{ logs: SecurityAuditEvent[]; summary: SecurityAuditSummary }> {
    return this.getSecurityAudit();
  }

  public async triggerBroadcastPulse(): Promise<{ success: boolean; dispatchedToNodes: number; timestamp: string }> {
    return this.broadcastSyncPulse();
  }

  public reconnectStream() {
    this.initRealtimeStream();
  }

  public async sendPasswordReset(email: string) {
    return this.forgotPassword(email);
  }

  public async loginWithEmail(email: string, password: string) {
    return this.login(email, password);
  }

  public async registerWithEmail(
    email: string,
    password: string,
    displayName: string,
    role: UserRole = 'teacher',
    institution: string = 'Jitegemee Secondary School'
  ) {
    return this.register(email, password, displayName, role, institution);
  }

  public async loginWithOAuth(
    provider: 'google' | 'yahoo' | 'demo',
    email: string,
    displayName?: string,
    photoURL?: string,
    role?: UserRole
  ) {
    return this.loginOAuth(provider, email, displayName, photoURL, role);
  }

  public async loginDemo(role: UserRole = 'teacher') {
    return this.loginOAuth('demo', `${role}@demo.school.ac.tz`, `Demo ${role}`, undefined, role);
  }
}

export const backendApi = new BackendApiService();

