import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvents(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.accessToken) throw new Error('No user or access token found');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: user.accessToken, refresh_token: user.refreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    try {
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });
      return res.data.items;
    } catch (e) {
      console.error(e);
      throw new Error('Failed to fetch calendar events from Google');
    }
  }

  async createEvent(userId: string, data: { summary: string; description?: string; start: string; end: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.accessToken) throw new Error('No user or access token found');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: user.accessToken, refresh_token: user.refreshToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
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
      return res.data;
    } catch (e) {
      console.error(e);
      throw new Error('Failed to create calendar event in Google');
    }
  }
}
