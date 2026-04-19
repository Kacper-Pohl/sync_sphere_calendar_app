'use client';

import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { EventPopover } from './EventPopover';

export function CalendarGrid({ events }: { events: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }),
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const weekDays = ['Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob', 'Nie'];

  return (
    <Card className="flex h-full flex-col overflow-hidden border-border/40 bg-card/60 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-border/40 p-6">
        <h2 className="text-2xl font-bold capitalize text-foreground">
          {format(currentDate, 'LLLL yyyy', { locale: pl })}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Dzisiaj
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col p-0">
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/30">
          {weekDays.map((day) => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div className="grid flex-1 auto-rows-fr grid-cols-7">
          {daysInMonth.map((day, idx) => {
            const dayEvents = events.filter((e) => {
              const eventDateStr = e.start?.dateTime || e.start?.date;
              if (!eventDateStr) return false;
              return isSameDay(new Date(eventDateStr), day);
            });

            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                className={cn(
                  'flex min-h-[120px] flex-col border-b border-r border-border/40 p-2 transition-colors',
                  !isCurrentMonth && 'bg-muted/10 opacity-60',
                  isToday && 'bg-primary/5 ring-1 ring-inset ring-primary/30',
                  'hover:bg-muted/20',
                )}
              >
                <div className="mb-1 flex items-start justify-between">
                  <span
                    className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium',
                      isToday
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                        : 'text-muted-foreground',
                      !isCurrentMonth && !isToday && 'text-muted-foreground/50',
                      isCurrentMonth && !isToday && 'text-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="mt-1 flex flex-1 flex-col gap-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map((event) => (
                    <EventPopover key={event.id} event={event} />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="mt-auto pl-1 text-xs font-medium text-muted-foreground">
                      + {dayEvents.length - 3} inne
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
