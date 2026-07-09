import { format } from 'date-fns';
import { TZDate, tz } from '@date-fns/tz';

/** App-wide timezone for wall-clock times sent by the frontend. */
export const APP_TIMEZONE = 'Europe/Warsaw';

const LOCAL_DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";
const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/;

/**
 * Parses a naive local datetime string (e.g. `2024-01-15T09:00:00`) as wall-clock
 * time in {@link APP_TIMEZONE} and returns the corresponding UTC instant.
 */
export function parseAppLocalDateTime(value: string): Date | null {
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const parsed = new TZDate(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
    APP_TIMEZONE,
  );

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getTime());
}

/**
 * Formats a UTC instant as a naive local datetime string in {@link APP_TIMEZONE}
 * for Google Calendar API (`dateTime` + `timeZone` fields).
 */
export function formatAppLocalDateTime(date: Date): string {
  return format(date, LOCAL_DATE_TIME_FORMAT, { in: tz(APP_TIMEZONE) });
}
