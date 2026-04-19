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
            Authorization: `Bearer ${token}`
          }
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

  if (loading) return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
      <p className="text-muted-foreground animate-pulse">Synchronizowanie kalendarza...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Widok Kalendarza</h2>
          <p className="text-muted-foreground">Oto Twój pełny podgląd miesięcznych wydarzeń.</p>
        </div>
      </div>

      {error ? (
        <p className="text-destructive font-medium">{error}</p>
      ) : (
        <div className="flex-1 min-h-[600px]">
          <CalendarGrid events={events} />
        </div>
      )}
    </div>
  );
}
