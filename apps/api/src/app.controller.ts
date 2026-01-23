import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DbService } from './db.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly db: DbService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('db-health')
  async dbHealth() {
    const ok = await this.db.ping();
    return { ok };
  }
}
