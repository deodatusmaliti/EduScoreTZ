import crypto from "crypto";
import { dbEngine, parseDeviceInfo } from "./db";

const SECRET_SALT = "eduscore_tz_secure_secret_2026";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "headteacher" | "teacher" | "parent" | "inspector";
  institution: string;
  passwordHash?: string;
  salt?: string;
  createdAt: string;
  lastLogin: string;
  status: "active" | "inactive";
  provider: "password" | "google" | "yahoo" | "demo";
  photoURL?: string;
}

export function hashPassword(password: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(password).digest("hex");
}

export function generateToken(user: AppUser): string {
  const payload = {
    uid: user.uid,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    institution: user.institution,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
  };
  const str = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", SECRET_SALT).update(str).digest("hex");
  return Buffer.from(str).toString("base64") + "." + signature;
}

export function verifyToken(token: string): AppUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [b64, signature] = parts;
    const str = Buffer.from(b64, "base64").toString("utf-8");
    const expectedSig = crypto.createHmac("sha256", SECRET_SALT).update(str).digest("hex");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(str);
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function findUserByEmail(email: string): AppUser | null {
  const users = dbEngine.getCollection("users") as AppUser[];
  return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
}

export function findUsersByIdentifier(identifier: string): AppUser[] {
  const clean = identifier.trim().toLowerCase();
  const users = dbEngine.getCollection("users") as AppUser[];
  return users.filter(
    (u) =>
      u.email.toLowerCase().includes(clean) ||
      u.displayName.toLowerCase().includes(clean) ||
      u.institution.toLowerCase().includes(clean)
  );
}

