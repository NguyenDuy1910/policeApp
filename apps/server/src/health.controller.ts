import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', service: 'vnpolice-care', framework: 'nestjs', timestamp: new Date().toISOString() };
  }
}
