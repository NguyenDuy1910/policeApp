import type {
  DashboardCounts,
  IncidentType,
  Place,
  PlaceInput,
  PlaceUpdateInput,
  PoliceUnit,
  PoliceUnitInput,
  PoliceUnitUpdateInput,
  ReportDetails,
  ReportStatus,
  ReportStatusHistory,
  Review,
  ReviewStatus,
} from '@vnpolice/shared';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const ADMIN_SESSION_EXPIRED_EVENT = 'vnpc:admin-session-expired';

export interface AdminReportListItem {
  id: string;
  incidentType: IncidentType;
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

export interface AdminSession {
  authenticated: boolean;
  username?: string;
  displayName?: string;
}

interface ApiErrorBody {
  message?: string;
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, credentials: 'include' });
  if (response.status === 401 && path !== '/admin/login' && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED_EVENT));
  }
  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = {};
    }
    throw new Error(body.message ?? `Yêu cầu thất bại (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const jsonRequest = (method: 'POST' | 'PATCH', body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const adminApi = {
  me: () => adminRequest<AdminSession>('/admin/me'),
  login: (username: string, password: string) =>
    adminRequest<{ admin: { username: string; displayName: string } }>('/admin/login', jsonRequest('POST', { username, password })),
  logout: () => adminRequest<void>('/admin/logout', { method: 'POST' }),
  dashboard: async () => (await adminRequest<{ counts: DashboardCounts }>('/admin/dashboard')).counts,
  reports: async (status: string, incidentType: string) => {
    const parameters = new URLSearchParams();
    if (status) parameters.set('status', status);
    if (incidentType) parameters.set('incidentType', incidentType);
    const suffix = parameters.size > 0 ? `?${parameters.toString()}` : '';
    return (await adminRequest<{ reports: AdminReportListItem[] }>(`/admin/reports${suffix}`)).reports;
  },
  report: (id: string) => adminRequest<{ report: ReportDetails; history: ReportStatusHistory[] }>(`/admin/reports/${encodeURIComponent(id)}`),
  assignReport: async (id: string, policeUnitId: number | null) =>
    (await adminRequest<{ report: ReportDetails }>(`/admin/reports/${encodeURIComponent(id)}/assignment`, jsonRequest('PATCH', { policeUnitId }))).report,
  updateReportStatus: async (id: string, status: ReportStatus) =>
    (await adminRequest<{ report: ReportDetails }>(`/admin/reports/${encodeURIComponent(id)}/status`, jsonRequest('PATCH', { status }))).report,
  policeUnits: async () => (await adminRequest<{ policeUnits: PoliceUnit[] }>('/admin/police-units')).policeUnits,
  createPoliceUnit: async (input: PoliceUnitInput) =>
    (await adminRequest<{ policeUnit: PoliceUnit }>('/admin/police-units', jsonRequest('POST', input))).policeUnit,
  updatePoliceUnit: async (id: number, input: PoliceUnitUpdateInput) =>
    (await adminRequest<{ policeUnit: PoliceUnit }>(`/admin/police-units/${id}`, jsonRequest('PATCH', input))).policeUnit,
  places: async () => (await adminRequest<{ places: Place[] }>('/admin/places')).places,
  createPlace: async (input: PlaceInput) => (await adminRequest<{ place: Place }>('/admin/places', jsonRequest('POST', input))).place,
  updatePlace: async (id: number, input: PlaceUpdateInput) =>
    (await adminRequest<{ place: Place }>(`/admin/places/${id}`, jsonRequest('PATCH', input))).place,
  reviews: async (status = '') => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return (await adminRequest<{ reviews: Review[] }>(`/admin/reviews${query}`)).reviews;
  },
  moderateReview: async (id: number, status: ReviewStatus) =>
    (await adminRequest<{ review: Review }>(`/admin/reviews/${id}`, jsonRequest('PATCH', { status }))).review,
};
