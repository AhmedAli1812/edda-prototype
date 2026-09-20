import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('الحالة العامة (Health)')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'فحص جاهزية الخادم وحالة الخدمات' })
  check() {
    return {
      status: 'ok',
      service: 'edda-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      version: '1.0.0',
    };
  }
}
