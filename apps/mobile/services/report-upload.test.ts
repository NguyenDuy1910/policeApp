import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadFormData, UploadTransportError } from './report-upload';

class FakeUploadRequest {
  readonly upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };
  method = '';
  url = '';
  timeout = 0;
  status = 0;
  responseText = '';
  sentBody: Document | XMLHttpRequestBodyInit | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onload: (() => void) | null = null;

  open(method: string, url: string): void {
    this.method = method;
    this.url = url;
  }

  send(body: Document | XMLHttpRequestBodyInit | null): void {
    this.sentBody = body;
  }
}

const originalWithResolvers = Promise.withResolvers;

afterEach(() => {
  Object.defineProperty(Promise, 'withResolvers', { configurable: true, value: originalWithResolvers, writable: true });
  vi.restoreAllMocks();
});

describe('uploadFormData', () => {
  it('uploads and reports progress when Promise.withResolvers is unavailable in Hermes', async () => {
    Object.defineProperty(Promise, 'withResolvers', { configurable: true, value: undefined, writable: true });
    const request = new FakeUploadRequest();
    const progress: number[] = [];
    const form = new FormData();
    form.append('incidentType', 'traffic_accident');

    const result = uploadFormData(
      'http://127.0.0.1:3000/api/reports',
      form,
      (percentage) => progress.push(percentage),
      () => request as unknown as XMLHttpRequest,
    );

    request.upload.onprogress?.({ lengthComputable: true, loaded: 2, total: 4 } as ProgressEvent);
    request.status = 201;
    request.responseText = '{"report":{"id":"VN-1"}}';
    request.onload?.();

    await expect(result).resolves.toEqual({ status: 201, bodyText: request.responseText });
    expect(request.method).toBe('POST');
    expect(request.url).toBe('http://127.0.0.1:3000/api/reports');
    expect(request.timeout).toBe(30_000);
    expect(request.sentBody).toBe(form);
    expect(progress).toEqual([50]);
  });

  it('returns stable transport errors for offline and timeout failures', async () => {
    const offlineRequest = new FakeUploadRequest();
    const offline = uploadFormData('http://localhost/reports', new FormData(), undefined, () => offlineRequest as unknown as XMLHttpRequest);
    offlineRequest.onerror?.();
    await expect(offline).rejects.toEqual(new UploadTransportError('Không thể kết nối máy chủ. Kiểm tra Wi-Fi hoặc địa chỉ API rồi thử lại.', 0));

    const timeoutRequest = new FakeUploadRequest();
    const timeout = uploadFormData('http://localhost/reports', new FormData(), undefined, () => timeoutRequest as unknown as XMLHttpRequest);
    timeoutRequest.ontimeout?.();
    await expect(timeout).rejects.toEqual(new UploadTransportError('Gửi tin quá thời gian chờ. Vui lòng thử lại.', 408));
  });
});
