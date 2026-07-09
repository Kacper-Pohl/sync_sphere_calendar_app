import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvitationsService } from './invitations.service';
import type { RequestWithUser } from '../common/types';

@Controller('invitations')
@UseGuards(AuthGuard('jwt'))
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get('pending')
  getPending(@Req() req: RequestWithUser) {
    return this.invitationsService.getPendingInvitations(req.user.id);
  }

  @Post(':id/accept')
  accept(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.invitationsService.acceptInvitation(req.user.id, id);
  }

  @Post(':id/decline')
  decline(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.invitationsService.declineInvitation(req.user.id, id);
  }
}
