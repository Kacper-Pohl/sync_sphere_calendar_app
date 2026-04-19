'use client';

import { Plus, Bell, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AddEventModal } from './AddEventModal';
import { Button } from '@/components/ui/button';

export function TopBar() {
  const router = useRouter();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card/60 px-6 backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Szukaj wydarzeń..."
            className="h-9 w-full rounded-md border border-input bg-background/50 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive"></span>
        </Button>
        <AddEventModal onEventAdded={() => router.refresh()} />
      </div>
    </header>
  );
}
