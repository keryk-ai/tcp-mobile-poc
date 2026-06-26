'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import { signIn as authSignIn, signOut as authSignOut, onAuthStateChanged } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login'];

function setAuthCookie() {
  document.cookie = 'firebase-auth=1; path=/; max-age=2592000; SameSite=Strict';
}

function clearAuthCookie() {
  document.cookie = 'firebase-auth=; path=/; max-age=0; SameSite=Strict';
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleSignIn = async (email: string, password: string) => {
    const { user, error } = await authSignIn(email, password);
    if (user) {
      setUser(user);
      setAuthCookie();
    }
    return { error };
  };

  const handleSignOut = async () => {
    await authSignOut();
    clearAuthCookie();
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setup = async () => {
      const { auth } = await initializeFirebase();
      if (!auth) {
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unsubscribe = onAuthStateChanged(auth as any, (firebaseUser: User | null) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          setAuthCookie();
          if (pathname === '/login') {
            router.push('/home');
          }
        } else {
          setUser(null);
          clearAuthCookie();
          if (!PUBLIC_PATHS.includes(pathname)) {
            router.push('/login');
          }
        }
        setLoading(false);
      });
    };

    setup();

    return () => {
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn: handleSignIn, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
