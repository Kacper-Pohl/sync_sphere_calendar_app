'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, CalendarIcon } from 'lucide-react';
import { mutate } from 'swr';
import { useAuthenticatedSWR } from '@/lib/use-authenticated-swr';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { GroupsListResponse } from '@/lib/types/groups';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

export function AddEventModal({ onEventAdded }: { onEventAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startHour, setStartHour] = useState('09');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('10');
  const [endMinute, setEndMinute] = useState('00');
  const [groupId, setGroupId] = useState('');

  const { data: groupsData } = useAuthenticatedSWR<GroupsListResponse>(`${API_URL}/groups`);
  const groups = groupsData?.groups;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      formRef.current?.reset();
      setDate(new Date());
      setStartHour('09');
      setStartMinute('00');
      setEndHour('10');
      setEndMinute('00');
      setGroupId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date) {
      toast.error('Brak daty', { description: 'Proszę wybrać datę wydarzenia.' });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const summary = formData.get('summary') as string;
    const description = formData.get('description') as string;

    const dateStr = format(date, 'yyyy-MM-dd');
    const start = `${dateStr}T${startHour}:${startMinute}:00`;
    const end = `${dateStr}T${endHour}:${endMinute}:00`;

    if (new Date(end) <= new Date(start)) {
      toast.error('Nieprawidłowy czas', {
        description: 'Godzina zakończenia musi być późniejsza niż rozpoczęcia.',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('jwt_token')}`,
        },
        body: JSON.stringify({
          summary,
          description: description || undefined,
          start,
          end,
          ...(groupId && { groupId }),
        }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || 'Failed to create event');

      toast.success('Wydarzenie dodane!', {
        description: `"${summary}" zostało dodane do Twojego Kalendarza Google.`,
      });

      mutate(
        `${API_URL}/calendar/events`,
        (currentData: any) => {
          const currentEvents = currentData?.events || [];
          return {
            ...currentData,
            events: [...currentEvents, responseData.event],
          };
        },
        { revalidate: true },
      );
      onEventAdded();
      handleOpenChange(false);
    } catch (error: unknown) {
      toast.error('Błąd dodawania', {
        description: error instanceof Error ? error.message : 'Nie udało się dodać wydarzenia.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          data-testid="add-event-trigger"
          className="bg-[#5C3BFF] font-medium text-white transition-all hover:bg-[#5C3BFF]/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Dodaj wydarzenie
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="add-event-modal" className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Nowe spotkanie</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="summary">Tytuł</Label>
            <Input
              data-testid="add-event-summary"
              id="summary"
              name="summary"
              required
              placeholder="Standup, Spotkanie z klientem..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Opis <span className="text-xs font-normal text-muted-foreground">(opcjonalnie)</span>
            </Label>
            <Textarea
              data-testid="add-event-description"
              id="description"
              name="description"
              placeholder="Agenda, link do Google Meet..."
              className="h-20 resize-none"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="date">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: pl }) : <span>Wybierz datę</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} locale={pl} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupId">
              Zaproś Grupę{' '}
              <span className="text-xs font-normal text-muted-foreground">(opcjonalnie)</span>
            </Label>
            <Select value={groupId || 'none'} onValueChange={(value: string) => setGroupId(value === 'none' ? '' : value)}>
              <SelectTrigger data-testid="add-event-group" id="groupId">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bez grupy (tylko ja)</SelectItem>
                {groups?.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Od</Label>
              <div className="flex items-center space-x-2">
                <Select value={startHour} onValueChange={setStartHour}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="font-medium text-muted-foreground">:</span>
                <Select value={startMinute} onValueChange={setStartMinute}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Do</Label>
              <div className="flex items-center space-x-2">
                <Select value={endHour} onValueChange={setEndHour}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="font-medium text-muted-foreground">:</span>
                <Select value={endMinute} onValueChange={setEndMinute}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            data-testid="add-event-submit"
            type="submit"
            disabled={loading}
            className="mt-4 h-11 w-full bg-[#5C3BFF] hover:bg-[#5C3BFF]/90"
          >
            {loading ? 'Zapisywanie...' : 'Zapisz do Kalendarza →'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
