'use client';

import { Bell, Search, Check, X, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AddEventModal } from './AddEventModal';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mutate } from 'swr';
import { useAuthenticatedSWR } from '@/lib/use-authenticated-swr';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type PendingInvitation = {
  id: string;
  event: { title: string; startDate: string };
  inviter: { name: string | null; email: string };
};

export function TopBar() {
  const router = useRouter();

  const { data: invitations } = useAuthenticatedSWR<PendingInvitation[]>(
    `${API_URL}/invitations/pending`,
  );

  const handleAccept = async (id: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`${API_URL}/invitations/${id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Błąd');

      toast.success('Zaproszenie zaakceptowane!', {
        description: 'Wydarzenie dodano do kalendarza.',
      });
      mutate(`${API_URL}/invitations/pending`);
      mutate(`${API_URL}/calendar/events`);
    } catch (e) {
      toast.error('Nie udało się zaakceptować zaproszenia');
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      const res = await fetch(`${API_URL}/invitations/${id}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Błąd');

      toast.success('Zaproszenie odrzucone');
      mutate(`${API_URL}/invitations/pending`);
    } catch (e) {
      toast.error('Nie udało się odrzucić zaproszenia');
    }
  };

  const hasInvitations = invitations && invitations.length > 0;

  return (
    <header
      data-testid="topbar"
      className="flex h-16 shrink-0 items-center justify-between border-b bg-card/60 px-6 backdrop-blur-xl"
    >
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            data-testid="topbar-search-input"
            type="search"
            placeholder="Szukaj wydarzeń..."
            className="h-9 w-full rounded-md border border-input bg-background/50 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              data-testid="topbar-notifications-button"
              variant="ghost"
              size="icon"
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {hasInvitations && (
                <span className="absolute right-2 top-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white">
                  {invitations.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="border-b px-4 py-3">
              <h4 className="font-semibold">Oczekujące zaproszenia</h4>
            </div>
            <div className="flex max-h-80 flex-col overflow-y-auto p-2">
              {!hasInvitations && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Brak nowych powiadomień.
                </div>
              )}
              {invitations?.map((inv) => (
                <div key={inv.id} className="mb-2 rounded-lg bg-muted/30 p-3 text-sm">
                  <div className="mb-2 font-medium">
                    {inv.inviter.name || inv.inviter.email} zaprasza na:
                  </div>
                  <div className="mb-3 flex items-start gap-2 text-primary">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <div className="font-semibold">{inv.event.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(inv.event.startDate).toLocaleString('pl-PL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1 bg-emerald-500 hover:bg-emerald-600"
                      onClick={() => handleAccept(inv.id)}
                    >
                      <Check className="h-4 w-4" /> Akceptuj
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => handleDecline(inv.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <AddEventModal onEventAdded={() => router.refresh()} />
      </div>
    </header>
  );
}
