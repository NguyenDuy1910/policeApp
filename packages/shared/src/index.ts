import { z } from 'zod';

export const INCIDENT_TYPES = ['fire', 'traffic_accident', 'fighting', 'public_security', 'other'] as const;
export const REPORT_STATUSES = ['submitted', 'received', 'processing', 'resolved'] as const;
export const PLACE_CATEGORIES = ['food', 'service'] as const;
export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;

export type IncidentType = (typeof INCIDENT_TYPES)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  fire: 'Cháy / hỏa hoạn',
  traffic_accident: 'Tai nạn giao thông',
  fighting: 'Đánh nhau',
  public_security: 'An ninh / trật tự',
  other: 'Sự việc khác',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: 'Đã gửi',
  received: 'Đã tiếp nhận',
  processing: 'Đang xử lý',
  resolved: 'Đã giải quyết',
};

const optionalText = (maximum: number) =>
  z.preprocess((value) => (value === '' || value === null ? undefined : value), z.string().trim().max(maximum).optional());
const optionalNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number().finite().optional(),
);
const clearableText = (maximum: number) =>
  z.preprocess((value) => (value === '' || value === null ? null : value), z.string().trim().max(maximum).nullable().optional());
const clearableNumber = z.preprocess(
  (value) => (value === '' || value === null ? null : value),
  z.coerce.number().finite().nullable().optional(),
);
const booleanInput = z.preprocess((value) => {
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return value;
}, z.boolean());

export const coordinateSchema = z.object({
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
});

export const createReportSchema = z
  .object({
    incidentType: z.enum(INCIDENT_TYPES),
    description: optionalText(2000),
    incidentLatitude: z.coerce.number().finite().min(-90).max(90),
    incidentLongitude: z.coerce.number().finite().min(-180).max(180),
    reporterLatitude: optionalNumber.refine((value) => value === undefined || (value >= -90 && value <= 90), 'Invalid reporter latitude'),
    reporterLongitude: optionalNumber.refine((value) => value === undefined || (value >= -180 && value <= 180), 'Invalid reporter longitude'),
    gpsAccuracy: optionalNumber.refine((value) => value === undefined || (value >= 0 && value <= 100_000), 'Invalid GPS accuracy'),
  })
  .superRefine((value, context) => {
    if ((value.reporterLatitude === undefined) !== (value.reporterLongitude === undefined)) {
      context.addIssue({ code: 'custom', message: 'Reporter latitude and longitude must be provided together' });
    }
  });

export const createReviewSchema = z.object({
  authorName: z.string().trim().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(1000),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(200),
});

export const reportStatusUpdateSchema = z.object({ status: z.enum(REPORT_STATUSES) });
export const reportAssignmentSchema = z.object({ policeUnitId: z.number().int().positive().nullable() });

export const policeUnitCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  administrativeLevel: z.string().trim().min(2).max(120),
  address: optionalText(400),
  dutyHotline: optionalText(40),
  latitude: optionalNumber.refine((value) => value === undefined || (value >= -90 && value <= 90), 'Invalid latitude'),
  longitude: optionalNumber.refine((value) => value === undefined || (value >= -180 && value <= 180), 'Invalid longitude'),
  verified: booleanInput.default(false),
  verificationSource: optionalText(400),
  active: booleanInput.default(true),
});

export const policeUnitUpdateSchema = policeUnitCreateSchema.partial().extend({
  address: clearableText(400),
  dutyHotline: clearableText(40),
  latitude: clearableNumber.refine((value) => value === undefined || value === null || (value >= -90 && value <= 90), 'Invalid latitude'),
  longitude: clearableNumber.refine((value) => value === undefined || value === null || (value >= -180 && value <= 180), 'Invalid longitude'),
  verificationSource: clearableText(400),
});

export const placeCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  category: z.enum(PLACE_CATEGORIES),
  address: z.string().trim().min(2).max(400),
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  verified: booleanInput.default(false),
  verificationSource: optionalText(400),
  dataSource: z.string().trim().min(2).max(200),
  active: booleanInput.default(true),
});

export const placeUpdateSchema = placeCreateSchema.partial().extend({
  verificationSource: clearableText(400),
});
export const reviewModerationSchema = z.object({ status: z.enum(REVIEW_STATUSES) });

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type PoliceUnitInput = z.infer<typeof policeUnitCreateSchema>;
export type PlaceInput = z.infer<typeof placeCreateSchema>;
export type PoliceUnitUpdateInput = z.infer<typeof policeUnitUpdateSchema>;
export type PlaceUpdateInput = z.infer<typeof placeUpdateSchema>;

export interface PoliceUnit {
  id: number;
  name: string;
  administrativeLevel: string;
  address: string | null;
  dutyHotline: string | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  verificationSource: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Place {
  id: number;
  name: string;
  category: PlaceCategory;
  address: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  verificationSource: string | null;
  dataSource: string;
  active: boolean;
  averageRating: number | null;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: number;
  placeId: number;
  authorName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSummary {
  id: string;
  incidentType: IncidentType;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDetails extends ReportSummary {
  description: string | null;
  incidentLatitude: number;
  incidentLongitude: number;
  reporterLatitude: number | null;
  reporterLongitude: number | null;
  gpsAccuracy: number | null;
  attachmentAvailable: boolean;
  attachmentOriginalName: string | null;
  attachmentSize: number | null;
  suggestedPoliceUnit: PoliceUnit | null;
  assignedPoliceUnit: PoliceUnit | null;
}

export interface ReportStatusHistory {
  id: number;
  reportId: string;
  status: ReportStatus;
  changedBy: string;
  actorName: string;
  createdAt: string;
}

export interface CreateReportResponse {
  report: ReportDetails;
  accessToken: string;
}

export interface DashboardCounts {
  total: number;
  submitted: number;
  received: number;
  processing: number;
  resolved: number;
}
