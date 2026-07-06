export interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  htmlLink?: string;
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
