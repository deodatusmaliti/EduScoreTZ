import { Router, Request, Response } from "express";
import crypto from "crypto";
import { dbEngine, DatabaseSchema } from "./db";
import {
  authenticateWithPassword,
  authenticateWithOAuth,
  registerUser,
  verifyToken,
  findUserByEmail,
  requestPasswordRestoration,
  confirmPasswordRestoration,
  requestUsernameRestoration,
  sanitizeUser,
} from "./auth";
import { syncManager } from "./sync";

export const apiRouter = Router();

// Middleware to extract user from token if present
function authMiddleware(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (user) {
      (req as any).user = user;
    }
  }
  next();
}

apiRouter.use(authMiddleware);

// --- SSE Realtime Stream ---
apiRouter.get("/sync/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const clientId = "client-" + crypto.randomUUID().slice(0, 8);
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
  const userEmail = (req as any).user?.email;

  syncManager.registerClient(clientId, res, userAgent, ip, userEmail);

  req.on("close", () => {
    syncManager.removeClient(clientId);
  });
});

apiRouter.post("/sync/broadcast-pulse", (req: Request, res: Response) => {
  const userEmail = (req as any).user?.email || "system@eduscore.tz";
  const timestamp = new Date().toISOString();
  const activeNodes = syncManager.getActiveClientCount();

  syncManager.broadcast("sync_pulse", {
    type: "INSTANT_AUTHORITY_DISPATCH",
    originUser: userEmail,
    timestamp,
    activeNodes,
    message: "Instant real-time authoritative state synchronization dispatched across all remote browser nodes.",
  });

  return res.json({
    success: true,
    dispatchedToNodes: activeNodes,
    timestamp,
    authority: "EduScore In-Built Independent Backend",
  });
});

// --- Auth Endpoints ---

apiRouter.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role, institution } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const result = await registerUser(email, password, displayName, role, institution, ip, userAgent);
    syncManager.broadcast("auth_change", { action: "REGISTER", email, timestamp: new Date().toISOString() });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Registration failed" });
  }
});

apiRouter.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const result = await authenticateWithPassword(email, password, ip, userAgent);
    syncManager.broadcast("auth_change", { action: "LOGIN", email, timestamp: new Date().toISOString() });
    return res.json(result);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || "Authentication failed" });
  }
});

apiRouter.post("/auth/oauth", async (req: Request, res: Response) => {
  try {
    const { provider, email, displayName, photoURL, role } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    if (!provider || !email) {
      return res.status(400).json({ error: "Provider and email are required" });
    }
    const result = await authenticateWithOAuth(provider, email, displayName, photoURL, ip, userAgent, role);
    syncManager.broadcast("auth_change", { action: "LOGIN", email, provider, role: result.user.role, timestamp: new Date().toISOString() });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "OAuth login failed" });
  }
});

// --- Password & Username Restoration Protocols ---

apiRouter.post("/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    if (!email) return res.status(400).json({ error: "Email is required" });

    const result = await requestPasswordRestoration(email, ip, userAgent);
    syncManager.broadcast("auth_change", { action: "PASSWORD_RESET_DISPATCH", email, timestamp: new Date().toISOString() });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Password restoration request failed" });
  }
});

apiRouter.post("/auth/reset-password-confirm", async (req: Request, res: Response) => {
  try {
    const { tokenOrCode, newPassword } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    if (!tokenOrCode || !newPassword) {
      return res.status(400).json({ error: "Restoration PIN/Token and new password are required" });
    }

    const result = await confirmPasswordRestoration(tokenOrCode, newPassword, ip, userAgent);
    syncManager.broadcast("auth_change", { action: "PASSWORD_RESET_SUCCESS", timestamp: new Date().toISOString() });
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to confirm password reset" });
  }
});

apiRouter.post("/auth/recover-username", async (req: Request, res: Response) => {
  try {
    const { identifier } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    if (!identifier) {
      return res.status(400).json({ error: "Search identifier (name, email, institution) is required" });
    }

    const result = await requestUsernameRestoration(identifier, ip, userAgent);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Username recovery lookup failed" });
  }
});

apiRouter.post("/auth/admin-dispatch-reset", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "";

    if (!email) return res.status(400).json({ error: "Target email required" });

    const result = await requestPasswordRestoration(email, ip, userAgent);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Admin reset dispatch failed" });
  }
});

// --- Security Audit Logs Endpoint ---

apiRouter.get("/auth/security-audit", (req: Request, res: Response) => {
  const logs = dbEngine.getCollection("authAuditLogs") || [];
  const successfulLogins = logs.filter((l: any) => l.eventType === "LOGIN_SUCCESS" || l.eventType === "OAUTH_LOGIN").length;
  const failedAttempts = logs.filter((l: any) => l.status === "FAILED").length;
  const passwordResets = logs.filter((l: any) => l.eventType === "PASSWORD_RESET_REQUEST" || l.eventType === "PASSWORD_RESET_CONFIRM").length;

  return res.json({
    logs,
    summary: {
      totalEvents: logs.length,
      successfulLogins,
      failedAttempts,
      passwordResets,
      lastAuditTimestamp: logs[0]?.timestamp || new Date().toISOString(),
    },
  });
});

apiRouter.get("/auth/me", (req: Request, res: Response) => {
  const tokenUser = (req as any).user;
  if (!tokenUser) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const freshUser = findUserByEmail(tokenUser.email);
  if (freshUser) {
    return res.json({ user: sanitizeUser(freshUser) });
  }
  return res.json({ user: tokenUser });
});

