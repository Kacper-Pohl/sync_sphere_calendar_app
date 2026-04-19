'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { mutate } from 'swr';
import { toast } from 'sonner';

export function AddEventModal({ onEventAdded }: { onEventAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const summary = formData.get('summary') as string;
    const date = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;

    const start = new Date(`${date}T${startTime}:00`).toISOString();
    const end = new Date(`${date}T${endTime}:00`).toISOString();

    try {
      const response = await fetch('http://localhost:3001/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({ summary, start, end }),
      });

      if (!response.ok) throw new Error('Failed to create event');

      toast.success('Wydarzenie dodane', {
        description: `Spotkanie "${summary}" zostało pomyślnie dodane na Twój dysk Google Calendar.`,
      });
      
      mutate('http://localhost:3001/calendar/events');
      onEventAdded();
      setOpen(false);
    } catch (error) {
      toast.error('Błąd', {
        description: 'Nie udało się dodać wydarzenia z powodu błędu.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#5C3BFF] text-white hover:bg-[#5C3BFF]/90 transition-all font-medium">
          <Plus className="mr-2 h-4 w-4" />
          Dodaj wydarzenie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Nowe spotkanie</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="summary">Tytuł spotkania</Label>
            <Input id="summary" name="summary" required placeholder="np. Analiza projektu rano" className="border-gray-200" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="date" type="date" required className="border-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Od</Label>
              <Input id="startTime" name="startTime" type="time" required className="border-gray-200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Do</Label>
              <Input id="endTime" name="endTime" type="time" required className="border-gray-200" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-[#5C3BFF] hover:bg-[#5C3BFF]/90 h-11 mt-2">
            {loading ? 'Zapisywanie...' : 'Zapisz do Kalendarza >'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
