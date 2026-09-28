import { Response } from "express";

interface ConnectedClient {
  id: string;
  res: Response;
  userAgent: string;
  ip: string;
  connectedAt: string;
  userEmail?: string;
}

class RealtimeSyncManager {
  private clients: Map<string, ConnectedClient> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.broadcast("ping", { timestamp: new Date().toISOString(), activeNodes: this.clients.size });
    }, 15000);
  }

  public registerClient(id: string, res: Response, userAgent: string = "", ip: string = "", userEmail?: string) {
    this.clients.set(id, {
      id,
      res,
      userAgent,
      ip,
      connectedAt: new Date().toISOString(),
      userEmail,
    });

    // Send initial handshake
    res.write(`event: handshake\ndata: ${JSON.stringify({ clientId: id, status: "CONNECTED_TO_INBUILT_BACKEND", activeNodes: this.clients.size })}\n\n`);
  }

  public removeClient(id: string) {
    this.clients.delete(id);
  }

  public broadcast(event: string, payload: any) {
    const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const [clientId, client] of this.clients.entries()) {
      try {
        client.res.write(data);
      } catch (err) {
        console.warn(`[SyncManager] Failed to write to client ${clientId}, removing:`, err);
        this.clients.delete(clientId);
      }
    }
  }

  public getConnectedClients() {
    return Array.from(this.clients.values()).map((c) => ({
      id: c.id,
      userAgent: c.userAgent,
      ip: c.ip,
      connectedAt: c.connectedAt,
      userEmail: c.userEmail || "Anonymous Guest",
    }));
  }

  public getActiveClientCount(): number {
    return this.clients.size;
  }
}

export const syncManager = new RealtimeSyncManager();
