
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User, signInAnonymously } from 'firebase/auth';
import { auth, isConfigValid } from '@/firebase';
import { Loader2 } from 'lucide-react';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigValid || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        // Only attempt anonymous sign-in if the app is configured
        // and we haven't already failed.
        if (isConfigValid) {
            try {
              await signInAnonymously(auth);
            } catch (error: any) {
              // This can happen if anonymous sign-in isn't enabled in the Firebase console
              if (error.code !== 'auth/operation-not-allowed') {
                console.error("Anonymous sign-in failed:", error);
              }
              setLoading(false);
            }
        } else {
             setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
