export interface UploadResponse {
  status: number;
  bodyText: string;
}

export class UploadTransportError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'UploadTransportError';
  }
}

export type UploadRequestFactory = () => XMLHttpRequest;

/**
 * XMLHttpRequest is required here because React Native fetch does not expose upload progress.
 * Use the standard Promise constructor: Hermes in the supported Expo SDK does not implement
 * Promise.withResolvers.
 */
export function uploadFormData(
  url: string,
  form: FormData,
  onProgress?: (percentage: number) => void,
  createRequest: UploadRequestFactory = () => new XMLHttpRequest(),
): Promise<UploadResponse> {
  return new Promise<UploadResponse>((resolve, reject) => {
    const request = createRequest();
    request.open('POST', url);
    request.timeout = 30_000;
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0 || !onProgress) return;
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    request.onerror = () => reject(new UploadTransportError('Không thể kết nối máy chủ. Kiểm tra Wi-Fi hoặc địa chỉ API rồi thử lại.', 0));
    request.ontimeout = () => reject(new UploadTransportError('Gửi tin quá thời gian chờ. Vui lòng thử lại.', 408));
    request.onload = () => resolve({ status: request.status, bodyText: request.responseText });
    request.send(form);
  });
}
