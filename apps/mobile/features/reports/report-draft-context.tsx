import type { CreateReportResponse, IncidentType } from '@vnpolice/shared';
import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';
import { emptyReportDraft, type DraftAttachment, type DraftLocation, type ReportDraft } from './report-draft';

interface ReportDraftContextValue {
  draft: ReportDraft;
  latestResult: CreateReportResponse | null;
  begin: () => void;
  setIncidentType: (incidentType: IncidentType) => void;
  setIncidentLocation: (location: DraftLocation) => void;
  setReporterLocation: (location: DraftLocation) => void;
  setDescription: (description: string) => void;
  setAttachment: (attachment: DraftAttachment | null) => void;
  completeSubmission: (result: CreateReportResponse) => void;
}

const ReportDraftContext = createContext<ReportDraftContextValue | null>(null);

export function ReportDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<ReportDraft>(emptyReportDraft);
  const [latestResult, setLatestResult] = useState<CreateReportResponse | null>(null);
  const value = useMemo<ReportDraftContextValue>(
    () => ({
      draft,
      latestResult,
      begin() {
        setDraft(emptyReportDraft);
        setLatestResult(null);
      },
      setIncidentType(incidentType) {
        setDraft((current) => ({ ...current, incidentType }));
      },
      setIncidentLocation(incidentLocation) {
        setDraft((current) => ({ ...current, incidentLocation }));
      },
      setReporterLocation(reporterLocation) {
        setDraft((current) => ({ ...current, reporterLocation }));
      },
      setDescription(description) {
        setDraft((current) => ({ ...current, description }));
      },
      setAttachment(attachment) {
        setDraft((current) => ({ ...current, attachment }));
      },
      completeSubmission(result) {
        setLatestResult(result);
        setDraft(emptyReportDraft);
      },
    }),
    [draft, latestResult],
  );
  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>;
}

export function useReportDraft(): ReportDraftContextValue {
  const context = useContext(ReportDraftContext);
  if (!context) throw new Error('useReportDraft must be used inside ReportDraftProvider.');
  return context;
}
