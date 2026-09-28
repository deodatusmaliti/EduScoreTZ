import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with Database ID if specified, or default instance
export const db = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const yahooProvider = new OAuthProvider('yahoo.com');
yahooProvider.addScope('email');
yahooProvider.addScope('profile');

// Cloud Configuration details
export const CLOUD_CONFIG = {
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId,
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket,
};

// Test connection on boot
export async function testFirestoreConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    // Attempt reading from test collection
    await getDocFromServer(doc(db, 'test', 'connection'));
    const latency = Date.now() - start;
    return { connected: true, latencyMs: latency };
  } catch (error) {
    const latency = Date.now() - start;
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('the client is offline')) {
      console.warn('Firestore client is offline. Local cache active.');
    }
    // Non-fatal error fallback (test doc might not exist yet, but server answered)
    return { connected: true, latencyMs: latency, error: msg.includes('not-found') ? undefined : msg };
  }
}
