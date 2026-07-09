import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  BadGatewayException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleAuthService } from '../google/google-auth.service';
import { google } from 'googleapis';
import {
  APP_TIMEZONE,
  formatAppLocalDateTime,
} from '../common/datetime';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private readonly googleAuth: GoogleAuthService,
  ) {}

  async getPendingInvitations(userId: string) {
    return this.prisma.eventInvitation.findMany({
      where: { inviteeId: userId, status: 'PENDING' },
      include: {
        event: true,
        inviter: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  }

  async acceptInvitation(userId: string, invitationId: string) {
    const invitation = await this.prisma.eventInvitation.findUnique({
      where: { id: invitationId },
      include: { event: true },
    });

    if (!invitation) throw new NotFoundException('Zaproszenie nie istnieje');
    if (invitation.inviteeId !== userId)
      throw new ForbiddenException('To zaproszenie nie jest dla Ciebie');
    if (invitation.status !== 'PENDING')
      throw new BadRequestException('Zaproszenie zostało już przetworzone');

    const auth = await this.googleAuth.getOAuthClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    let googleEventId: string | undefined;

    try {
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: invitation.event.title,
          description: invitation.event.description,
          start: {
            dateTime: formatAppLocalDateTime(invitation.event.startDate),
            timeZone: APP_TIMEZONE,
          },
          end: {
            dateTime: formatAppLocalDateTime(invitation.event.endDate),
            timeZone: APP_TIMEZONE,
          },
        },
      });

      googleEventId = res.data.id ?? undefined;

      const accepted = await this.prisma.eventInvitation.updateMany({
        where: {
          id: invitationId,
          inviteeId: userId,
          status: 'PENDING',
        },
        data: { status: 'ACCEPTED' },
      });

      if (accepted.count === 0) {
        if (googleEventId) {
          try {
            await calendar.events.delete({
              calendarId: 'primary',
              eventId: googleEventId,
            });
          } catch (rollbackError: any) {
            console.error(
              '[InvitationsService] Failed to rollback Google event after concurrent accept:',
              rollbackError?.response?.data ?? rollbackError?.message,
            );
          }
        }

        throw new BadRequestException('Zaproszenie zostało już przetworzone');
      }

      return {
        success: true,
        message: 'Zaproszenie zaakceptowane i dodane do kalendarza',
      };
    } catch (e: any) {
      if (
        e instanceof NotFoundException ||
        e instanceof ForbiddenException ||
        e instanceof BadRequestException
      ) {
        throw e;
      }

      console.error('[InvitationsService] error accepting invitation:', e);
      throw new BadGatewayException(
        'Nie udało się dodać wydarzenia do Twojego kalendarza Google',
      );
    }
  }

  async declineInvitation(userId: string, invitationId: string) {
    const updated = await this.prisma.eventInvitation.updateMany({
      where: {
        id: invitationId,
        inviteeId: userId,
        status: 'PENDING',
      },
      data: { status: 'DECLINED' },
    });

    if (updated.count === 0) {
      const invitation = await this.prisma.eventInvitation.findUnique({
        where: { id: invitationId },
      });

      if (!invitation) throw new NotFoundException('Zaproszenie nie istnieje');
      if (invitation.inviteeId !== userId)
        throw new ForbiddenException('To zaproszenie nie jest dla Ciebie');
      throw new BadRequestException('Zaproszenie zostało już przetworzone');
    }

    return { success: true, message: 'Zaproszenie odrzucone' };
  }
}
