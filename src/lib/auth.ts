import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { initializeFirebase } from './firebase';

export const signIn = async (email: string, password: string) => {
  try {
    const { auth } = await initializeFirebase();
    if (!auth) throw new Error('Firebase not initialized');

    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: unknown) {
    let errorMessage = 'Failed to sign in';
    const err = error as { code?: string };

    if (
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/wrong-password' ||
      err.code === 'auth/user-not-found'
    ) {
      errorMessage = 'Invalid email or password';
    } else if (err.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (err.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed attempts. Please try again later';
    } else if (err.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your connection';
    }

    return { user: null, error: errorMessage };
  }
};

export const signOut = async () => {
  try {
    const { auth } = await initializeFirebase();
    if (!auth) throw new Error('Firebase not initialized');
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err.message || 'Failed to sign out' };
  }
};

export { onAuthStateChanged };
export type { User };

export const getIdToken = async (): Promise<string | null> => {
  try {
    const { auth } = await initializeFirebase();
    const user = auth?.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
};
