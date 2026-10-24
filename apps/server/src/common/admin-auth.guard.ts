import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.session.adminUserId) throw new UnauthorizedException('Phiên quản trị không hợp lệ.');
    const activeAdmin = this.database.connection
      .prepare('SELECT 1 FROM admin_users WHERE id = ? AND active = 1')
      .get(request.session.adminUserId);
    if (!activeAdmin) throw new UnauthorizedException('Tài khoản quản trị không còn hiệu lực.');
    return true;
  }
}
