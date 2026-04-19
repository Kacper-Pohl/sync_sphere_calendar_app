import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OAuthProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateOAuthLogin(profile: OAuthProfileDto): Promise<any> {
    try {
      const user = await this.prisma.user.upsert({
        where: { email: profile.email },
        update: {
          googleId: profile.googleId,
          name: profile.name,
          image: profile.picture,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
        },
        create: {
          email: profile.email,
          googleId: profile.googleId,
          name: profile.name,
          image: profile.picture,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
        },
      });
      return user;
    } catch (err) {
      throw new InternalServerErrorException(`Auth validate process failed: ${err.message}`);
    }
  }

  async login(user: { email: string; id: string }) {
    const payload = { email: user.email, sub: user.id };
    return this.jwtService.sign(payload);
  }
}
