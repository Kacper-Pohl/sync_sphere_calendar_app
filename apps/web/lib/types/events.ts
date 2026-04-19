export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

export interface EventsResponse {
  success: boolean;
  events: CalendarEvent[];
}
