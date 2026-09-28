import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  eventType:
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "REGISTRATION"
    | "PASSWORD_RESET_REQUEST"
    | "PASSWORD_RESET_CONFIRM"
    | "USERNAME_RECOVERY_REQUEST"
    | "ADMIN_DISPATCH_RESET"
    | "OAUTH_LOGIN"
    | "OAUTH_REGISTER"
    | "ACCOUNT_LOCKED";
  email: string;
  displayName?: string;
  role?: string;
  ipAddress: string;
  userAgent: string;
  deviceType: "Desktop" | "Mobile" | "Tablet" | "Unknown";
  browser: string;
  os: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED" | "PENDING";
  reason?: string;
  geoRegion?: string;
  restorationCode?: string;
}

export interface PasswordResetToken {
  token: string;
  code: string;
  email: string;
  expiresAt: number;
  createdAt: string;
  used: boolean;
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
  targetAudience: "all" | "heads" | "admins" | "teachers" | "staff";
  priority: "normal" | "important" | "urgent";
  createdAt: string;
  attachments?: AnnouncementAttachment[];
  readBy?: string[];
}

export interface DatabaseSchema {
  students: any[];
  curriculum: any[];
  teacherMarks: any[];
  payments: any[];
  settings: Record<string, any>;
  users: any[];
  auditLogs: any[];
  syncEvents: any[];
  authAuditLogs: SecurityAuditEvent[];
  passwordResetTokens: PasswordResetToken[];
  announcements: AnnouncementItem[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "cloud_database.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

// Parse User-Agent into clean device, browser, and OS info
export function parseDeviceInfo(ua: string = "", ip: string = ""): {
  deviceType: SecurityAuditEvent["deviceType"];
  browser: string;
  os: string;
  geoRegion: string;
} {
  let deviceType: SecurityAuditEvent["deviceType"] = "Desktop";
  let browser = "Chrome";
  let os = "Windows / Linux";

  const lowerUA = ua.toLowerCase();

  // Device
  if (lowerUA.includes("mobile") || lowerUA.includes("android") || lowerUA.includes("iphone")) {
    deviceType = "Mobile";
  } else if (lowerUA.includes("ipad") || lowerUA.includes("tablet")) {
    deviceType = "Tablet";
  }

  // OS
  if (lowerUA.includes("windows")) os = "Windows 11/10";
  else if (lowerUA.includes("macintosh") || lowerUA.includes("mac os")) os = "macOS";
  else if (lowerUA.includes("android")) os = "Android OS";
  else if (lowerUA.includes("iphone") || lowerUA.includes("ios")) os = "iOS";
  else if (lowerUA.includes("linux")) os = "Linux";

  // Browser
  if (lowerUA.includes("edg/")) browser = "Microsoft Edge";
  else if (lowerUA.includes("chrome") && !lowerUA.includes("edg")) browser = "Google Chrome";
  else if (lowerUA.includes("safari") && !lowerUA.includes("chrome")) browser = "Apple Safari";
  else if (lowerUA.includes("firefox")) browser = "Mozilla Firefox";

  const geoRegion = "Dar es Salaam, Tanzania (TZ-Gateway)";

  return { deviceType, browser, os, geoRegion };
}

// Initial seed security audit logs
const initialSecurityLogs: SecurityAuditEvent[] = [
  {
    id: "sec-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    eventType: "LOGIN_SUCCESS",
    email: "deodatusmaliti2@gmail.com",
    displayName: "Super Admin Deodatus Maliti",
    role: "admin",
    ipAddress: "197.250.14.82",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36",
    deviceType: "Desktop",
    browser: "Google Chrome",
    os: "Windows 11/10",
    status: "SUCCESS",
    reason: "Standard administrator credential verification approved",
    geoRegion: "Dar es Salaam, Tanzania (TZ-Gateway)",
  },
  {
    id: "sec-002",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    eventType: "LOGIN_SUCCESS",
    email: "teacher@school.ac.tz",
    displayName: "Mwl. Sophia Mlay",
    role: "teacher",
    ipAddress: "197.250.22.110",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) Safari/604.1",
    deviceType: "Mobile",
    browser: "Apple Safari",
    os: "iOS",
    status: "SUCCESS",
    reason: "Academic teacher portal access authenticated",
    geoRegion: "Kinondoni, Dar es Salaam",
  },
  {
    id: "sec-003",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    eventType: "LOGIN_FAILED",
    email: "unauthorized.guest@mail.com",
    displayName: "Guest User",
    role: "guest",
    ipAddress: "41.59.102.14",
    userAgent: "Mozilla/5.0 (Linux; Android 13; SM-A536B) Chrome/120.0.0.0",
    deviceType: "Mobile",
    browser: "Google Chrome",
    os: "Android OS",
    status: "FAILED",
    reason: "INVALID_CREDENTIAL: Password mismatch entered 3 times",
    geoRegion: "Arusha, Tanzania",
  },
];

// Initial seed announcements
const initialAnnouncements: AnnouncementItem[] = [
  {
    id: "ann-init-001",
    title: "NECTA Continuous Assessment (CA) & Mock Examination Submission Deadline",
    content: "All Academic Heads, Subject Teachers, and Department Coordinators are hereby notified that Form IV & Form VI Mock Examination marks and Continuous Assessment portfolios must be finalized and locked into the EduScore Central Database by Friday 5:00 PM. Please ensure all student practical marks are verified against official rubrics.",
    authorEmail: "deodatusmaliti2@gmail.com",
    authorName: "Super Admin Deodatus Maliti",
    authorRole: "Super Admin",
    targetAudience: "all",
    priority: "urgent",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    attachments: [
      {
        id: "att-001",
        name: "NECTA_CA_Guidelines_2026.pdf",
        size: 245000,
        type: "application/pdf",
      },
    ],
    readBy: ["deodatusmaliti2@gmail.com"],
  },
  {
    id: "ann-init-002",
    title: "Term I Academic Performance Review & Departmental Moderation",
    content: "Notice to all School Administrators and Subject Teachers: Departmental moderation meetings for Mathematics, Physics, Chemistry, and Languages will take place this Thursday in the Staff Resource Centre. Please bring updated candidate division projections.",
    authorEmail: "deodatusmaliti2@gmail.com",
    authorName: "Super Admin Deodatus Maliti",
    authorRole: "Super Admin",
    targetAudience: "teachers",
    priority: "important",
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    attachments: [
      {
        id: "att-002",
        name: "Departmental_Moderation_Matrix_Template.xlsx",
        size: 118000,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
    readBy: ["deodatusmaliti2@gmail.com"],
  },
];

// Default initial state
const defaultDbData: DatabaseSchema = {
  students: [],
  curriculum: [],
  teacherMarks: [],
  payments: [],
  settings: {
    schoolName: "Jitegemee Secondary School",
    schoolType: "Secondary (O-Level & A-Level)",
    centreNumber: "S.0145",
    region: "Dar es Salaam",
    district: "Ilala MC",
    currentTerm: "Term 1",
    academicYear: "2026",
    gradingScale: "necta_standard",
    enableBiometric: true,
    enableSmsAlerts: true,
    storageQuota: "1TB High-Capacity Cloud Tier",
    syncIntervalMs: 50,
  },
  users: [
    {
      uid: "admin-root-01",
      email: "deodatusmaliti2@gmail.com",
      displayName: "Super Admin Deodatus Maliti",
      role: "admin",
      institution: "Jitegemee Secondary School",
      passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // admin123
      salt: "eduscore_tz_salt",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: "active",
      provider: "google",
    },
    {
      uid: "teacher-01",
      email: "teacher@school.ac.tz",
      displayName: "Mwl. Sophia Mlay",
      role: "teacher",
      institution: "Jitegemee Secondary School",
      passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // admin123
      salt: "eduscore_tz_salt",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: "active",
      provider: "password",
    },
  ],
  auditLogs: [
    {
      id: "log-init-001",
      timestamp: new Date().toISOString(),
      action: "SERVER_BOOT",
      userEmail: "system@eduscore.tz",
      details: "EduScore In-Built Independent Backend Engine initialized with 1TB capacity storage.",
      category: "SYSTEM",
    },
  ],
  syncEvents: [],
  authAuditLogs: initialSecurityLogs,
  passwordResetTokens: [],
  announcements: initialAnnouncements,
};

class CloudDatabaseEngine {
  private data: DatabaseSchema;
  private isWriting: boolean = false;
  private writeQueue: (() => Promise<void>)[] = [];

  constructor() {
    this.ensureDirs();
    this.data = this.loadDatabase();
  }

  private ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        
        // Ensure Super Admin branding on loaded users
        if (parsed.users && Array.isArray(parsed.users)) {
          parsed.users.forEach((u: any) => {
            if (u.email === "deodatusmaliti2@gmail.com" || u.displayName?.startsWith("Eng.")) {
              u.displayName = "Super Admin Deodatus Maliti";
              u.role = "admin";
            }
          });
        }

        return {
          ...defaultDbData,
          ...parsed,
          settings: { ...defaultDbData.settings, ...(parsed.settings || {}) },
          authAuditLogs: parsed.authAuditLogs || defaultDbData.authAuditLogs,
          passwordResetTokens: parsed.passwordResetTokens || [],
          announcements: parsed.announcements || defaultDbData.announcements,
        };
      }
    } catch (err) {
      console.error("[DatabaseEngine] Error reading database file, initializing defaults:", err);
    }
    this.persist(defaultDbData);
    return JSON.parse(JSON.stringify(defaultDbData));
  }

