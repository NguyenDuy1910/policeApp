import type {
  CreateReportResponse,
  Place,
  PoliceUnit,
  ReportDetails,
  ReportStatusHistory,
  Review,
} from '@vnpolice/shared';
import type { ReportDraft } from '@/features/reports/report-draft';
import { uploadFormData, UploadTransportError } from '@/services/report-upload';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api';

interface ApiErrorPayload {
  message?: string;
  error?: string;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export function reportSubmissionErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Ứng dụng chưa thể chuẩn bị tin báo. Vui lòng thử lại.';
  if (error.status === 0) return 'Không thể kết nối trung tâm tiếp nhận. Kiểm tra mạng và thử lại.';
  if (error.status === 408) return 'Kết nối quá chậm nên lượt gửi đã hết thời gian chờ.';
  if (error.status === 413) return 'Ảnh vượt quá giới hạn 5 MB. Hãy chọn ảnh có dung lượng nhỏ hơn.';
  if (error.status === 429) return 'Thiết bị đã gửi nhiều tin trong thời gian ngắn. Vui lòng chờ rồi thử lại.';
  if (error.status >= 500) return 'Trung tâm tiếp nhận đang gián đoạn. Thông tin của bạn vẫn được giữ để gửi lại.';
  return error.message;
}

function isCreateReportResponse(value: unknown): value is CreateReportResponse {
  if (!value || typeof value !== 'object' || !('accessToken' in value) || !('report' in value)) return false;
  if (typeof value.accessToken !== 'string' || !value.report || typeof value.report !== 'object') return false;
  return 'id' in value.report && typeof value.report.id === 'string' && 'status' in value.report && typeof value.report.status === 'string';
}

function readErrorMessage(value: unknown, fallback: string): string {
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') return value.message;
  return fallback;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    let payload: ApiErrorPayload = {};
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = {};
    }
    throw new ApiError(payload.message ?? `Yêu cầu thất bại (${response.status}).`, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function fetchPoliceUnits(): Promise<PoliceUnit[]> {
  const response = await apiRequest<{ policeUnits: PoliceUnit[] }>('/police-units');
  return response.policeUnits;
}

export async function fetchPlaces(): Promise<Place[]> {
  const response = await apiRequest<{ places: Place[] }>('/places');
  return response.places;
}

export async function fetchReviews(placeId: number): Promise<Review[]> {
  const response = await apiRequest<{ reviews: Review[] }>(`/places/${placeId}/reviews`);
  return response.reviews;
}

export async function submitReview(placeId: number, authorName: string, rating: number, comment: string): Promise<Review> {
  const response = await apiRequest<{ review: Review }>(`/places/${placeId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorName, rating, comment }),
  });
  return response.review;
}

export async function submitReport(draft: ReportDraft, onProgress?: (percentage: number) => void): Promise<CreateReportResponse> {
  if (!draft.incidentType || !draft.incidentLocation) throw new Error('Thiếu loại hoặc vị trí sự cố.');
  const form = new FormData();
  form.append('incidentType', draft.incidentType);
  form.append('incidentLatitude', String(draft.incidentLocation.latitude));
  form.append('incidentLongitude', String(draft.incidentLocation.longitude));
  if (draft.description.trim()) form.append('description', draft.description.trim());
  if (draft.reporterLocation) {
    form.append('reporterLatitude', String(draft.reporterLocation.latitude));
    form.append('reporterLongitude', String(draft.reporterLocation.longitude));
    if (draft.reporterLocation.accuracy !== null) form.append('gpsAccuracy', String(draft.reporterLocation.accuracy));
  }
  if (draft.attachment) {
    const filePart = {
      uri: draft.attachment.uri,
      name: draft.attachment.fileName,
      type: draft.attachment.mimeType,
    } as unknown as Blob;
    form.append('attachment', filePart);
  }

  let response;
  try {
    response = await uploadFormData(`${API_URL}/reports`, form, onProgress);
  } catch (error) {
    if (error instanceof UploadTransportError) throw new ApiError(error.message, error.status);
    throw error;
  }

  let body: unknown;
  try {
    body = JSON.parse(response.bodyText);
  } catch {
    throw new ApiError(`Máy chủ trả về dữ liệu không hợp lệ (${response.status}).`, response.status);
  }
  if (response.status < 200 || response.status >= 300) {
    throw new ApiError(readErrorMessage(body, `Yêu cầu thất bại (${response.status}).`), response.status);
  }
  if (!isCreateReportResponse(body)) throw new ApiError('Máy chủ trả về tin báo không đầy đủ.', response.status);
  onProgress?.(100);
  return body;
}

export function reportAttachmentSource(reportId: string, accessToken: string) {
  return {
    uri: `${API_URL}/reports/${encodeURIComponent(reportId)}/attachment`,
    headers: { 'x-report-token': accessToken },
  };
}

export async function fetchReport(reportId: string, accessToken: string): Promise<ReportDetails> {
  const response = await apiRequest<{ report: ReportDetails }>(`/reports/${encodeURIComponent(reportId)}`, {
    headers: { 'x-report-token': accessToken },
  });
  return response.report;
}

export async function fetchReportHistory(reportId: string, accessToken: string): Promise<ReportStatusHistory[]> {
  const response = await apiRequest<{ history: ReportStatusHistory[] }>(`/reports/${encodeURIComponent(reportId)}/history`, {
    headers: { 'x-report-token': accessToken },
  });
  return response.history;
}
