import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword as fbSignInWithEmailAndPassword,
  createUserWithEmailAndPassword as fbCreateUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup as fbSignInWithPopup,
  onAuthStateChanged as fbOnAuthStateChanged,
  updateProfile as fbUpdateProfile,
  sendEmailVerification as fbSendEmailVerification,
} from 'firebase/auth';

// Firebase Client Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase App instance singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Authentication Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export {
  fbSignInWithEmailAndPassword as signInWithEmailAndPassword,
  fbCreateUserWithEmailAndPassword as createUserWithEmailAndPassword,
  fbSignOut as signOut,
  fbSignInWithPopup as signInWithPopup,
  fbOnAuthStateChanged as onAuthStateChanged,
  fbUpdateProfile as updateProfile,
  fbSendEmailVerification as sendEmailVerification,
};

/**
 * Uses Firebase Authentication service to validate and provision a work user,
 * then dispatches a real email verification link to their work inbox.
 * Uses a secondary Firebase App instance so the active HR/Manager session is NOT disrupted.
 */
export const validateAndProvisionWorkEmailWithFirebase = async (
  email: string,
  password: string,
  displayName?: string
): Promise<{ uid: string; emailVerificationSent: boolean }> => {
  const secondaryAppName = 'FirebaseWorkerProvisioning';
  let secondaryApp = getApps().find((a) => a.name === secondaryAppName);
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await fbCreateUserWithEmailAndPassword(secondaryAuth, email, password);
    if (displayName && cred.user) {
      await fbUpdateProfile(cred.user, { displayName });
    }

    let emailVerificationSent = false;
    try {
      await fbSendEmailVerification(cred.user);
      emailVerificationSent = true;
    } catch (verifErr) {
      console.warn('Firebase sendEmailVerification notice:', verifErr);
    }

    const uid = cred.user.uid;
    // Sign out secondary instance to clear its state
    await fbSignOut(secondaryAuth);

    return { uid, emailVerificationSent };
  } catch (error: any) {
    try {
      await fbSignOut(secondaryAuth);
    } catch {
      // ignore
    }
    throw error;
  }
};

/**
 * Dispatches a Firebase email verification link to the currently signed in user.
 */
export const sendWorkEmailVerification = async (): Promise<boolean> => {
  if (!auth.currentUser) return false;
  await fbSendEmailVerification(auth.currentUser);
  return true;
};


