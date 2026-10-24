import type { IncidentType } from '@vnpolice/shared';

export interface DraftLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  source: 'gps' | 'manual';
}

export interface DraftAttachment {
  uri: string;
  fileName: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileSize: number | null;
  width: number;
  height: number;
}

export interface ReportDraft {
  incidentType: IncidentType | null;
  incidentLocation: DraftLocation | null;
  reporterLocation: DraftLocation | null;
  description: string;
  attachment: DraftAttachment | null;
}

export const emptyReportDraft: ReportDraft = {
  incidentType: null,
  incidentLocation: null,
  reporterLocation: null,
  description: '',
  attachment: null,
};
