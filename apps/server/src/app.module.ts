import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { PublicModule } from './public/public.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [DatabaseModule, PublicModule, ReportsModule, AdminModule],
  controllers: [HealthController],
})
export class AppModule {}
