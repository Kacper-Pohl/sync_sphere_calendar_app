'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarGrid } from '../../components/CalendarGrid';

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        router.push('/');
        return;
      }

      try {
        const res = await fetch('http://localhost:3001/calendar/events', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Nie udało się pobrać wydarzeń kalendarza.');

        const data = await res.json();
        setEvents(data.events || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [router]);

  if (loading)
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
        <p className="animate-pulse text-muted-foreground">Synchronizowanie kalendarza...</p>
      </div>
    );

  return (
    <div className="flex h-full flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Widok Kalendarza</h2>
          <p className="text-muted-foreground">Oto Twój pełny podgląd miesięcznych wydarzeń.</p>
        </div>
      </div>

      {error ? (
        <p className="font-medium text-destructive">{error}</p>
      ) : (
        <div className="min-h-[600px] flex-1">
          <CalendarGrid events={events} />
        </div>
      )}
    </div>
  );
}
