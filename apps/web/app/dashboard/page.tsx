'use client';

import { useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { EventsResponse, CalendarEvent } from '@/lib/types/events';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');
  
  useEffect(() => {
    if (urlToken) {
      localStorage.setItem('jwt_token', urlToken);
      router.replace('/dashboard');
    }
  }, [urlToken, router]);

  const { data, error, isLoading } = useSWR<EventsResponse>(
    `${API_URL}/calendar/events`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const events = useMemo(() => data?.events || [], [data]);

  if (isLoading) return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-emerald-500"></div>
      <p className="text-xs tracking-widest uppercase text-slate-500 animate-pulse">Synchronizacja...</p>
    </div>
  );

  if (error) return (
    <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-sm font-medium text-slate-300">Nie udało się połączyć z orbitą danych.</p>
      <button 
        onClick={() => router.push('/')}
        className="mt-6 px-4 py-2 text-xs border border-white/10 rounded-full hover:bg-white/5 transition-colors"
      >
        Powrót
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-16"
      >
        <h2 className="text-4xl font-bold tracking-tight mb-2">Twój Czas</h2>
        <p className="text-slate-400 font-light">Minimalistyczny wgląd w Twoje nadchodzące wydarzenia.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {events.length === 0 ? (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-500 font-light italic col-span-full"
            >
              Cisza w kalendarzu. Ciesz się wolną chwilą.
            </motion.p>
          ) : (
            events.map((event: CalendarEvent, index: number) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="minimal-card"
              >
                <div className="mb-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-bold mb-1">
                    Sierpień
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white transition-colors">
                    {event.summary || 'Bez Tytułu'}
                  </h3>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(event.start?.dateTime || event.start?.date || '').toLocaleString('pl-PL', {
                      day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>

                {event.description && (
                  <div className="mt-4 pt-4 border-t border-white/[0.03]">
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-slate-700"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
