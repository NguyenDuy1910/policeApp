import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import type {
  Place,
  PlaceInput,
  PlaceUpdateInput,
  PoliceUnit,
  PoliceUnitInput,
  PoliceUnitUpdateInput,
  ReportDetails,
  ReportStatus,
  Review,
  ReviewStatus,
} from '@vnpolice/shared';
import { INCIDENT_TYPES, REPORT_STATUSES, REVIEW_STATUSES } from '@vnpolice/shared';
import bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import { mapPlace, mapPoliceUnit, mapReview } from '../database/mappers';
import { ReportsService } from '../reports/reports.service';

interface AuthenticatedAdmin {
  id: number;
  username: string;
  displayName: string;
}

interface AdminReportListItem {
  id: string;
  incidentType: string;
  description: string | null;
  incidentLatitude: number;
  incidentLongitude: number;
  status: ReportStatus;
  suggestedUnitName: string | null;
  assignedUnitName: string | null;
  attachmentAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminUserRow {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  active: number;
}

@Injectable()
export class AdminService {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(ReportsService) private readonly reports: ReportsService,
  ) {}

  async authenticate(username: string, password: string): Promise<AuthenticatedAdmin> {
    const row = this.database.connection
      .prepare('SELECT id, username, password_hash, display_name, active FROM admin_users WHERE username = ?')
      .get(username) as AdminUserRow | undefined;
    if (!row || !row.active || !(await bcrypt.compare(password, row.password_hash))) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng.');
    }
    return { id: row.id, username: row.username, displayName: row.display_name };
  }

  dashboardCounts() {
    const row = this.database.connection
      .prepare(`
        SELECT COUNT(*) AS total,
          SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS submitted,
          SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) AS received,
          SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
          SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
        FROM reports
      `)
      .get() as Record<string, number>;
    return {
      total: Number(row.total),
      submitted: Number(row.submitted),
      received: Number(row.received),
      processing: Number(row.processing),
      resolved: Number(row.resolved),
    };
  }

  listReports(status?: string, incidentType?: string): AdminReportListItem[] {
    if (status && !REPORT_STATUSES.includes(status as ReportStatus)) throw new BadRequestException('Trạng thái không hợp lệ.');
    if (incidentType && !INCIDENT_TYPES.includes(incidentType as (typeof INCIDENT_TYPES)[number])) {
      throw new BadRequestException('Loại sự cố không hợp lệ.');
    }
    const clauses: string[] = [];
    const parameters: string[] = [];
    if (status) {
      clauses.push('r.status = ?');
      parameters.push(status);
    }
    if (incidentType) {
      clauses.push('r.incident_type = ?');
      parameters.push(incidentType);
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.database.connection
      .prepare(`
        SELECT r.*, su.name AS suggested_unit_name, au.name AS assigned_unit_name
        FROM reports r
        LEFT JOIN police_units su ON su.id = r.suggested_police_unit_id
        LEFT JOIN police_units au ON au.id = r.assigned_police_unit_id
        ${where}
        ORDER BY r.created_at DESC
      `)
      .all(...parameters) as Record<string, unknown>[];
    return rows.map((row) => ({
      id: String(row.id),
      incidentType: String(row.incident_type),
      description: row.description === null ? null : String(row.description),
      incidentLatitude: Number(row.incident_latitude),
      incidentLongitude: Number(row.incident_longitude),
      status: row.status as ReportStatus,
      suggestedUnitName: row.suggested_unit_name === null ? null : String(row.suggested_unit_name),
      assignedUnitName: row.assigned_unit_name === null ? null : String(row.assigned_unit_name),
      attachmentAvailable: row.attachment_stored_name !== null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    }));
  }

  getReport(reportId: string) {
    return { report: this.reports.getAdminReport(reportId), history: this.reports.getAdminHistory(reportId) };
  }

  updateReportStatus(reportId: string, status: ReportStatus, username: string): ReportDetails {
    const report = this.reports.getAdminReport(reportId);
    if (report.status === status) return report;
    const currentIndex = REPORT_STATUSES.indexOf(report.status);
    const nextIndex = REPORT_STATUSES.indexOf(status);
    if (nextIndex !== currentIndex + 1) {
      throw new ConflictException(`Chỉ có thể chuyển từ ${report.status} sang ${REPORT_STATUSES[currentIndex + 1] ?? 'trạng thái kế tiếp'}.`);
    }
    const timestamp = new Date().toISOString();
    const update = this.database.connection.transaction(() => {
      this.database.connection.prepare('UPDATE reports SET status = ?, updated_at = ? WHERE id = ?').run(status, timestamp, reportId);
      this.database.connection
        .prepare('INSERT INTO report_status_history (report_id, status, changed_by, created_at) VALUES (?, ?, ?, ?)')
        .run(reportId, status, `admin:${username}`, timestamp);
    });
    update();
    return this.reports.getAdminReport(reportId);
  }

  assignReport(reportId: string, policeUnitId: number | null): ReportDetails {
    this.reports.getAdminReport(reportId);
    if (policeUnitId !== null) {
      const unit = this.database.connection.prepare('SELECT id FROM police_units WHERE id = ? AND active = 1').get(policeUnitId);
      if (!unit) throw new BadRequestException('Đơn vị được chọn không tồn tại hoặc đã bị vô hiệu hóa.');
    }
    this.database.connection
      .prepare('UPDATE reports SET assigned_police_unit_id = ?, updated_at = ? WHERE id = ?')
      .run(policeUnitId, new Date().toISOString(), reportId);
    return this.reports.getAdminReport(reportId);
  }

  listPoliceUnits(): PoliceUnit[] {
    const rows = this.database.connection.prepare('SELECT * FROM police_units ORDER BY active DESC, name').all() as Record<string, unknown>[];
    return rows.map((row) => mapPoliceUnit(row));
  }

  createPoliceUnit(input: PoliceUnitInput): PoliceUnit {
    this.validatePoliceUnit(input);
    const timestamp = new Date().toISOString();
    try {
      const result = this.database.connection
        .prepare(`
          INSERT INTO police_units
            (name, administrative_level, address, duty_hotline, latitude, longitude, verified, verification_source, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          input.name,
          input.administrativeLevel,
          input.address ?? null,
          input.dutyHotline ?? null,
          input.latitude ?? null,
          input.longitude ?? null,
          Number(input.verified),
          input.verificationSource ?? null,
          Number(input.active),
          timestamp,
          timestamp,
        );
      return this.getPoliceUnit(Number(result.lastInsertRowid));
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE')) throw new ConflictException('Tên đơn vị đã tồn tại.');
      throw error;
    }
  }

  updatePoliceUnit(id: number, patch: PoliceUnitUpdateInput): PoliceUnit {
    const current = this.getPoliceUnit(id);
    const merged: PoliceUnitInput = {
      name: patch.name ?? current.name,
      administrativeLevel: patch.administrativeLevel ?? current.administrativeLevel,
      address: patch.address === undefined ? current.address ?? undefined : patch.address ?? undefined,
      dutyHotline: patch.dutyHotline === undefined ? current.dutyHotline ?? undefined : patch.dutyHotline ?? undefined,
      latitude: patch.latitude === undefined ? current.latitude ?? undefined : patch.latitude ?? undefined,
      longitude: patch.longitude === undefined ? current.longitude ?? undefined : patch.longitude ?? undefined,
      verified: patch.verified ?? current.verified,
      verificationSource: patch.verificationSource === undefined ? current.verificationSource ?? undefined : patch.verificationSource ?? undefined,
      active: patch.active ?? current.active,
    };
    this.validatePoliceUnit(merged);
    this.database.connection
      .prepare(`
        UPDATE police_units SET name = ?, administrative_level = ?, address = ?, duty_hotline = ?, latitude = ?, longitude = ?,
          verified = ?, verification_source = ?, active = ?, updated_at = ? WHERE id = ?
      `)
      .run(
        merged.name,
        merged.administrativeLevel,
        merged.address ?? null,
        merged.dutyHotline ?? null,
        merged.latitude ?? null,
        merged.longitude ?? null,
        Number(merged.verified),
        merged.verificationSource ?? null,
        Number(merged.active),
        new Date().toISOString(),
        id,
      );
    return this.getPoliceUnit(id);
  }

  listPlaces(): Place[] {
    const rows = this.database.connection
      .prepare(`
        SELECT p.*, AVG(CASE WHEN r.status = 'approved' THEN r.rating END) AS average_rating,
          COUNT(CASE WHEN r.status = 'approved' THEN 1 END) AS review_count
        FROM places p LEFT JOIN reviews r ON r.place_id = p.id GROUP BY p.id ORDER BY p.active DESC, p.name
      `)
      .all() as Record<string, unknown>[];
    return rows.map((row) => mapPlace(row));
  }

  createPlace(input: PlaceInput): Place {
    this.validatePlace(input);
    const timestamp = new Date().toISOString();
    const result = this.database.connection
      .prepare(`
        INSERT INTO places
          (name, category, address, latitude, longitude, verified, verification_source, data_source, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        input.name,
        input.category,
        input.address,
        input.latitude,
        input.longitude,
        Number(input.verified),
        input.verificationSource ?? null,
        input.dataSource,
        Number(input.active),
        timestamp,
        timestamp,
      );
    return this.getPlace(Number(result.lastInsertRowid));
  }

  updatePlace(id: number, patch: PlaceUpdateInput): Place {
    const current = this.getPlace(id);
    const merged: PlaceInput = {
      name: patch.name ?? current.name,
      category: patch.category ?? current.category,
      address: patch.address ?? current.address,
      latitude: patch.latitude ?? current.latitude,
      longitude: patch.longitude ?? current.longitude,
      verified: patch.verified ?? current.verified,
      verificationSource: patch.verificationSource === undefined ? current.verificationSource ?? undefined : patch.verificationSource ?? undefined,
      dataSource: patch.dataSource ?? current.dataSource,
      active: patch.active ?? current.active,
    };
    this.validatePlace(merged);
    this.database.connection
      .prepare(`
        UPDATE places SET name = ?, category = ?, address = ?, latitude = ?, longitude = ?, verified = ?,
          verification_source = ?, data_source = ?, active = ?, updated_at = ? WHERE id = ?
      `)
      .run(
        merged.name,
        merged.category,
        merged.address,
        merged.latitude,
        merged.longitude,
        Number(merged.verified),
        merged.verificationSource ?? null,
        merged.dataSource,
        Number(merged.active),
        new Date().toISOString(),
        id,
      );
    return this.getPlace(id);
  }

  listReviews(status?: string): Review[] {
    if (status && !REVIEW_STATUSES.includes(status as ReviewStatus)) throw new BadRequestException('Trạng thái đánh giá không hợp lệ.');
    const rows = status
      ? this.database.connection.prepare('SELECT * FROM reviews WHERE status = ? ORDER BY created_at DESC').all(status)
      : this.database.connection.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
    return (rows as Record<string, unknown>[]).map((row) => mapReview(row));
  }

  moderateReview(id: number, status: ReviewStatus): Review {
    const existing = this.database.connection.prepare('SELECT id FROM reviews WHERE id = ?').get(id);
    if (!existing) throw new NotFoundException('Không tìm thấy đánh giá.');
    this.database.connection.prepare('UPDATE reviews SET status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), id);
    const row = this.database.connection.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as Record<string, unknown>;
    return mapReview(row);
  }

  private getPoliceUnit(id: number): PoliceUnit {
    const row = this.database.connection.prepare('SELECT * FROM police_units WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row) throw new NotFoundException('Không tìm thấy đơn vị công an.');
    return mapPoliceUnit(row);
  }

  private getPlace(id: number): Place {
    const row = this.database.connection
      .prepare(`
        SELECT p.*, AVG(CASE WHEN r.status = 'approved' THEN r.rating END) AS average_rating,
          COUNT(CASE WHEN r.status = 'approved' THEN 1 END) AS review_count
        FROM places p LEFT JOIN reviews r ON r.place_id = p.id WHERE p.id = ? GROUP BY p.id
      `)
      .get(id) as Record<string, unknown> | undefined;
    if (!row) throw new NotFoundException('Không tìm thấy địa điểm.');
    return mapPlace(row);
  }

  private validatePoliceUnit(input: PoliceUnitInput): void {
    if ((input.latitude === undefined) !== (input.longitude === undefined)) {
      throw new BadRequestException('Tọa độ phải gồm cả vĩ độ và kinh độ.');
    }
    if (input.verified && (input.latitude === undefined || !input.verificationSource)) {
      throw new BadRequestException('Đơn vị được xác minh phải có tọa độ và nguồn xác minh.');
    }
  }

  private validatePlace(input: PlaceInput): void {
    if (input.verified && !input.verificationSource) {
      throw new BadRequestException('Cơ sở được xác minh phải có nguồn xác minh.');
    }
  }
}
