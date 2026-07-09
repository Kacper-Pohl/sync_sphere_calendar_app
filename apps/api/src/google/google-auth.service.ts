import { Injectable, UnauthorizedException } from '@nestjs/common';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoogleAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async getOAuthClient(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.accessToken) {
      throw new UnauthorizedException(
        'Brak połączenia z kontem Google. Zaloguj się ponownie.',
      );
    }

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
        console.log(`[GoogleAuthService] Access token refreshed for user ${userId}`);
      }
    });

    return oauth2Client;
  }
}
