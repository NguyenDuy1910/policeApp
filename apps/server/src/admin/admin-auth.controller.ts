import { Body, Controller, Get, HttpCode, Inject, Post, Req } from '@nestjs/common';
import { loginSchema } from '@vnpolice/shared';
import type { Request } from 'express';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminAuthController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: { username: string; password: string },
    @Req() request: Request,
  ) {
    const admin = await this.adminService.authenticate(input.username, input.password);
    await new Promise<void>((resolve, reject) => {
      request.session.regenerate((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    request.session.adminUserId = admin.id;
    request.session.adminUsername = admin.username;
    request.session.adminDisplayName = admin.displayName;
    await new Promise<void>((resolve, reject) => {
      request.session.save((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    return { admin: { username: admin.username, displayName: admin.displayName } };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: Request): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  @Get('me')
  currentAdmin(@Req() request: Request) {
    if (!request.session.adminUserId) return { authenticated: false };
    return { authenticated: true, username: request.session.adminUsername, displayName: request.session.adminDisplayName };
  }
}
