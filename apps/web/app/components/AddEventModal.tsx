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
import { Plus } from 'lucide-react';
import { mutate } from 'swr';
import { toast } from 'sonner';

export function AddEventModal({ onEventAdded }: { onEventAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) formRef.current?.reset();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const summary = formData.get('summary') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    const start = `${date}T${startTime}:00`;
    const end = `${date}T${endTime}:00`;

    try {
      const response = await fetch('http://localhost:3001/calendar/events', {
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
        }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || 'Failed to create event');

      toast.success('Wydarzenie dodane!', {
        description: `"${summary}" zostało dodane do Twojego Kalendarza Google.`,
      });

      mutate('http://localhost:3001/calendar/events');
      onEventAdded();
      handleOpenChange(false);
    } catch (error: any) {
      toast.error('Błąd dodawania', {
        description: error.message || 'Nie udało się dodać wydarzenia.',
      });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-[#5C3BFF] font-medium text-white transition-all hover:bg-[#5C3BFF]/90">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj wydarzenie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Nowe spotkanie</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="summary">Tytuł</Label>
            <Input
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
              id="description"
              name="description"
              placeholder="Agenda, link do Google Meet..."
              className="h-20 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="date" type="date" required defaultValue={today} min={today} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Od</Label>
              <Input id="startTime" name="startTime" type="time" required defaultValue="09:00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Do</Label>
              <Input id="endTime" name="endTime" type="time" required defaultValue="10:00" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-[#5C3BFF] hover:bg-[#5C3BFF]/90"
          >
            {loading ? 'Zapisywanie...' : 'Zapisz do Kalendarza →'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
