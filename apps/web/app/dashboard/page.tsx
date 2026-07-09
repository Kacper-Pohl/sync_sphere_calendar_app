'use client';

import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useAuthenticatedSWR } from '@/lib/use-authenticated-swr';
import { EventsResponse, CalendarEvent } from '@/lib/types/events';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DashboardPage() {
  const { data, showError, isPageLoading } = useAuthenticatedSWR<EventsResponse>(
    `${API_URL}/calendar/events`,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    },
  );

  const events = useMemo(() => data?.events || [], [data]);

  if (isPageLoading)
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-emerald-500"></div>
        <p className="animate-pulse text-xs uppercase tracking-widest text-slate-500">
          Synchronizacja...
        </p>
      </div>
    );

  if (showError)
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-medium text-slate-300">
          Nie udało się połączyć z orbitą danych.
        </p>
      </div>
    );

  return (
    <div data-testid="dashboard-summary-page" className="mx-auto max-w-7xl px-6 py-12 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="mb-16"
      >
        <h2 className="mb-2 text-4xl font-bold tracking-tight">Twój Czas</h2>
        <p className="font-light text-slate-400">
          Minimalistyczny wgląd w Twoje nadchodzące wydarzenia.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {events.length === 0 ? (
            <motion.p
              data-testid="dashboard-empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full font-light italic text-slate-500"
            >
              Cisza w kalendarzu. Ciesz się wolną chwilą.
            </motion.p>
          ) : (
            events.map((event: CalendarEvent, index: number) => {
              const startDate = new Date(
                event.start?.dateTime || event.start?.date || '',
              );

              return (
              <motion.div
                data-testid={`dashboard-event-card-${event.id}`}
                key={event.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="minimal-card"
              >
                <div className="mb-4">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500">
                    {format(startDate, 'LLLL', { locale: pl })}
                  </div>
                  <h3
                    data-testid="dashboard-event-title"
                    className="text-lg font-semibold text-slate-100 transition-colors group-hover:text-white"
                  >
                    {event.summary || 'Bez Tytułu'}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  <span>
                    {startDate.toLocaleString('pl-PL', {
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {event.description && (
                  <div className="mt-4 border-t border-white/[0.03] pt-4">
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {event.description}
                    </p>
                  </div>
                )}
              </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
