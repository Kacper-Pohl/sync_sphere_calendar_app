import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CalendarService } from './calendar.service';
import type { RequestWithUser } from '../common/types';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  @UseGuards(AuthGuard('jwt'))
  async getEvents(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const events = await this.calendarService.getEvents(userId);
    return { success: true, events };
  }

  @Post('events')
  @UseGuards(AuthGuard('jwt'))
  async createEvent(
    @Req() req: RequestWithUser,
    @Body()
    body: { summary: string; description?: string; start: string; end: string },
  ) {
    const userId = req.user.id;
    const event = await this.calendarService.createEvent(userId, body);
    return { success: true, event };
  }

  @Delete('events/:eventId')
  @UseGuards(AuthGuard('jwt'))
  async deleteEvent(
    @Req() req: RequestWithUser,
    @Param('eventId') eventId: string,
  ) {
    const userId = req.user.id;
    await this.calendarService.deleteEvent(userId, eventId);
    return { success: true };
  }
}