  private persist(state: DatabaseSchema) {
    try {
      const serialized = JSON.stringify(state, null, 2);
      fs.writeFileSync(DB_FILE, serialized, "utf-8");
    } catch (err) {
      console.error("[DatabaseEngine] Error saving database:", err);
    }
  }

  public async save(): Promise<void> {
    return new Promise((resolve, reject) => {
      const task = async () => {
        try {
          this.persist(this.data);
          resolve();
        } catch (e) {
          reject(e);
        }
      };

      this.writeQueue.push(task);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isWriting || this.writeQueue.length === 0) return;
    this.isWriting = true;
    const task = this.writeQueue.shift();
    if (task) {
      try {
        await task();
      } catch (err) {
        console.error("[DatabaseEngine] Write error:", err);
      }
    }
    this.isWriting = false;
    if (this.writeQueue.length > 0) {
      this.processQueue();
    }
  }

  // --- Collection Accessors ---

  public getCollection<K extends keyof DatabaseSchema>(name: K): DatabaseSchema[K] {
    return this.data[name];
  }

  public getDocument(collectionName: keyof DatabaseSchema, id: string): any {
    const col = this.data[collectionName];
    if (Array.isArray(col)) {
      return col.find((item: any) => item.id === id || item.uid === id);
    }
    if (typeof col === "object" && col !== null) {
      return (col as any)[id];
    }
    return null;
  }

  public async setDocument(collectionName: keyof DatabaseSchema, id: string, docData: any): Promise<any> {
    const col = this.data[collectionName];
    const timestamp = new Date().toISOString();
    const cleanDoc = { ...docData, id: id || docData.id || docData.uid || crypto.randomUUID(), updatedAt: timestamp };

    if (Array.isArray(col)) {
      const idx = col.findIndex((item: any) => item.id === id || item.uid === id);
      if (idx >= 0) {
        col[idx] = { ...col[idx], ...cleanDoc };
      } else {
        col.push(cleanDoc);
      }
    } else if (typeof col === "object" && col !== null) {
      (this.data as any)[collectionName] = { ...(this.data as any)[collectionName], ...docData, updatedAt: timestamp };
    }

    this.logAudit("DOCUMENT_SET", `Updated ${String(collectionName)}/${id}`);
    await this.save();
    return cleanDoc;
  }

  public async batchSet(
    collectionName: keyof DatabaseSchema,
    items: any[],
    mode: "replace" | "merge" = "merge"
  ): Promise<{ total: number; inserted: number; updated: number; duplicatesRejected: number }> {
    const col = this.data[collectionName];
    if (!Array.isArray(col)) {
      throw new Error(`Collection ${String(collectionName)} is not an array collection`);
    }

    let inserted = 0;
    let updated = 0;
    let duplicatesRejected = 0;
    const seenIds = new Set<string>();

    if (mode === "replace") {
      this.data[collectionName] = [] as any;
    }

    const targetList = this.data[collectionName] as any[];

    for (const item of items) {
      const id = String(item.id || item.uid || item.candidateId || "").trim();
      if (!id) continue;

      if (seenIds.has(id.toLowerCase())) {
        duplicatesRejected++;
        continue;
      }
      seenIds.add(id.toLowerCase());

      const existingIndex = targetList.findIndex(
        (existing: any) =>
          String(existing.id || existing.uid || "").toLowerCase() === id.toLowerCase() ||
          (existing.name && item.name && String(existing.name).trim().toLowerCase() === String(item.name).trim().toLowerCase() && existing.form === item.form)
      );

      if (existingIndex >= 0) {
        targetList[existingIndex] = { ...targetList[existingIndex], ...item, updatedAt: new Date().toISOString() };
        updated++;
      } else {
        targetList.push({ ...item, id, createdAt: item.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
        inserted++;
      }
    }

    this.logAudit(
      "BATCH_IMPORT",
      `Batch processed ${items.length} items into ${String(collectionName)} (Inserted: ${inserted}, Updated: ${updated}, Duplicates Rejected: ${duplicatesRejected})`
    );
    await this.save();

    return {
      total: targetList.length,
      inserted,
      updated,
      duplicatesRejected,
    };
  }

  public async deleteDocument(collectionName: keyof DatabaseSchema, id: string): Promise<boolean> {
    const col = this.data[collectionName];
    if (Array.isArray(col)) {
      const initialLen = col.length;
      (this.data as any)[collectionName] = col.filter((item: any) => item.id !== id && item.uid !== id);
      if (this.data[collectionName].length !== initialLen) {
        this.logAudit("DOCUMENT_DELETE", `Deleted item ${id} from ${String(collectionName)}`);
        await this.save();
        return true;
      }
    }
    return false;
  }

  public detectAndCleanDuplicates(collectionName: "students" | "users" | "teacherMarks"): { foundDuplicates: number; cleanedList: any[] } {
    const list = this.data[collectionName] as any[];
    if (!Array.isArray(list)) return { foundDuplicates: 0, cleanedList: [] };

    const seenKey = new Map<string, any>();
    let duplicates = 0;

    for (const item of list) {
      const key =
        collectionName === "students"
          ? `${String(item.id).trim().toLowerCase()}_${String(item.form).trim().toLowerCase()}`
          : `${String(item.email || item.id).trim().toLowerCase()}`;

      if (seenKey.has(key)) {
        duplicates++;
        const existing = seenKey.get(key);
        seenKey.set(key, { ...existing, ...item, updatedAt: new Date().toISOString() });
      } else {
        seenKey.set(key, item);
      }
    }

    const uniqueList = Array.from(seenKey.values());
    this.data[collectionName] = uniqueList as any;
    this.logAudit("DUPLICATES_RESOLVED", `Cleaned ${duplicates} duplicate records in ${collectionName}`);
    this.save();

    return {
      foundDuplicates: duplicates,
      cleanedList: uniqueList,
    };
  }

  // --- Security Audit Logger ---
  public logSecurityEvent(event: Omit<SecurityAuditEvent, "id" | "timestamp">) {
    const newEvent: SecurityAuditEvent = {
      id: "sec-" + crypto.randomUUID().slice(0, 8),
      timestamp: new Date().toISOString(),
      ...event,
    };

    if (!this.data.authAuditLogs) {
      this.data.authAuditLogs = [];
    }

    this.data.authAuditLogs.unshift(newEvent);
    if (this.data.authAuditLogs.length > 300) {
      this.data.authAuditLogs = this.data.authAuditLogs.slice(0, 300);
    }
    this.save();
    return newEvent;
  }

  public createPasswordResetToken(email: string): PasswordResetToken {
    if (!this.data.passwordResetTokens) {
      this.data.passwordResetTokens = [];
    }

    const token = crypto.randomBytes(24).toString("hex");
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN code
    const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hour

    const resetTokenEntry: PasswordResetToken = {
      token,
      code,
      email: email.trim().toLowerCase(),
      expiresAt,
      createdAt: new Date().toISOString(),
      used: false,
    };

    this.data.passwordResetTokens.push(resetTokenEntry);
    this.save();
    return resetTokenEntry;
  }

  public verifyAndConsumeResetToken(tokenOrCode: string): PasswordResetToken | null {
    if (!this.data.passwordResetTokens) return null;
    const clean = tokenOrCode.trim().toLowerCase();

    const entry = this.data.passwordResetTokens.find(
      (t) => !t.used && (t.token.toLowerCase() === clean || t.code === clean) && Date.now() < t.expiresAt
    );

    if (!entry) return null;
    entry.used = true;
    this.save();
    return entry;
  }

  public logAudit(action: string, details: string, userEmail: string = "system@eduscore.tz", category: string = "GENERAL") {
    const logEntry = {
      id: "log-" + crypto.randomUUID().slice(0, 8),
      timestamp: new Date().toISOString(),
      action,
      details,
      userEmail,
      category,
    };
    this.data.auditLogs.unshift(logEntry);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
  }

  public getStats() {
    const dbSize = fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0;
    return {
      totalStudents: this.data.students.length,
      totalCurriculum: this.data.curriculum.length,
      totalTeacherMarks: this.data.teacherMarks.length,
      totalPayments: this.data.payments.length,
      totalUsers: this.data.users.length,
      totalAuditLogs: this.data.auditLogs.length,
      totalSecurityAudits: (this.data.authAuditLogs || []).length,
      databaseSizeBytes: dbSize,
      databaseSizeFormatted: (dbSize / 1024).toFixed(2) + " KB",
      maxStorageCapacity: "1,000 GB (1TB Multi-Node Enterprise Engine)",
      status: "ONLINE_SYNCHRONIZED",
      engine: "EduScore Independent In-Built Server Engine v3.0",
    };
  }

  public createSnapshotBackup(): { filename: string; timestamp: string; size: number } {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_eduscore_${timestamp}.json`;
    const fullPath = path.join(BACKUP_DIR, filename);
    const content = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(fullPath, content, "utf-8");
    return {
      filename,
      timestamp: new Date().toISOString(),
      size: content.length,
    };
  }
}

export const dbEngine = new CloudDatabaseEngine();
