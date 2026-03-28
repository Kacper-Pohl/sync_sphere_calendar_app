'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      localStorage.setItem('jwt_token', urlToken);
      router.replace('/dashboard'); // Wyczyść URL 
      return; 
    }

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
        
        if (!res.ok) throw new Error('Nie udało się pobrać wydarzeń.');
        
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [searchParams, router]);

  if (loading) return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="loader"></div>
      <p style={{ opacity: 0.7 }}>Synchronizowanie sfery...</p>
    </div>
  );

  return (
    <main className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Twoja <span style={{ color: '#a855f7' }}>Sfera Wydarzeń</span></h2>
        <button className="btn-glass" style={{ margin: 0, padding: '0.5rem 1.5rem', fontSize: '0.9rem' }} onClick={() => {
          localStorage.removeItem('jwt_token');
          router.push('/');
        }}>Sign Out</button>
      </div>

      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      <div className="event-grid">
        {events.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>Brak nadchodzących wydarzeń w Google Calendar.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="event-card">
              <h3 className="event-title">{event.summary || 'Bez Tytułu'}</h3>
              
              <div className="event-time">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                {new Date(event.start?.dateTime || event.start?.date).toLocaleString('pl-PL', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </div>
              
              {event.description && (
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {event.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
