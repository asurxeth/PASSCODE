
'use client';

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/firebase/auth-provider';
import { useEffect, useState } from 'react';
import { auth, onAuthStateChanged, type User } from '@/firebase';
import { Loader2 } from 'lucide-react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body>
        <AuthProvider>
            {loading ? (
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
            ) : (
                children
            )}
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
