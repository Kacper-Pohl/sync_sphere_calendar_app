'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Clock, Trash2, ExternalLink, AlignLeft } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/lib/types/events';

interface EventPopoverProps {
  event: CalendarEvent;
}

export function EventPopover({ event }: EventPopoverProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startStr = event.start?.dateTime || event.start?.date || '';
  const endStr = event.end?.dateTime || event.end?.date || '';
  const isAllDay = !event.start?.dateTime;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:3001/calendar/events/${event.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt_token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Nie udało się usunąć wydarzenia');
      }

      toast.success('Wydarzenie usunięte', {
        description: `"${event.summary}" zostało usunięte z Kalendarza Google.`,
      });
      mutate('http://localhost:3001/calendar/events');
      setOpen(false);
    } catch (error: unknown) {
      toast.error('Błąd usuwania', {
        description: error instanceof Error ? error.message : 'Nie udało się usunąć wydarzenia.',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'cursor-pointer truncate rounded-md px-2 py-1 text-xs',
            'bg-violet-500/20 font-medium text-violet-300',
            'border border-violet-500/30',
            'transition-all hover:border-violet-400/50 hover:bg-violet-500/35',
          )}
          title={event.summary}
        >
          {!isAllDay && startStr && (
            <span className="mr-1 opacity-70">{format(new Date(startStr), 'HH:mm')}</span>
          )}
          {event.summary || 'Bez tytułu'}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-72 overflow-hidden p-0" align="start" side="right">
        <div className="border-b border-violet-500/20 bg-violet-600/30 p-4">
          <h3 className="text-base font-semibold leading-tight text-foreground">
            {event.summary || 'Bez tytułu'}
          </h3>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
            <div>
              {isAllDay ? (
                <span>Cały dzień</span>
              ) : (
                <>
                  <div>
                    {startStr
                      ? format(new Date(startStr), 'EEEE, d MMMM yyyy', {
                          locale: pl,
                        })
                      : ''}
                  </div>
                  <div className="font-medium text-violet-300">
                    {startStr ? format(new Date(startStr), 'HH:mm') : ''} –{' '}
                    {endStr ? format(new Date(endStr), 'HH:mm') : ''}
                  </div>
                </>
              )}
            </div>
          </div>

          {event.description && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlignLeft className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
              <p className="line-clamp-3 leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 pb-4">
          {event.htmlLink && (
            <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" asChild>
              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3" />
                Otwórz w Google
              </a>
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-3 w-3" />
            {deleting ? '...' : 'Usuń'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
