import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOAuthClient(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.accessToken)
      throw new Error('No user or access token found');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { accessToken: tokens.access_token },
        });
        console.log(
          `[CalendarService] Access token refreshed for user ${userId}`,
        );
      }
    });

    return oauth2Client;
  }

  async getEvents(userId: string) {
    const auth = await this.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return res.data.items;
    } catch (e: any) {
      console.error(
        '[CalendarService] getEvents error:',
        e?.response?.data ?? e?.message,
      );
      throw new Error(
        `Failed to fetch calendar events: ${e?.response?.data?.error_description ?? e?.message}`,
      );
    }
  }

  async createEvent(
    userId: string,
    data: { summary: string; description?: string; start: string; end: string },
  ) {
    const auth = await this.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: data.summary,
          description: data.description,
          start: {
            dateTime: data.start,
            timeZone: 'Europe/Warsaw',
          },
          end: {
            dateTime: data.end,
            timeZone: 'Europe/Warsaw',
          },
        },
      });
      console.log(`[CalendarService] Event created: ${res.data.htmlLink}`);
      return res.data;
    } catch (e: any) {
      console.error(
        '[CalendarService] createEvent error:',
        e?.response?.data ?? e?.message,
      );
      throw new Error(
        `Failed to create calendar event: ${e?.response?.data?.error_description ?? e?.message}`,
      );
    }
  }

  async deleteEvent(userId: string, eventId: string) {
    const auth = await this.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      await calendar.events.delete({ calendarId: 'primary', eventId });
      console.log(`[CalendarService] Event deleted: ${eventId}`);
    } catch (e: any) {
      console.error(
        '[CalendarService] deleteEvent error:',
        e?.response?.data ?? e?.message,
      );
      throw new Error(
        `Failed to delete event: ${e?.response?.data?.error_description ?? e?.message}`,
      );
    }
  }
}
