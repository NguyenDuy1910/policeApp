import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports/reports.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ReportsModule],
  controllers: [AdminAuthController, AdminController],
  providers: [AdminService],
})
export class AdminModule {}
