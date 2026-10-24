import { AlertTriangle, Camera, CheckCircle2, Clock3, MapPin, Radio, ShieldCheck, X } from 'lucide-react';
import { INCIDENT_LABELS, REPORT_STATUSES, STATUS_LABELS, type DashboardCounts, type PoliceUnit, type ReportDetails, type ReportStatus, type ReportStatusHistory } from '@vnpolice/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApi, API_URL, type AdminReportListItem } from '../api';
import { MapPicker } from '../components/MapPicker';

interface ReportDetailState {
  report: ReportDetails;
  history: ReportStatusHistory[];
}

const emptyCounts: DashboardCounts = { total: 0, submitted: 0, received: 0, processing: 0, resolved: 0 };

const countCards: { key: keyof DashboardCounts; label: string; icon: typeof Radio }[] = [
  { key: 'total', label: 'Tổng tin báo', icon: Radio },
  { key: 'submitted', label: 'Mới gửi', icon: AlertTriangle },
  { key: 'received', label: 'Đã tiếp nhận', icon: ShieldCheck },
  { key: 'processing', label: 'Đang xử lý', icon: Clock3 },
  { key: 'resolved', label: 'Đã giải quyết', icon: CheckCircle2 },
];

export function Incidents() {
  const [reports, setReports] = useState<AdminReportListItem[]>([]);
  const [counts, setCounts] = useState<DashboardCounts>(emptyCounts);
  const [policeUnits, setPoliceUnits] = useState<PoliceUnit[]>([]);
  const [status, setStatus] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReportDetailState | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [attachmentError, setAttachmentError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    try {
      const [nextReports, nextCounts, nextUnits] = await Promise.all([
        adminApi.reports(status, incidentType),
        adminApi.dashboard(),
        adminApi.policeUnits(),
      ]);
      setReports(nextReports);
      setCounts(nextCounts);
      setPoliceUnits(nextUnits);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được dữ liệu.');
    }
  }, [incidentType, status]);

  useEffect(() => {
    void loadOverview();
    const timer = window.setInterval(() => void loadOverview(), 5_000);
    return () => window.clearInterval(timer);
  }, [loadOverview]);

  async function openReport(reportId: string): Promise<void> {
    setSelectedId(reportId);
    setAttachmentError(false);
    setLoadingDetail(true);
    try {
      setDetail(await adminApi.report(reportId));
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được chi tiết.');
      setSelectedId(null);
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function assign(policeUnitId: number | null): Promise<void> {
    if (!selectedId) return;
    setBusy(true);
    try {
      const report = await adminApi.assignReport(selectedId, policeUnitId);
      setDetail((current) => (current ? { ...current, report } : current));
      await loadOverview();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không thể phân công.');
    } finally {
      setBusy(false);
    }
  }

  async function advanceStatus(): Promise<void> {
    if (!selectedId || !detail) return;
    const currentIndex = REPORT_STATUSES.indexOf(detail.report.status);
    const nextStatus = REPORT_STATUSES[currentIndex + 1];
    if (!nextStatus) return;
    setBusy(true);
    try {
      await adminApi.updateReportStatus(selectedId, nextStatus);
      setDetail(await adminApi.report(selectedId));
      await loadOverview();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Không thể cập nhật trạng thái.');
    } finally {
      setBusy(false);
    }
  }

  const nextStatus = detail ? REPORT_STATUSES[REPORT_STATUSES.indexOf(detail.report.status) + 1] : undefined;
  const activePoliceUnits = useMemo(() => policeUnits.filter((unit) => unit.active), [policeUnits]);
  const assignmentOptions = useMemo(() => {
    const assigned = detail?.report.assignedPoliceUnit;
    if (assigned && !activePoliceUnits.some((unit) => unit.id === assigned.id)) return [assigned, ...activePoliceUnits];
    return activePoliceUnits;
  }, [activePoliceUnits, detail?.report.assignedPoliceUnit]);
  const visibleReports = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('vi-VN');
    if (!normalized) return reports;
    return reports.filter((report) =>
      [report.id, report.description, report.assignedUnitName, report.suggestedUnitName]
        .some((value) => value?.toLocaleLowerCase('vi-VN').includes(normalized)),
    );
  }, [reports, search]);

  return (
    <section className="module">
      <div className="module-heading">
        <div>
          <p className="eyebrow">Trung tâm điều hành</p>
          <h1>Quản lý tin báo</h1>
          <p>Danh sách tự đồng bộ mỗi 5 giây. Tọa độ sự cố và thiết bị báo tin luôn được phân biệt.</p>
        </div>
        <div className={`live-indicator${error ? ' live-indicator--error' : ''}`}><span /> {error ? 'Đồng bộ gián đoạn' : 'Đang đồng bộ'}</div>
      </div>

      {error ? <div className="error-banner" role="alert">{error}<button type="button" onClick={() => setError('')}>Đóng</button></div> : null}
      <div className="count-grid">
        {countCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.key} className="count-card">
              <Icon size={20} />
              <div><strong>{counts[card.key]}</strong><span>{card.label}</span></div>
            </article>
          );
        })}
      </div>

      <div className="toolbar">
        <label className="search-field">
          <span>Tìm tin báo</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Mã, mô tả hoặc đơn vị…" />
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Tất cả</option>
            {REPORT_STATUSES.map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}
          </select>
        </label>
        <label>
          <span>Loại sự cố</span>
          <select value={incidentType} onChange={(event) => setIncidentType(event.target.value)}>
            <option value="">Tất cả</option>
            {Object.entries(INCIDENT_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <button type="button" className="button button--secondary" onClick={() => void loadOverview()}>Làm mới</button>
      </div>

      <div className="data-card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Mã / thời gian</th><th>Sự cố</th><th>Trạng thái</th><th>Đơn vị</th><th>Vị trí</th><th /></tr></thead>
            <tbody>
              {visibleReports.map((report) => (
                <tr key={report.id}>
                  <td><strong>{report.id}</strong><small>{new Date(report.createdAt).toLocaleString('vi-VN')}</small></td>
                  <td>{INCIDENT_LABELS[report.incidentType]}{report.attachmentAvailable ? <Camera className="inline-icon" size={15} aria-label="Có ảnh" /> : null}</td>
                  <td><span className={`status status--${report.status}`}>{STATUS_LABELS[report.status]}</span></td>
                  <td>{report.assignedUnitName ?? report.suggestedUnitName ?? <em>Chưa phân công</em>}</td>
                  <td>{report.incidentLatitude.toFixed(5)}, {report.incidentLongitude.toFixed(5)}</td>
                  <td><button type="button" className="text-button" onClick={() => void openReport(report.id)}>Mở chi tiết</button></td>
                </tr>
              ))}
              {visibleReports.length === 0 ? <tr><td colSpan={6} className="empty-cell">Không có tin báo phù hợp bộ lọc hoặc từ khóa.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId ? (
        <div className="drawer-layer" role="dialog" aria-modal="true" aria-label={`Chi tiết ${selectedId}`}>
          <button type="button" className="drawer-backdrop" onClick={() => { setSelectedId(null); setDetail(null); }} aria-label="Đóng chi tiết" />
          <aside className="drawer">
            <div className="drawer-header">
              <div><p className="eyebrow">Tin báo</p><h2>{selectedId}</h2></div>
              <button type="button" className="icon-button" aria-label="Đóng chi tiết" onClick={() => { setSelectedId(null); setDetail(null); }}><X size={21} /></button>
            </div>
            {loadingDetail || !detail ? <div className="loading">Đang tải chi tiết…</div> : (
              <div className="drawer-content">
                <div className="detail-head">
                  <div><h3>{INCIDENT_LABELS[detail.report.incidentType]}</h3><p>{new Date(detail.report.createdAt).toLocaleString('vi-VN')}</p></div>
                  <span className={`status status--${detail.report.status}`}>{STATUS_LABELS[detail.report.status]}</span>
                </div>
                <MapPicker latitude={detail.report.incidentLatitude} longitude={detail.report.incidentLongitude} label="Vị trí sự cố" />
                <div className="detail-grid">
                  <div><span>Vị trí sự cố</span><strong>{detail.report.incidentLatitude.toFixed(6)}, {detail.report.incidentLongitude.toFixed(6)}</strong></div>
                  <div><span>Vị trí thiết bị</span><strong>{detail.report.reporterLatitude !== null && detail.report.reporterLongitude !== null ? `${detail.report.reporterLatitude.toFixed(6)}, ${detail.report.reporterLongitude.toFixed(6)}` : 'Không cung cấp'}</strong></div>
                  <div><span>Độ chính xác GPS</span><strong>{detail.report.gpsAccuracy !== null ? `±${Math.round(detail.report.gpsAccuracy)} m` : 'Không có'}</strong></div>
                  <div><span>Đơn vị gợi ý</span><strong>{detail.report.suggestedPoliceUnit?.name ?? 'Không có'}</strong></div>
                </div>
                <div className="description-box"><span>Mô tả</span><p>{detail.report.description ?? 'Không có mô tả.'}</p></div>
                {detail.report.attachmentAvailable ? (
                  <section className="attachment-preview">
                    <div><span>Ảnh hiện trường</span><small>{detail.report.attachmentOriginalName ?? 'Ảnh do người báo tin cung cấp'}{detail.report.attachmentSize !== null ? ` · ${(detail.report.attachmentSize / 1024).toFixed(0)} KB` : ''}</small></div>
                    {attachmentError ? (
                      <div className="attachment-error" role="alert">
                        <AlertTriangle size={20} />
                        <div><strong>Không tải được ảnh hiện trường</strong><span>Tệp có thể đã bị di chuyển hoặc kết nối đang gián đoạn.</span></div>
                        <button type="button" className="button button--secondary" onClick={() => setAttachmentError(false)}>Thử lại</button>
                      </div>
                    ) : (
                      <a href={`${API_URL}/admin/reports/${encodeURIComponent(detail.report.id)}/attachment`} target="_blank" rel="noreferrer">
                        <img crossOrigin="use-credentials" src={`${API_URL}/admin/reports/${encodeURIComponent(detail.report.id)}/attachment`} alt="Ảnh hiện trường do người báo tin cung cấp" onError={() => setAttachmentError(true)} />
                        <span><Camera size={16} /> Mở ảnh gốc</span>
                      </a>
                    )}
                  </section>
                ) : null}
                <label className="field">
                  <span>Đơn vị được phân công</span>
                  <select disabled={busy} value={detail.report.assignedPoliceUnit?.id ?? ''} onChange={(event) => void assign(event.target.value ? Number(event.target.value) : null)}>
                    <option value="">Chưa phân công</option>
                    {assignmentOptions.map((unit) => <option key={unit.id} value={unit.id} disabled={!unit.active}>{unit.name}{unit.active ? unit.verified ? '' : ' · chưa xác minh' : ' · đã tắt'}</option>)}
                  </select>
                </label>
                {nextStatus ? (
                  <button type="button" className="button button--primary full" disabled={busy} onClick={() => void advanceStatus()}>
                    Chuyển sang “{STATUS_LABELS[nextStatus]}”
                  </button>
                ) : <div className="resolved-box"><CheckCircle2 size={18} /> Tin báo đã giải quyết</div>}
                <div className="timeline-admin">
                  <h3>Lịch sử trạng thái</h3>
                  {detail.history.map((entry) => (
                    <div key={entry.id} className="history-row"><span className="history-node" /><div><strong>{STATUS_LABELS[entry.status as ReportStatus]}</strong><small>{new Date(entry.createdAt).toLocaleString('vi-VN')} · {entry.actorName}</small></div></div>
                  ))}
                </div>
                <div className="caution-note"><MapPin size={17} /> Đơn vị gần nhất chỉ là gợi ý khoảng cách, không xác nhận thẩm quyền hành chính.</div>
              </div>
            )}
          </aside>
        </div>
      ) : null}
    </section>
  );
}