export async function registerUser(
  email: string,
  pass: string,
  displayName: string,
  role: AppUser["role"] = "teacher",
  institution: string = "Jitegemee Secondary School",
  ipAddress: string = "127.0.0.1",
  userAgent: string = ""
): Promise<{ user: AppUser; token: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const dev = parseDeviceInfo(userAgent, ipAddress);

  if (findUserByEmail(cleanEmail)) {
    dbEngine.logSecurityEvent({
      eventType: "REGISTRATION",
      email: cleanEmail,
      ipAddress,
      userAgent,
      deviceType: dev.deviceType,
      browser: dev.browser,
      os: dev.os,
      status: "FAILED",
      reason: "Email already registered in system",
      geoRegion: dev.geoRegion,
    });
    throw new Error("EMAIL_ALREADY_IN_USE: This email is already registered.");
  }

  if (pass.length < 6) {
    dbEngine.logSecurityEvent({
      eventType: "REGISTRATION",
      email: cleanEmail,
      ipAddress,
      userAgent,
      deviceType: dev.deviceType,
      browser: dev.browser,
      os: dev.os,
      status: "FAILED",
      reason: "Password length less than 6 characters",
      geoRegion: dev.geoRegion,
    });
    throw new Error("WEAK_PASSWORD: Password must be at least 6 characters.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(pass, salt);

  const newUser: AppUser = {
    uid: "usr-" + crypto.randomUUID().slice(0, 8),
    email: cleanEmail,
    displayName: displayName.trim() || cleanEmail.split("@")[0],
    role,
    institution: institution || "Jitegemee Secondary School",
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    status: "active",
    provider: "password",
  };

  const users = dbEngine.getCollection("users") as AppUser[];
  users.push(newUser);
  await dbEngine.save();

  dbEngine.logSecurityEvent({
    eventType: "REGISTRATION",
    email: cleanEmail,
    displayName: newUser.displayName,
    role: newUser.role,
    ipAddress,
    userAgent,
    deviceType: dev.deviceType,
    browser: dev.browser,
    os: dev.os,
    status: "SUCCESS",
    reason: `Standard institutional account created (${role})`,
    geoRegion: dev.geoRegion,
  });

  const token = generateToken(newUser);
  return { user: sanitizeUser(newUser), token };
}

export async function authenticateWithPassword(
  email: string,
  pass: string,
  ipAddress: string = "127.0.0.1",
  userAgent: string = ""
): Promise<{ user: AppUser; token: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const dev = parseDeviceInfo(userAgent, ipAddress);
  const user = findUserByEmail(cleanEmail);

  if (!user) {
    dbEngine.logSecurityEvent({
      eventType: "LOGIN_FAILED",
      email: cleanEmail,
      ipAddress,
      userAgent,
      deviceType: dev.deviceType,
      browser: dev.browser,
      os: dev.os,
      status: "FAILED",
      reason: "INVALID_CREDENTIAL: User record not found",
      geoRegion: dev.geoRegion,
    });
    throw new Error("INVALID_CREDENTIAL: No account found with this email address.");
  }

  if (user.passwordHash && user.salt) {
    const computed = hashPassword(pass, user.salt);
    if (computed !== user.passwordHash) {
      dbEngine.logSecurityEvent({
        eventType: "LOGIN_FAILED",
        email: cleanEmail,
        displayName: user.displayName,
        role: user.role,
        ipAddress,
        userAgent,
        deviceType: dev.deviceType,
        browser: dev.browser,
        os: dev.os,
        status: "FAILED",
        reason: "INVALID_CREDENTIAL: Password hash comparison failed",
        geoRegion: dev.geoRegion,
      });
      throw new Error("INVALID_CREDENTIAL: Incorrect password.");
    }
  }

  user.lastLogin = new Date().toISOString();
  await dbEngine.save();

  dbEngine.logSecurityEvent({
    eventType: "LOGIN_SUCCESS",
    email: cleanEmail,
    displayName: user.displayName,
    role: user.role,
    ipAddress,
    userAgent,
    deviceType: dev.deviceType,
    browser: dev.browser,
    os: dev.os,
    status: "SUCCESS",
    reason: "Standard password cryptographic validation passed",
    geoRegion: dev.geoRegion,
  });

  const token = generateToken(user);
  return { user: sanitizeUser(user), token };
}

export async function authenticateWithOAuth(
  provider: "google" | "yahoo" | "demo",
  email: string,
  displayName?: string,
  photoURL?: string,
  ipAddress: string = "127.0.0.1",
  userAgent: string = "",
  roleOverride?: AppUser["role"]
): Promise<{ user: AppUser; token: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const dev = parseDeviceInfo(userAgent, ipAddress);
  let user = findUserByEmail(cleanEmail);

  if (!user) {
    const isSpecialAdmin = cleanEmail.includes("admin") || cleanEmail === "deodatusmaliti2@gmail.com";
    let calculatedRole: AppUser["role"] = roleOverride || (isSpecialAdmin ? "admin" : "teacher");
    if (!roleOverride) {
      if (cleanEmail.includes("academic") || cleanEmail.includes("head")) calculatedRole = "headteacher";
      else if (cleanEmail.includes("parent") || cleanEmail.includes("guardian") || cleanEmail.includes("hrashid")) calculatedRole = "parent";
      else if (cleanEmail.includes("inspector") || cleanEmail.includes("moe.go.tz")) calculatedRole = "inspector";
    }

    user = {
      uid: `${provider}-` + crypto.randomUUID().slice(0, 8),
      email: cleanEmail,
      displayName: displayName && !displayName.startsWith("Eng.") ? displayName : (cleanEmail === "deodatusmaliti2@gmail.com" ? "Super Admin Deodatus Maliti" : cleanEmail.split("@")[0]),
      role: calculatedRole,
      institution: "Jitegemee Secondary School",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      status: "active",
      provider,
      photoURL,
    };
    const users = dbEngine.getCollection("users") as AppUser[];
    users.push(user);

    dbEngine.logSecurityEvent({
      eventType: "OAUTH_REGISTER",
      email: cleanEmail,
      displayName: user.displayName,
      role: user.role,
      ipAddress,
      userAgent,
      deviceType: dev.deviceType,
      browser: dev.browser,
      os: dev.os,
      status: "SUCCESS",
      reason: `New OAuth user registration via ${provider}`,
      geoRegion: dev.geoRegion,
    });
  } else {
    user.lastLogin = new Date().toISOString();
    if (displayName) user.displayName = displayName;
    if (photoURL) user.photoURL = photoURL;
    if (roleOverride) user.role = roleOverride;

    dbEngine.logSecurityEvent({
      eventType: "OAUTH_LOGIN",
      email: cleanEmail,
      displayName: user.displayName,
      role: user.role,
      ipAddress,
      userAgent,
      deviceType: dev.deviceType,
      browser: dev.browser,
      os: dev.os,
      status: "SUCCESS",
      reason: `Authenticated via ${provider} OAuth protocol`,
      geoRegion: dev.geoRegion,
    });
  }

  await dbEngine.save();
  const token = generateToken(user);
  return { user: sanitizeUser(user), token };
}

// --- Password & Username Restoration Protocols ---

export async function requestPasswordRestoration(
  email: string,
  ipAddress: string = "127.0.0.1",
  userAgent: string = ""
): Promise<{ success: boolean; message: string; restorationCode?: string; resetToken?: string; userFound: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  const dev = parseDeviceInfo(userAgent, ipAddress);
  const user = findUserByEmail(cleanEmail);

  if (!user) {
    dbEngine.logSecurityEvent({
      eventType: "PASSWORD_RESET_REQUEST",
      email: cleanEmail,
      ipAddress,
      userAgent,
      deviceType: dev.deviceType,
      browser: dev.browser,
      os: dev.os,
      status: "FAILED",
      reason: "Password reset attempted for unregistered email",
      geoRegion: dev.geoRegion,
    });
    return {
      success: true,
      userFound: false,
      message: "If this email is registered in the EduScore database, a restoration link has been dispatched.",
    };
  }

  const resetEntry = dbEngine.createPasswordResetToken(cleanEmail);

  dbEngine.logSecurityEvent({
    eventType: "PASSWORD_RESET_REQUEST",
    email: cleanEmail,
    displayName: user.displayName,
    role: user.role,
    ipAddress,
    userAgent,
    deviceType: dev.deviceType,
    browser: dev.browser,
    os: dev.os,
    status: "SUCCESS",
    reason: `Password reset dispatched. Verification PIN: ${resetEntry.code}`,
    geoRegion: dev.geoRegion,
    restorationCode: resetEntry.code,
  });

  return {
    success: true,
    userFound: true,
    restorationCode: resetEntry.code,
    resetToken: resetEntry.token,
    message: `Restoration email dispatched to ${cleanEmail}. Verification PIN code: ${resetEntry.code}`,
  };
}

export async function confirmPasswordRestoration(
  tokenOrCode: string,
  newPassword: string,
  ipAddress: string = "127.0.0.1",
  userAgent: string = ""
): Promise<{ success: boolean; message: string }> {
  const dev = parseDeviceInfo(userAgent, ipAddress);

  if (newPassword.length < 6) {
    throw new Error("WEAK_PASSWORD: New password must be at least 6 characters.");
  }

  const tokenEntry = dbEngine.verifyAndConsumeResetToken(tokenOrCode);
  if (!tokenEntry) {
    dbEngine.logSecurityEvent({
      eventType: "PASSWORD_RESET_CONFIRM",
      email: "unknown",
      ipAddress,
      userAgent,
      deviceType: dev.deviceType,
      browser: dev.browser,
      os: dev.os,
      status: "FAILED",
      reason: "Invalid or expired restoration PIN / token code",
      geoRegion: dev.geoRegion,
    });
    throw new Error("INVALID_RESET_CODE: The restoration PIN or token code is invalid or has expired.");
  }

  const user = findUserByEmail(tokenEntry.email);
  if (!user) {
    throw new Error("User account associated with this token no longer exists.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  user.passwordHash = hashPassword(newPassword, salt);
  user.salt = salt;
  user.lastLogin = new Date().toISOString();
  await dbEngine.save();

  dbEngine.logSecurityEvent({
    eventType: "PASSWORD_RESET_CONFIRM",
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    ipAddress,
    userAgent,
    deviceType: dev.deviceType,
    browser: dev.browser,
    os: dev.os,
    status: "SUCCESS",
    reason: "Password successfully restored and updated via cryptographic token",
    geoRegion: dev.geoRegion,
  });

  return {
    success: true,
    message: "Your password has been successfully restored. You can now sign in with your new password.",
  };
}

export async function requestUsernameRestoration(
  identifier: string,
  ipAddress: string = "127.0.0.1",
  userAgent: string = ""
): Promise<{ success: boolean; message: string; matches: Array<{ email: string; displayName: string; role: string; institution: string }> }> {
  const dev = parseDeviceInfo(userAgent, ipAddress);
  const matches = findUsersByIdentifier(identifier);

  dbEngine.logSecurityEvent({
    eventType: "USERNAME_RECOVERY_REQUEST",
    email: identifier,
    ipAddress,
    userAgent,
    deviceType: dev.deviceType,
    browser: dev.browser,
    os: dev.os,
    status: matches.length > 0 ? "SUCCESS" : "FAILED",
    reason: matches.length > 0 ? `Username reminder matched ${matches.length} account(s)` : "No accounts found matching lookup criteria",
    geoRegion: dev.geoRegion,
  });

  return {
    success: true,
    message: matches.length > 0 ? `Found ${matches.length} matching institutional account(s).` : "No matching account found.",
    matches: matches.map((m) => ({
      email: m.email,
      displayName: m.displayName,
      role: m.role,
      institution: m.institution,
    })),
  };
}

export function sanitizeUser(user: AppUser): AppUser {
  const clone = { ...user };
  delete clone.passwordHash;
  delete clone.salt;
  return clone;
}
