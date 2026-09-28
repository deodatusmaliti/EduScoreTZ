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

      // Custom events
      const eventNames = ['handshake', 'ping', 'doc_change', 'batch_sync', 'deduplicate_sync', 'auth_change', 'sync_pulse', 'announcement_broadcast'];
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

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public reconnectStream() {
    this.initRealtimeStream();
  }

  // --- Auth Methods ---
  public async loginWithEmail(email: string, pass: string): Promise<{ user: AppUser; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    this.setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  }

  public async registerWithEmail(
    email: string,
    pass: string,
    displayName: string,
    role: AppUser['role'] = 'teacher',
    institution: string = 'Jitegemee Secondary School'
  ): Promise<{ user: AppUser; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, displayName, role, institution }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    this.setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  }

  public async loginWithOAuth(
    provider: 'google' | 'yahoo' | 'demo',
    email: string,
    displayName?: string,
    photoURL?: string,
    role?: UserRole
  ): Promise<{ user: AppUser; token: string }> {
    const res = await fetch('/api/auth/oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, email, displayName, photoURL, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `${provider} login failed`);
    }
    this.setToken(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  }

  public async loginDemo(role: UserRole): Promise<{ user: AppUser; token: string }> {
    const roleNames: Record<UserRole, { name: string; email: string }> = {
      admin: { name: 'Mwl. Peter Masanja (Principal)', email: 'principal@jitegemee.ac.tz' },
      headteacher: { name: 'Mwl. Grace Mtenga (Academic Head)', email: 'academic@jitegemee.ac.tz' },
      teacher: { name: 'Mwl. Josephat Kimaro (Science Dept)', email: 'jkimaro@jitegemee.ac.tz' },
      parent: { name: 'Bw. Hassan Rashid (Parent)', email: 'hrashid@gmail.com' },
      inspector: { name: 'Dr. Neema Mushi (District Inspector)', email: 'inspector@moe.go.tz' },
    };
    const demo = roleNames[role] || roleNames.teacher;
    return this.loginWithOAuth('demo', demo.email, demo.name, undefined, role);
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

  public async sendPasswordReset(email: string): Promise<{ success: boolean; message: string; restorationCode?: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Password reset request failed');
    }
    return data;
  }

  public async confirmPasswordReset(tokenOrCode: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/reset-password-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenOrCode, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to confirm password reset');
    }
    return data;
  }

  public async recoverUsername(identifier: string): Promise<{
    success: boolean;
    message: string;
    matches: Array<{ email: string; displayName: string; role: string; institution: string }>;
  }> {
    const res = await fetch('/api/auth/recover-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    return res.json();
  }

  public async getSecurityAuditLogs(): Promise<{ logs: SecurityAuditEvent[]; summary: SecurityAuditSummary }> {
    const res = await fetch('/api/auth/security-audit', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to load security audit logs');
    }
    return res.json();
  }

  public async getMe(): Promise<AppUser | null> {
    const tok = this.getToken();
    if (!tok) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  }

  public async getUsers(): Promise<AppUser[]> {
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

  public async triggerBroadcastPulse(): Promise<{ success: boolean; dispatchedToNodes: number; timestamp: string; authority: string }> {
    const res = await fetch('/api/sync/broadcast-pulse', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  // --- Database Operations ---

  public async getStats(): Promise<BackendStats> {
    const res = await fetch('/api/db/stats', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch backend stats');
    }
    return res.json();
  }

  public async getCollection<T = any>(collectionName: string): Promise<T> {
    const res = await fetch(`/api/db/collections/${collectionName}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load collection ${collectionName}`);
    }
    const data = await res.json();
    return data.data;
  }

  public async saveDocument<T = any>(collectionName: string, id: string, docData: T): Promise<T> {
    const res = await fetch(`/api/db/collections/${collectionName}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ id, data: docData }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to save document');
    }
    return json.doc;
  }

  public async deleteDocument(collectionName: string, id: string): Promise<boolean> {
    const res = await fetch(`/api/db/collections/${collectionName}/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const json = await res.json();
    return json.success;
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

  public async deduplicate(collection: 'students' | 'users' | 'teacherMarks') {
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
}

export const backendApi = new BackendApiService();
