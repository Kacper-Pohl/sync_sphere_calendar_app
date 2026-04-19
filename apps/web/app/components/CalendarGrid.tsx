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
  subMonths 
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    <Card className="flex flex-col h-full bg-card/60 backdrop-blur border-border/40 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-border/40">
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
      
      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Dni tygodnia */}
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/30">
          {weekDays.map((day) => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Siatka kalendarza */}
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {daysInMonth.map((day, idx) => {
            const dayEvents = events.filter(e => {
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
                  "min-h-[120px] p-2 border-r border-b border-border/40 flex flex-col transition-colors",
                  !isCurrentMonth && "bg-muted/10 opacity-60",
                  isToday && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                  "hover:bg-muted/20"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium",
                    isToday ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "text-muted-foreground",
                    !isCurrentMonth && !isToday && "text-muted-foreground/50",
                    isCurrentMonth && !isToday && "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col gap-1 mt-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div 
                      key={event.id} 
                      className="px-2 py-1 text-xs truncate rounded-md bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/20 backdrop-blur-sm"
                      title={event.summary}
                    >
                      {format(new Date(event.start?.dateTime || event.start?.date), 'HH:mm')} - {event.summary || 'Bez Tytułu'}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground font-medium pl-1 mt-auto">
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
