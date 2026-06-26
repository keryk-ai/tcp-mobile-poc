import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestoreDb: Firestore | null = null;

async function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { app: null, auth: null };
  }

  if (app && auth) {
    return { app, auth };
  }

  try {
    const { initializeApp } = await import('firebase/app');
    const { getAuth, setPersistence, browserLocalPersistence } = await import('firebase/auth');

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);

    return { app, auth };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return { app: null, auth: null };
  }
}

export { auth };
export default app;
export { initializeFirebase };

export async function getFirestoreDb(): Promise<Firestore | null> {
  if (typeof window === 'undefined') return null;
  const { app } = await initializeFirebase();
  if (!app) return null;
  if (!firestoreDb) {
    const { getFirestore } = await import('firebase/firestore');
    firestoreDb = getFirestore(app);
  }
  return firestoreDb;
}
