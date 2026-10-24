import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  placeCreateSchema,
  placeUpdateSchema,
  policeUnitCreateSchema,
  policeUnitUpdateSchema,
  reportAssignmentSchema,
  reportStatusUpdateSchema,
  reviewModerationSchema,
  type PlaceInput,
  type PlaceUpdateInput,
  type PoliceUnitInput,
  type PoliceUnitUpdateInput,
  type ReportStatus,
  type ReviewStatus,
} from '@vnpolice/shared';
import type { Request, Response } from 'express';
import { createReadStream } from 'node:fs';
import { AdminAuthGuard } from '../common/admin-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ReportsService } from '../reports/reports.service';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly adminService: AdminService,
    @Inject(ReportsService) private readonly reportsService: ReportsService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return { counts: this.adminService.dashboardCounts() };
  }

  @Get('reports')
  listReports(@Query('status') status?: string, @Query('incidentType') incidentType?: string) {
    return { reports: this.adminService.listReports(status, incidentType) };
  }

  @Get('reports/:id')
  getReport(@Param('id') reportId: string) {
    return this.adminService.getReport(reportId);
  }

  @Patch('reports/:id/status')
  updateStatus(
    @Param('id') reportId: string,
    @Body(new ZodValidationPipe(reportStatusUpdateSchema)) input: { status: ReportStatus },
    @Req() request: Request,
  ) {
    return { report: this.adminService.updateReportStatus(reportId, input.status, request.session.adminUsername ?? 'unknown') };
  }

  @Patch('reports/:id/assignment')
  updateAssignment(
    @Param('id') reportId: string,
    @Body(new ZodValidationPipe(reportAssignmentSchema)) input: { policeUnitId: number | null },
  ) {
    return { report: this.adminService.assignReport(reportId, input.policeUnitId) };
  }

  @Get('reports/:id/attachment')
  attachment(@Param('id') reportId: string, @Res() response: Response): void {
    const attachment = this.reportsService.getAttachment(reportId);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('Content-Type', attachment.mimeType);
    response.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`);
    createReadStream(attachment.path).on('error', (error) => response.destroy(error)).pipe(response);
  }

  @Get('police-units')
  listPoliceUnits() {
    return { policeUnits: this.adminService.listPoliceUnits() };
  }

  @Post('police-units')
  createPoliceUnit(@Body(new ZodValidationPipe(policeUnitCreateSchema)) input: PoliceUnitInput) {
    return { policeUnit: this.adminService.createPoliceUnit(input) };
  }

  @Patch('police-units/:id')
  updatePoliceUnit(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(policeUnitUpdateSchema)) input: PoliceUnitUpdateInput,
  ) {
    return { policeUnit: this.adminService.updatePoliceUnit(id, input) };
  }

  @Get('places')
  listPlaces() {
    return { places: this.adminService.listPlaces() };
  }

  @Post('places')
  createPlace(@Body(new ZodValidationPipe(placeCreateSchema)) input: PlaceInput) {
    return { place: this.adminService.createPlace(input) };
  }

  @Patch('places/:id')
  updatePlace(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(placeUpdateSchema)) input: PlaceUpdateInput,
  ) {
    return { place: this.adminService.updatePlace(id, input) };
  }

  @Get('reviews')
  listReviews(@Query('status') status?: string) {
    return { reviews: this.adminService.listReviews(status) };
  }

  @Patch('reviews/:id')
  moderateReview(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(reviewModerationSchema)) input: { status: ReviewStatus },
  ) {
    return { review: this.adminService.moderateReview(id, input.status) };
  }
}
