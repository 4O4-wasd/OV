import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentAuth } from './current-auth.decorator.js';
import { SessionGuard } from './session.guard.js';
import { SessionsService } from './sessions.service.js';

/**
 * Sessions
 */
@ApiTags('sessions')
@ApiBearerAuth()
@Controller('api')
@UseGuards(SessionGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  /**
   * List all sessions for the current user
   */
  @Get('sessions')
  list(@CurrentAuth() auth: CurrentAuth) {
    return this.sessionsService.list(auth);
  }

  /**
   * Delete one of the current user's sessions (cannot delete the current one)
   */
  @Delete('session/:id')
  delete(
    @CurrentAuth() auth: CurrentAuth,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sessionsService.delete(auth, id);
  }
}
