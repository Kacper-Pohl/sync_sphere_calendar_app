import { Controller, Get, UseGuards, Req } from '@nestjs/common';
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
}
