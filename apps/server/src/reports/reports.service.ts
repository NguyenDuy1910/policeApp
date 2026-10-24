import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateReportInput, CreateReportResponse, ReportDetails, ReportStatusHistory } from '@vnpolice/shared';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { findNearestVerifiedUnitId } from '../common/geo';
import { DatabaseService } from '../database/database.service';
import { mapHistory, mapReport } from '../database/mappers';

const REPORT_SELECT = `
  SELECT r.*,
    su.id AS suggested_id, su.name AS suggested_name,
    su.administrative_level AS suggested_administrative_level,
    su.address AS suggested_address, su.duty_hotline AS suggested_duty_hotline,
    su.latitude AS suggested_latitude, su.longitude AS suggested_longitude,
    su.verified AS suggested_verified, su.verification_source AS suggested_verification_source,
    su.active AS suggested_active, su.created_at AS suggested_created_at, su.updated_at AS suggested_updated_at,
    au.id AS assigned_id, au.name AS assigned_name,
    au.administrative_level AS assigned_administrative_level,
    au.address AS assigned_address, au.duty_hotline AS assigned_duty_hotline,
    au.latitude AS assigned_latitude, au.longitude AS assigned_longitude,
    au.verified AS assigned_verified, au.verification_source AS assigned_verification_source,
    au.active AS assigned_active, au.created_at AS assigned_created_at, au.updated_at AS assigned_updated_at
  FROM reports r
  LEFT JOIN police_units su ON su.id = r.suggested_police_unit_id
  LEFT JOIN police_units au ON au.id = r.assigned_police_unit_id
`;

const HISTORY_SELECT = `
  SELECT h.*,
    CASE WHEN h.changed_by = 'citizen-device' THEN 'Người báo tin' ELSE COALESCE(a.display_name, h.changed_by) END AS actor_name
  FROM report_status_history h
  LEFT JOIN admin_users a ON h.changed_by = 'admin:' || a.username
  WHERE h.report_id = ?
  ORDER BY h.created_at ASC, h.id ASC
`;

interface AttachmentInfo {
  path: string;
  mimeType: string;
  originalName: string;
}

const extensionByImageType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function hasValidImageSignature(attachment: Express.Multer.File): boolean {
  const data = attachment.buffer;
  if (attachment.mimetype === 'image/jpeg') {
    return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }
  if (attachment.mimetype === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return data.length >= signature.length && signature.every((byte, index) => data[index] === byte);
  }
  if (attachment.mimetype === 'image/webp') {
    return data.length >= 12 && data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
}

function capabilityHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class ReportsService {
  private readonly uploadDirectory: string;

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {
    this.uploadDirectory = resolve(process.cwd(), process.env.UPLOAD_DIR ?? './uploads');
    mkdirSync(this.uploadDirectory, { recursive: true });
  }

  createReport(input: CreateReportInput, attachment?: Express.Multer.File): CreateReportResponse {
    const reportId = this.generateReportId();
    const accessToken = randomBytes(32).toString('base64url');
    const timestamp = new Date().toISOString();
    const suggestedUnitId = findNearestVerifiedUnitId(this.database.connection, input.incidentLatitude, input.incidentLongitude);
    let storedName: string | null = null;
    if (attachment) {
      if (!hasValidImageSignature(attachment)) throw new BadRequestException('Nội dung tệp không khớp với định dạng ảnh được hỗ trợ.');
      storedName = `${randomUUID()}${extensionByImageType[attachment.mimetype]}`;
      writeFileSync(resolve(this.uploadDirectory, storedName), attachment.buffer, { flag: 'wx' });
    }
    const insertReport = this.database.connection.prepare(`
      INSERT INTO reports (
        id, access_token_hash, incident_type, description,
        incident_latitude, incident_longitude, reporter_latitude, reporter_longitude, gps_accuracy,
        attachment_stored_name, attachment_original_name, attachment_mime_type, attachment_size,
        suggested_police_unit_id, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
    `);
    const insertHistory = this.database.connection.prepare(`
      INSERT INTO report_status_history (report_id, status, changed_by, created_at)
      VALUES (?, 'submitted', 'citizen-device', ?)
    `);
    const create = this.database.connection.transaction(() => {
      insertReport.run(
        reportId,
        capabilityHash(accessToken),
        input.incidentType,
        input.description ?? null,
        input.incidentLatitude,
        input.incidentLongitude,
        input.reporterLatitude ?? null,
        input.reporterLongitude ?? null,
        input.gpsAccuracy ?? null,
        storedName,
        attachment?.originalname ?? null,
        attachment?.mimetype ?? null,
        attachment?.size ?? null,
        suggestedUnitId,
        timestamp,
        timestamp,
      );
      insertHistory.run(reportId, timestamp);
    });
    try {
      create();
    } catch (error) {
      if (storedName) unlinkSync(resolve(this.uploadDirectory, storedName));
      throw error;
    }
    return { report: this.getAuthorizedReport(reportId, accessToken), accessToken };
  }

  getAuthorizedReport(reportId: string, token: string | undefined): ReportDetails {
    if (!token) throw new NotFoundException('Không tìm thấy tin báo hoặc quyền truy cập không hợp lệ.');
    const row = this.database.connection
      .prepare(`${REPORT_SELECT} WHERE r.id = ? AND r.access_token_hash = ?`)
      .get(reportId, capabilityHash(token)) as Record<string, unknown> | undefined;
    if (!row) throw new NotFoundException('Không tìm thấy tin báo hoặc quyền truy cập không hợp lệ.');
    return mapReport(row);
  }

  getAuthorizedHistory(reportId: string, token: string | undefined): ReportStatusHistory[] {
    this.getAuthorizedReport(reportId, token);
    const rows = this.database.connection.prepare(HISTORY_SELECT).all(reportId) as Record<string, unknown>[];
    return rows.map((row) => mapHistory(row));
  }

  getAuthorizedAttachment(reportId: string, token: string | undefined): AttachmentInfo {
    this.getAuthorizedReport(reportId, token);
    return this.getAttachment(reportId);
  }

  getAdminReport(reportId: string): ReportDetails {
    const row = this.database.connection.prepare(`${REPORT_SELECT} WHERE r.id = ?`).get(reportId) as Record<string, unknown> | undefined;
    if (!row) throw new NotFoundException('Không tìm thấy tin báo.');
    return mapReport(row);
  }

  getAdminHistory(reportId: string): ReportStatusHistory[] {
    this.getAdminReport(reportId);
    const rows = this.database.connection.prepare(HISTORY_SELECT).all(reportId) as Record<string, unknown>[];
    return rows.map((row) => mapHistory(row));
  }

  getAttachment(reportId: string): AttachmentInfo {
    const row = this.database.connection
      .prepare('SELECT attachment_stored_name, attachment_mime_type, attachment_original_name FROM reports WHERE id = ?')
      .get(reportId) as Record<string, unknown> | undefined;
    if (!row?.attachment_stored_name) throw new NotFoundException('Tin báo không có tệp đính kèm.');
    const path = resolve(this.uploadDirectory, String(row.attachment_stored_name));
    if (!existsSync(path)) throw new NotFoundException('Tệp đính kèm không còn tồn tại.');
    return {
      path,
      mimeType: String(row.attachment_mime_type),
      originalName: String(row.attachment_original_name),
    };
  }

  private generateReportId(): string {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const suffix = randomInt(0, 36 ** 6).toString(36).toUpperCase().padStart(6, '0');
      const id = `VN-${date}-${suffix}`;
      if (!this.database.connection.prepare('SELECT 1 FROM reports WHERE id = ?').get(id)) return id;
    }
    return `VN-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
