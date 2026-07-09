'use client';

import { createContext, useContext, useLayoutEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type AuthContextValue = {
  isReady: boolean;
  token: string | null;
};

const AuthContext = createContext<AuthContextValue>({
  isReady: false,
  token: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useLayoutEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      localStorage.setItem('jwt_token', urlToken);
      setToken(urlToken);
      setIsReady(true);
      router.replace('/dashboard');
      return;
    }

    const stored = localStorage.getItem('jwt_token');
    if (!stored) {
      router.push('/');
      return;
    }

    setToken(stored);
    setIsReady(true);
  }, [searchParams, router]);

  if (!isReady) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="animate-pulse text-sm text-muted-foreground">Ładowanie sesji...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={{ isReady, token }}>{children}</AuthContext.Provider>;
}
