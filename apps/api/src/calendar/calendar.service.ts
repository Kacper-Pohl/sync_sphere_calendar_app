import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthService } from '../google/google-auth.service';
import {
  APP_TIMEZONE,
  formatAppLocalDateTime,
  parseAppLocalDateTime,
} from '../common/datetime';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly googleAuth: GoogleAuthService,
  ) {}

  async getEvents(userId: string) {
    const auth = await this.googleAuth.getOAuthClient(userId);
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
      throw new BadGatewayException(
        'Nie udało się pobrać wydarzeń z Google Calendar',
      );
    }
  }

  async createEvent(
    userId: string,
    data: {
      summary: string;
      description?: string;
      start: string;
      end: string;
      groupId?: string;
    },
  ) {
    const startDate = parseAppLocalDateTime(data.start);
    const endDate = parseAppLocalDateTime(data.end);

    if (!startDate || !endDate) {
      throw new BadRequestException('Nieprawidłowy format daty wydarzenia');
    }

    if (endDate <= startDate) {
      throw new BadRequestException(
        'Godzina zakończenia musi być późniejsza niż rozpoczęcia',
      );
    }

    if (data.groupId) {
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_userId: { groupId: data.groupId, userId },
        },
      });

      if (!membership) {
        const group = await this.prisma.group.findUnique({
          where: { id: data.groupId },
        });
        if (!group) throw new NotFoundException('Grupa nie istnieje');
        throw new ForbiddenException('Nie jesteś członkiem tej grupy');
      }
    }

    const auth = await this.googleAuth.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    let googleEventId: string | undefined;
    let localEventId: string | undefined;

    try {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: data.summary,
          description: data.description,
          start: {
            dateTime: formatAppLocalDateTime(startDate),
            timeZone: APP_TIMEZONE,
          },
          end: {
            dateTime: formatAppLocalDateTime(endDate),
            timeZone: APP_TIMEZONE,
          },
        },
      });

      googleEventId = res.data.id ?? undefined;

      const localEvent = await this.prisma.event.create({
        data: {
          title: data.summary,
          description: data.description,
          startDate,
          endDate,
          googleEventId: googleEventId,
          userId: userId,
        },
      });

      localEventId = localEvent.id;

      if (data.groupId) {
        const groupMembers = await this.prisma.groupMember.findMany({
          where: { groupId: data.groupId },
        });

        const invitations = groupMembers
          .filter((member) => member.userId !== userId)
          .map((member) => ({
            eventId: localEvent.id,
            inviterId: userId,
            inviteeId: member.userId,
            status: 'PENDING' as const,
          }));

        if (invitations.length > 0) {
          await this.prisma.eventInvitation.createMany({
            data: invitations,
          });
        }
      }

      console.log(`[CalendarService] Event created: ${res.data.htmlLink}`);
      return res.data;
    } catch (e: any) {
      if (localEventId) {
        try {
          await this.prisma.event.delete({ where: { id: localEventId } });
        } catch (rollbackError: any) {
          console.error(
            '[CalendarService] Failed to rollback local event:',
            rollbackError?.message,
          );
        }
      }

      if (googleEventId) {
        try {
          await calendar.events.delete({
            calendarId: 'primary',
            eventId: googleEventId,
          });
          console.log(
            `[CalendarService] Rolled back Google event ${googleEventId}`,
          );
        } catch (rollbackError: any) {
          console.error(
            '[CalendarService] Failed to rollback Google event:',
            rollbackError?.response?.data ?? rollbackError?.message,
          );
        }
      }

      if (
        e instanceof NotFoundException ||
        e instanceof ForbiddenException ||
        e instanceof BadRequestException
      ) {
        throw e;
      }

      console.error(
        '[CalendarService] createEvent error:',
        e?.response?.data ?? e?.message,
      );
      throw new BadGatewayException(
        'Nie udało się utworzyć wydarzenia w Google Calendar',
      );
    }
  }

  async deleteEvent(userId: string, eventId: string) {
    const auth = await this.googleAuth.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    try {
      await calendar.events.delete({ calendarId: 'primary', eventId });
      console.log(`[CalendarService] Event deleted from Google: ${eventId}`);
    } catch (e: any) {
      console.error(
        '[CalendarService] deleteEvent error:',
        e?.response?.data ?? e?.message,
      );
      throw new BadGatewayException(
        'Nie udało się usunąć wydarzenia z Google Calendar',
      );
    }

    try {
      const deleted = await this.prisma.event.deleteMany({
        where: {
          googleEventId: eventId,
          userId,
        },
      });

      if (deleted.count > 0) {
        console.log(
          `[CalendarService] Deleted ${deleted.count} local event record(s) for Google event ${eventId}`,
        );
      }
    } catch (dbError: any) {
      console.error(
        '[CalendarService] Failed to delete local event record:',
        dbError?.message,
      );
      throw new InternalServerErrorException(
        'Wydarzenie usunięto z Google Calendar, ale nie udało się zsynchronizować lokalnej bazy',
      );
    }
  }
}
