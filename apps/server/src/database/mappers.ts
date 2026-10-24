import type { Place, PoliceUnit, ReportDetails, ReportStatusHistory, Review } from '@vnpolice/shared';

type SqlRow = Record<string, unknown>;

export function mapPoliceUnit(row: SqlRow, prefix = ''): PoliceUnit {
  return {
    id: Number(row[`${prefix}id`]),
    name: String(row[`${prefix}name`]),
    administrativeLevel: String(row[`${prefix}administrative_level`]),
    address: row[`${prefix}address`] === null ? null : String(row[`${prefix}address`]),
    dutyHotline: row[`${prefix}duty_hotline`] === null ? null : String(row[`${prefix}duty_hotline`]),
    latitude: row[`${prefix}latitude`] === null ? null : Number(row[`${prefix}latitude`]),
    longitude: row[`${prefix}longitude`] === null ? null : Number(row[`${prefix}longitude`]),
    verified: Boolean(row[`${prefix}verified`]),
    verificationSource: row[`${prefix}verification_source`] === null ? null : String(row[`${prefix}verification_source`]),
    active: Boolean(row[`${prefix}active`]),
    createdAt: String(row[`${prefix}created_at`]),
    updatedAt: String(row[`${prefix}updated_at`]),
  };
}

export function mapPlace(row: SqlRow): Place {
  const average = row.average_rating;
  return {
    id: Number(row.id),
    name: String(row.name),
    category: row.category as Place['category'],
    address: String(row.address),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    verified: Boolean(row.verified),
    verificationSource: row.verification_source === null ? null : String(row.verification_source),
    dataSource: String(row.data_source),
    active: Boolean(row.active),
    averageRating: average === null || average === undefined ? null : Number(Number(average).toFixed(1)),
    reviewCount: Number(row.review_count ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapReview(row: SqlRow): Review {
  return {
    id: Number(row.id),
    placeId: Number(row.place_id),
    authorName: String(row.author_name),
    rating: Number(row.rating),
    comment: String(row.comment),
    status: row.status as Review['status'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapReport(row: SqlRow): ReportDetails {
  const suggested = row.suggested_id === null ? null : mapPoliceUnit(row, 'suggested_');
  const assigned = row.assigned_id === null ? null : mapPoliceUnit(row, 'assigned_');
  return {
    id: String(row.id),
    incidentType: row.incident_type as ReportDetails['incidentType'],
    status: row.status as ReportDetails['status'],
    description: row.description === null ? null : String(row.description),
    incidentLatitude: Number(row.incident_latitude),
    incidentLongitude: Number(row.incident_longitude),
    reporterLatitude: row.reporter_latitude === null ? null : Number(row.reporter_latitude),
    reporterLongitude: row.reporter_longitude === null ? null : Number(row.reporter_longitude),
    gpsAccuracy: row.gps_accuracy === null ? null : Number(row.gps_accuracy),
    attachmentAvailable: row.attachment_stored_name !== null,
    attachmentOriginalName: row.attachment_original_name === null ? null : String(row.attachment_original_name),
    attachmentSize: row.attachment_size === null ? null : Number(row.attachment_size),
    suggestedPoliceUnit: suggested,
    assignedPoliceUnit: assigned,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapHistory(row: SqlRow): ReportStatusHistory {
  return {
    id: Number(row.id),
    reportId: String(row.report_id),
    status: row.status as ReportStatusHistory['status'],
    changedBy: String(row.changed_by),
    actorName: String(row.actor_name ?? row.changed_by),
    createdAt: String(row.created_at),
  };
}
