import type { IncidentType } from '@vnpolice/shared';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'vnpolice-care.report-credentials.v1';

export interface ReportCredential {
  id: string;
  accessToken: string;
  incidentType: IncidentType;
  createdAt: string;
}

export async function loadReportCredentials(): Promise<ReportCredential[]> {
  const stored = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!stored) return [];
  try {
    const value = JSON.parse(stored) as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is ReportCredential => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<ReportCredential>;
      return typeof candidate.id === 'string' && typeof candidate.accessToken === 'string' && typeof candidate.createdAt === 'string';
    });
  } catch {
    return [];
  }
}

async function writeReportCredentials(credentials: ReportCredential[]): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(credentials), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function saveReportCredential(credential: ReportCredential): Promise<void> {
  const current = await loadReportCredentials();
  await writeReportCredentials([credential, ...current.filter((item) => item.id !== credential.id)].slice(0, 100));
}

/** Drops credentials the server no longer recognises (report removed or token rejected). */
export async function removeReportCredentials(reportIds: readonly string[]): Promise<void> {
  const current = await loadReportCredentials();
  await writeReportCredentials(current.filter((item) => !reportIds.includes(item.id)));
}

export async function findReportCredential(reportId: string): Promise<ReportCredential | null> {
  const credentials = await loadReportCredentials();
  return credentials.find((credential) => credential.id === reportId) ?? null;
}
