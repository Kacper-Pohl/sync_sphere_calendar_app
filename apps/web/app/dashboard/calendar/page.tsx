'use client';

import { useAuthenticatedSWR } from '@/lib/use-authenticated-swr';
import type { CalendarEvent, EventsResponse } from '@/lib/types/events';
import { CalendarGrid } from '../../components/CalendarGrid';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CalendarPage() {
  const { data, showError, isPageLoading } = useAuthenticatedSWR<EventsResponse>(
    `${API_URL}/calendar/events`,
    {
      revalidateOnFocus: true,
    },
  );

  if (isPageLoading)
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
        <p className="animate-pulse text-muted-foreground">Synchronizowanie kalendarza...</p>
      </div>
    );

  const events: CalendarEvent[] = data?.events || [];

  return (
    <div data-testid="calendar-page" className="flex h-full flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Widok Kalendarza</h2>
          <p className="text-muted-foreground">Oto Twój pełny podgląd miesięcznych wydarzeń.</p>
        </div>
      </div>

      {showError ? (
        <p className="font-medium text-destructive">Nie udało się pobrać wydarzeń kalendarza.</p>
      ) : (
        <div className="min-h-[600px] flex-1">
          <CalendarGrid events={events} />
        </div>
      )}
    </div>
  );
}
