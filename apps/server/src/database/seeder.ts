import { REPORT_STATUSES } from '@vnpolice/shared';
import bcrypt from 'bcrypt';
import type Database from 'better-sqlite3';
import { createHash, randomBytes } from 'node:crypto';
import { copyFileSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { findNearestVerifiedUnitId } from '../common/geo';
import {
  PLACE_DATA_SOURCE,
  PLACE_VERIFICATION_SOURCE,
  POLICE_UNIT_VERIFICATION_SOURCE,
  seedPlaces,
  seedPoliceUnits,
  seedReports,
  seedReviews,
  type SeedMoment,
} from './seed-data';

const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000;
const MINUTE_MS = 60_000;

/** Converts a relative seed moment into an absolute instant; `at` is local Asia/Ho_Chi_Minh wall-clock time. */
export function resolveSeedMoment(moment: SeedMoment, now: Date): Date {
  if ('minutesAgo' in moment) return new Date(now.getTime() - moment.minutesAgo * MINUTE_MS);
  const local = new Date(now.getTime() + VIETNAM_UTC_OFFSET_MS);
  const [hours, minutes] = moment.at.split(':').map(Number);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - moment.daysAgo, hours, minutes) - VIETNAM_UTC_OFFSET_MS,
  );
}

function isEmpty(connection: Database.Database, table: 'reviews' | 'reports'): boolean {
  return connection.prepare(`SELECT COUNT(*) FROM ${table}`).pluck().get() === 0;
}

/**
 * Seeds reference data (units, places, admin) idempotently by primary key, and activity data
 * (reviews, incident reports with status history) only into empty tables, so restarts never
 * duplicate or overwrite records created through the apps.
 */
export function seedDatabase(connection: Database.Database, now = new Date()): void {
  const username = process.env.ADMIN_USERNAME ?? 'admin';
  const password = process.env.ADMIN_PASSWORD ?? 'DemoAdmin!2026';
  const displayName = process.env.ADMIN_DISPLAY_NAME ?? 'Trực ban Trung tâm Chỉ huy';
  const officer = `admin:${username}`;
  const referenceTimestamp = resolveSeedMoment({ daysAgo: 90, at: '08:00' }, now).toISOString();
  const uploadDirectory = resolve(process.cwd(), process.env.UPLOAD_DIR ?? './uploads');
  const shouldSeedReports = isEmpty(connection, 'reports');
  const copiedAttachments: string[] = [];
  mkdirSync(uploadDirectory, { recursive: true });
  if (shouldSeedReports) {
    for (const report of seedReports) {
      if (!report.attachment) continue;
      const destination = resolve(uploadDirectory, `seed-${report.code.toLowerCase()}.jpg`);
      copyFileSync(resolve(__dirname, '../../seed-assets/incidents', report.attachment.sourceFile), destination);
      copiedAttachments.push(destination);
    }
  }


  const insertUnit = connection.prepare(`
    INSERT OR IGNORE INTO police_units
      (id, name, administrative_level, address, duty_hotline, latitude, longitude, verified, verification_source, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?, ?)
  `);
  const insertPlace = connection.prepare(`
    INSERT OR IGNORE INTO places
      (id, name, category, address, latitude, longitude, verified, verification_source, data_source, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  const insertReview = connection.prepare(`
    INSERT INTO reviews (place_id, author_name, rating, comment, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertAdmin = connection.prepare(`
    INSERT OR IGNORE INTO admin_users (username, password_hash, display_name, active, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, ?)
  `);
  const insertReport = connection.prepare(`
    INSERT INTO reports (
      id, access_token_hash, incident_type, description,
      incident_latitude, incident_longitude, reporter_latitude, reporter_longitude, gps_accuracy,
      attachment_stored_name, attachment_original_name, attachment_mime_type, attachment_size,
      suggested_police_unit_id, assigned_police_unit_id, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertHistory = connection.prepare(`
    INSERT INTO report_status_history (report_id, status, changed_by, created_at) VALUES (?, ?, ?, ?)
  `);

  const seed = connection.transaction(() => {
    for (const unit of seedPoliceUnits) {
      insertUnit.run(
        unit.id,
        unit.name,
        unit.level,
        `${unit.area}, tỉnh Cà Mau`,
        unit.hotline,
        unit.latitude,
        unit.longitude,
        POLICE_UNIT_VERIFICATION_SOURCE,
        referenceTimestamp,
        referenceTimestamp,
      );
    }
    for (const place of seedPlaces) {
      insertPlace.run(
        place.id,
        place.name,
        place.category,
        place.address,
        place.latitude,
        place.longitude,
        Number(place.verified),
        place.verified ? PLACE_VERIFICATION_SOURCE : null,
        PLACE_DATA_SOURCE,
        referenceTimestamp,
        referenceTimestamp,
      );
    }
    insertAdmin.run(username, bcrypt.hashSync(password, 12), displayName, referenceTimestamp, referenceTimestamp);

    if (isEmpty(connection, 'reviews')) {
      for (const review of seedReviews) {
        const createdAt = resolveSeedMoment(review.at, now).toISOString();
        insertReview.run(review.placeId, review.author, review.rating, review.comment, review.status, createdAt, createdAt);
      }
    }

    if (shouldSeedReports) {
      for (const report of seedReports) {
        const submittedAt = resolveSeedMoment(report.reportedAt, now);
        const reportId = `VN-${submittedAt.toISOString().slice(0, 10).replaceAll('-', '')}-${report.code}`;
        const [latitude, longitude] = report.incident;
        const suggestedUnitId = findNearestVerifiedUnitId(connection, latitude, longitude);
        const transitions = report.progress.map((minutes, index) => ({
          status: REPORT_STATUSES[index + 1],
          at: new Date(submittedAt.getTime() + minutes * MINUTE_MS).toISOString(),
        }));
        const lastUpdate = transitions.at(-1)?.at ?? submittedAt.toISOString();
        insertReport.run(
          reportId,
          createHash('sha256').update(randomBytes(32)).digest('hex'),
          report.incidentType,
          report.description,
          latitude,
          longitude,
          report.reporterOffset ? latitude + report.reporterOffset[0] : null,
          report.reporterOffset ? longitude + report.reporterOffset[1] : null,
          report.gpsAccuracy,
          report.attachment ? `seed-${report.code.toLowerCase()}.jpg` : null,
          report.attachment?.originalName ?? null,
          report.attachment ? 'image/jpeg' : null,
          report.attachment ? statSync(resolve(uploadDirectory, `seed-${report.code.toLowerCase()}.jpg`)).size : null,
          suggestedUnitId,
          transitions.length > 0 ? suggestedUnitId : null,
          REPORT_STATUSES[transitions.length],
          submittedAt.toISOString(),
          lastUpdate,
        );
        insertHistory.run(reportId, 'submitted', 'citizen-device', submittedAt.toISOString());
        for (const transition of transitions) insertHistory.run(reportId, transition.status, officer, transition.at);
      }
    }
  });
  try {
    seed();
  } catch (error) {
    for (const path of copiedAttachments) {
      try {
        unlinkSync(path);
      } catch {
        // Preserve the database error; cleanup is best-effort.
      }
    }
    throw error;
  }
}
