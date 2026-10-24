import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReportSchema, type CreateReportInput } from '@vnpolice/shared';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ReportsService } from './reports.service';

const allowedImageTypes: Record<string, true> = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
};

@Controller('reports')
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(201)
  @UseInterceptors(
    FileInterceptor('attachment', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (!allowedImageTypes[file.mimetype]) {
          callback(new BadRequestException('Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  createReport(
    @Body(new ZodValidationPipe(createReportSchema)) input: CreateReportInput,
    @UploadedFile() attachment?: Express.Multer.File,
  ) {
    return this.reportsService.createReport(input, attachment);
  }

  @Get(':id')
  getReport(@Param('id') reportId: string, @Headers('x-report-token') token?: string) {
    return { report: this.reportsService.getAuthorizedReport(reportId, token) };
  }

  @Get(':id/attachment')
  attachment(
    @Param('id') reportId: string,
    @Headers('x-report-token') token: string | undefined,
    @Res() response: Response,
  ): void {
    const attachment = this.reportsService.getAuthorizedAttachment(reportId, token);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Content-Type', attachment.mimeType);
    response.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`);
    createReadStream(attachment.path).on('error', (error) => response.destroy(error)).pipe(response);
  }

  @Get(':id/history')
  getHistory(@Param('id') reportId: string, @Headers('x-report-token') token?: string) {
    return { history: this.reportsService.getAuthorizedHistory(reportId, token) };
  }
}
