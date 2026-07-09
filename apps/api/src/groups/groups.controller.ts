import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from './groups.service';
import type { RequestWithUser } from '../common/types';

@Controller('groups')
@UseGuards(AuthGuard('jwt'))
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  createGroup(@Req() req: RequestWithUser, @Body('name') name: string) {
    return this.groupsService.createGroup(req.user.id, name);
  }

  @Get()
  getGroups(@Req() req: RequestWithUser) {
    return this.groupsService.getGroups(req.user.id);
  }

  @Post(':id/members')
  addMember(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body('email') email: string,
  ) {
    return this.groupsService.addMember(req.user.id, id, email);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupsService.removeMember(req.user.id, id, memberId);
  }

  @Delete(':id/leave')
  leaveGroup(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.groupsService.leaveGroup(req.user.id, id);
  }

  @Delete(':id')
  deleteGroup(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.groupsService.deleteGroup(req.user.id, id);
  }
}
