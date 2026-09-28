import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, yahooProvider } from './config';
import { handleFirestoreError, OperationType } from './errors';

export type UserRole = 'admin' | 'headteacher' | 'teacher' | 'parent' | 'inspector';

export interface AppUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  institution: string;
  photoURL?: string;
  lastLogin?: string;
  createdAt?: string;
  isCustomRole?: boolean;
}

// Map email or provider details to user role
export function determineDefaultRole(email?: string | null): UserRole {
  if (!email) return 'teacher';
  const lower = email.toLowerCase();
  if (lower.includes('admin') || lower.includes('head') || lower.includes('principal') || lower === 'deodatusmaliti2@gmail.com') {
    return 'admin';
  }
  if (lower.includes('parent') || lower.includes('guardian')) {
    return 'parent';
  }
  if (lower.includes('inspector') || lower.includes('district') || lower.includes('necta')) {
    return 'inspector';
  }
  return 'teacher';
}

// Sync user profile to Firestore
export async function syncUserProfile(user: FirebaseUser, overrideRole?: UserRole): Promise<AppUserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as AppUserProfile;
      // update last login
      await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
      return data;
    } else {
      const defaultRole = overrideRole || determineDefaultRole(user.email);
      const newProfile: AppUserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Tanzanian Educator',
        role: defaultRole,
        institution: 'Jitegemee Secondary School, Dar es Salaam',
        photoURL: user.photoURL || '',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    console.warn('Profile sync fallback (using local profile representation):', error);
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      role: overrideRole || determineDefaultRole(user.email),
      institution: 'Jitegemee Secondary School, Dar es Salaam',
      photoURL: user.photoURL || '',
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
}

// Sign in with Google
export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      throw new Error(`UNAUTHORIZED_DOMAIN:${typeof window !== 'undefined' ? window.location.hostname : 'this domain'}`);
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site.');
    }
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled (popup closed).');
    }
    throw new Error(error?.message || 'Google sign-in failed. Please check popup permissions.');
  }
}

// Sign in with Yahoo
export async function loginWithYahoo(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, yahooProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    console.error('Yahoo Sign-in error:', error);
    if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
      throw new Error(`UNAUTHORIZED_DOMAIN:${typeof window !== 'undefined' ? window.location.hostname : 'this domain'}`);
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site.');
    }
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled (popup closed).');
    }
    throw new Error(error?.message || 'Yahoo sign-in failed. Please check popup permissions or use Email/Password.');
  }
}

// Sign in with Email and Password
export async function loginWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    console.error('Email sign-in error:', error);
    const code = error?.code || '';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      throw new Error('INVALID_CREDENTIAL: The email or password entered is incorrect. If you have not created an account yet, please click "Create Account".');
    } else if (code === 'auth/wrong-password') {
      throw new Error('WRONG_PASSWORD: Password is incorrect. Click "Forgot Password" to receive a reset link.');
    } else if (code === 'auth/invalid-email') {
      throw new Error('INVALID_EMAIL: Please enter a valid email address.');
    } else if (code === 'auth/network-request-failed') {
      throw new Error('NETWORK_ERROR: Network connection issue. Please check your internet connection and retry.');
    } else if (code === 'auth/too-many-requests') {
      throw new Error('Access temporarily blocked due to many failed attempts. Please try again in a few minutes or reset your password.');
    }
    throw new Error(error?.message || 'Authentication failed. Please check your credentials.');
  }
}

// Register with Email and Password
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName: string,
  role: UserRole = 'teacher',
  institution: string = 'Jitegemee Secondary School'
): Promise<FirebaseUser> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await updateProfile(result.user, {
      displayName: displayName.trim(),
    });
    
    // Create profile in Firestore
    const userRef = doc(db, 'users', result.user.uid);
    try {
      await setDoc(userRef, {
        uid: result.user.uid,
        email: email.trim(),
        displayName: displayName.trim(),
        role,
        institution,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not write user profile to firestore during registration:', e);
    }

    return result.user;
  } catch (error: any) {
    console.error('Registration error:', error);
    const code = error?.code || '';
    if (code === 'auth/email-already-in-use') {
      throw new Error('EMAIL_ALREADY_IN_USE: This email is already registered. Please switch to Sign In or reset your password.');
    } else if (code === 'auth/weak-password') {
      throw new Error('WEAK_PASSWORD: Password is too weak. Please use at least 6 characters.');
    } else if (code === 'auth/invalid-email') {
      throw new Error('INVALID_EMAIL: Please provide a valid email address.');
    } else if (code === 'auth/network-request-failed') {
      throw new Error('NETWORK_ERROR: Network connection failed. Please check your connection and retry.');
    }
    throw new Error(error?.message || 'Account registration failed.');
  }
}

// Password reset
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    console.error('Password reset error:', error);
    const code = error?.code || '';
    if (code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    } else if (code === 'auth/invalid-email') {
      throw new Error('Please provide a valid email address.');
    }
    throw new Error(error?.message || 'Could not send password reset email. Check email address.');
  }
}

// Sign out
export async function logout(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out cleanly.');
  }
}
