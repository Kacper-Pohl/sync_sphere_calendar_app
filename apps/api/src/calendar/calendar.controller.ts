import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CalendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  @UseGuards(AuthGuard('jwt'))
  async getEvents(@Req() req: any) {
    const userId = req.user.userId;
    const events = await this.calendarService.getEvents(userId);
    return { success: true, events };
  }

  @Post('events')
  @UseGuards(AuthGuard('jwt'))
  async createEvent(@Req() req: any, @Body() body: { summary: string; description?: string; start: string; end: string }) {
    const userId = req.user.userId;
    const event = await this.calendarService.createEvent(userId, body);
    return { success: true, event };
  }
}
