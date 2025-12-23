
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User, auth } from '@/firebase';
import { signInAnonymously, type Auth } from 'firebase/auth';

type AuthContextType = {
  user: User | null;
  auth: Auth;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, auth: auth, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
      } else {
        await signInAnonymously(auth);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, auth, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