apiRouter.post("/auth/update-role", async (req: Request, res: Response) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: "Email and new role are required" });
    }
    const users = dbEngine.getCollection("users") as any[];
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: "User not found in authoritative database" });
    }
    user.role = role;
    await dbEngine.save();

    const sanitized = sanitizeUser(user);
    // Broadcast live role update to all connected browser sessions
    syncManager.broadcast("auth_change", {
      action: "ROLE_UPDATE",
      email: user.email,
      role: user.role,
      user: sanitized,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, user: sanitized });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to update role" });
  }
});

apiRouter.get("/auth/users", (req: Request, res: Response) => {
  const users = (dbEngine.getCollection("users") as any[]).map(sanitizeUser);
  return res.json({ users });
});

// --- Database & Collection Endpoints ---

apiRouter.get("/db/stats", (req: Request, res: Response) => {
  const stats = dbEngine.getStats();
  const connectedNodes = syncManager.getConnectedClients();
  return res.json({
    ...stats,
    activeNodesCount: syncManager.getActiveClientCount(),
    connectedNodes,
  });
});

apiRouter.get("/db/collections/:collection", (req: Request, res: Response) => {
  const colName = req.params.collection as keyof DatabaseSchema;
  const data = dbEngine.getCollection(colName);
  if (data === undefined) {
    return res.status(404).json({ error: `Collection ${colName} not found` });
  }
  return res.json({ collection: colName, data });
});

apiRouter.post("/db/collections/:collection", async (req: Request, res: Response) => {
  try {
    const colName = req.params.collection as keyof DatabaseSchema;
    const { id, data } = req.body;
    const userEmail = (req as any).user?.email || "system@eduscore.tz";

    const savedDoc = await dbEngine.setDocument(colName, id, data);
    syncManager.broadcast("doc_change", {
      collection: colName,
      action: "SET",
      id: savedDoc.id,
      doc: savedDoc,
      updatedBy: userEmail,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, doc: savedDoc });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to save document" });
  }
});

apiRouter.delete("/db/collections/:collection/:id", async (req: Request, res: Response) => {
  try {
    const colName = req.params.collection as keyof DatabaseSchema;
    const id = req.params.id;
    const deleted = await dbEngine.deleteDocument(colName, id);

    if (deleted) {
      syncManager.broadcast("doc_change", {
        collection: colName,
        action: "DELETE",
        id,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({ success: deleted });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to delete document" });
  }
});

apiRouter.post("/db/batch-import", async (req: Request, res: Response) => {
  try {
    const { collection, items, mode } = req.body;
    if (!collection || !Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid batch payload: 'collection' and 'items' array required" });
    }

    const result = await dbEngine.batchSet(collection as keyof DatabaseSchema, items, mode || "merge");
    syncManager.broadcast("batch_sync", {
      collection,
      total: result.total,
      inserted: result.inserted,
      updated: result.updated,
      duplicatesRejected: result.duplicatesRejected,
      timestamp: new Date().toISOString(),
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Batch import failed" });
  }
});

apiRouter.post("/db/deduplicate", (req: Request, res: Response) => {
  try {
    const { collection } = req.body;
    const target = (collection || "students") as "students" | "users" | "teacherMarks";
    const result = dbEngine.detectAndCleanDuplicates(target);

    syncManager.broadcast("deduplicate_sync", {
      collection: target,
      cleanedCount: result.foundDuplicates,
      total: result.cleanedList.length,
      timestamp: new Date().toISOString(),
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Deduplication failed" });
  }
});

apiRouter.post("/db/backup", (req: Request, res: Response) => {
  try {
    const backup = dbEngine.createSnapshotBackup();
    return res.json({ success: true, backup });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Backup snapshot creation failed" });
  }
});

// --- Institutional Announcements & Circulars Endpoints ---

apiRouter.get("/announcements", (req: Request, res: Response) => {
  try {
    const announcements = dbEngine.getCollection("announcements") || [];
    return res.json({ announcements });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to load announcements" });
  }
});

apiRouter.post("/announcements", async (req: Request, res: Response) => {
  try {
    const { title, content, targetAudience, priority, attachments, authorEmail, authorName, authorRole } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and announcement content are required" });
    }

    const announcements = dbEngine.getCollection("announcements") as any[];
    const newAnnouncement = {
      id: "ann-" + crypto.randomUUID().slice(0, 8),
      title: title.trim(),
      content: content.trim(),
      authorEmail: authorEmail || (req as any).user?.email || "deodatusmaliti2@gmail.com",
      authorName: authorName || (req as any).user?.displayName || "Super Admin Deodatus Maliti",
      authorRole: authorRole || (req as any).user?.role || "Super Admin",
      targetAudience: targetAudience || "all",
      priority: priority || "normal",
      createdAt: new Date().toISOString(),
      attachments: attachments || [],
      readBy: [(req as any).user?.email || "deodatusmaliti2@gmail.com"],
    };

    announcements.unshift(newAnnouncement);
    await dbEngine.save();

    // Broadcast announcement in real time to all connected faculty, heads, and teacher nodes
    syncManager.broadcast("announcement_broadcast", {
      announcement: newAnnouncement,
      action: "NEW_ANNOUNCEMENT",
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, announcement: newAnnouncement });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to broadcast announcement" });
  }
});

apiRouter.delete("/announcements/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const announcements = dbEngine.getCollection("announcements") as any[];
    const idx = announcements.findIndex((a) => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    const removed = announcements.splice(idx, 1)[0];
    await dbEngine.save();

    syncManager.broadcast("announcement_broadcast", {
      action: "DELETE_ANNOUNCEMENT",
      id,
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, removed });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Failed to remove announcement" });
  }
});
