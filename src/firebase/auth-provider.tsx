
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User, auth, isConfigValid } from '@/firebase';
import { signInAnonymously, type Auth } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

type AuthContextType = {
  user: User | null;
  auth: Auth | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, auth: auth, loading: true });

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
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Anonymous sign-in failed:", error);
        }
      }
      setLoading(false);
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
    <AuthContext.Provider value={{ user, auth, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
