import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { INCIDENT_LABELS, REPORT_STATUSES, STATUS_LABELS, type ReportStatus } from '@vnpolice/shared';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { QueryState } from '@/components/ui';
import { fetchReport, fetchReportHistory, reportAttachmentSource } from '@/services/api';
import { formatCoordinates, formatDateTime } from '@/services/format';
import { findReportCredential } from '@/services/report-storage';
import { colors, radius, spacing } from '@/theme';

const timelineLabels: Record<ReportStatus, string> = {
  submitted: 'Đã gửi tin báo',
  received: 'Đơn vị tiếp nhận tin báo',
  processing: 'Đang xử lý',
  resolved: 'Đã giải quyết',
};

export default function ReportTrackingScreen() {
  const parameters = useLocalSearchParams<{ id: string }>();
  const reportId = parameters.id ?? '';
  const [active, setActive] = useState(false);
  const [attachmentError, setAttachmentError] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      return () => setActive(false);
    }, []),
  );
  const credentialQuery = useQuery({
    queryKey: ['report-credential', reportId],
    queryFn: () => findReportCredential(reportId),
  });
  const credential = credentialQuery.data;
  const reportQuery = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => fetchReport(reportId, credential?.accessToken ?? ''),
    enabled: active && Boolean(credential?.accessToken),
    refetchInterval: active ? 5_000 : false,
    retry: 1,
  });
  const historyQuery = useQuery({
    queryKey: ['report-history', reportId],
    queryFn: () => fetchReportHistory(reportId, credential?.accessToken ?? ''),
    enabled: active && Boolean(credential?.accessToken),
    refetchInterval: active ? 5_000 : false,
    retry: 1,
  });
  const historyByStatus = useMemo(
    () => new Map((historyQuery.data ?? []).map((entry) => [entry.status, entry])),
    [historyQuery.data],
  );

  if (credentialQuery.isLoading || reportQuery.isLoading) {
    return <QueryState loading error={null} />;
  }
  if (!credential) {
    return <QueryState loading={false} error={new Error('Thiết bị không có mã truy cập bảo mật cho tin báo này.')} />;
  }
  if (credentialQuery.error || !reportQuery.data) {
    return <QueryState loading={false} error={credentialQuery.error ?? reportQuery.error ?? new Error('Không tải được tin báo.')} />;
  }

  const report = reportQuery.data;
  const currentIndex = REPORT_STATUSES.indexOf(report.status);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="document-text-outline" color={colors.green} size={26} /></View>
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>THEO DÕI TIN BÁO</Text>
          <Text style={styles.title}>{INCIDENT_LABELS[report.incidentType]}</Text>
          <Text selectable style={styles.reference}>{report.id}</Text>
        </View>
        <Text style={[styles.status, styles[`status_${report.status}`]]}>{STATUS_LABELS[report.status]}</Text>
      </View>

      <View style={styles.polling}>
        <View style={styles.liveDot} />
        <Text style={styles.pollingText}>Đang tự động đồng bộ mỗi 5 giây · gửi lúc {formatDateTime(report.createdAt)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tiến độ thực tế</Text>
        {REPORT_STATUSES.map((status, index) => {
          const history = historyByStatus.get(status);
          const completed = index < currentIndex;
          const current = index === currentIndex;
          return (
            <View key={status} style={styles.timelineRow}>
              <View style={styles.rail}>
                <View style={[styles.node, completed && styles.nodeDone, current && styles.nodeCurrent]}>
                  {completed ? <Ionicons name="checkmark" size={11} color={colors.surface} /> : null}
                </View>
                {index < REPORT_STATUSES.length - 1 ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.timelineText}>
                <Text style={[styles.timelineLabel, (completed || current) && styles.timelineLabelActive]}>{timelineLabels[status]}</Text>
                {history ? <Text style={styles.timelineTime}>{formatDateTime(history.createdAt)} · {history.actorName}</Text> : <Text style={styles.timelinePending}>Chưa đến bước này</Text>}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vị trí đã gửi</Text>
        <View style={styles.mapClip}>
          <MapView
            pointerEvents="none"
            style={styles.map}
            initialRegion={{ latitude: report.incidentLatitude, longitude: report.incidentLongitude, latitudeDelta: 0.014, longitudeDelta: 0.014 }}
          >
            <Marker coordinate={{ latitude: report.incidentLatitude, longitude: report.incidentLongitude }} pinColor={colors.danger} />
            {report.assignedPoliceUnit?.latitude !== null && report.assignedPoliceUnit?.latitude !== undefined && report.assignedPoliceUnit.longitude !== null ? (
              <Marker coordinate={{ latitude: report.assignedPoliceUnit.latitude, longitude: report.assignedPoliceUnit.longitude }} pinColor={colors.police} />
            ) : null}
          </MapView>
        </View>
        <View style={styles.mapLegend}>
          <Text style={styles.incidentLegend}>● Vị trí sự cố</Text>
          {report.assignedPoliceUnit ? <Text style={styles.policeLegend}>● Đơn vị xử lý</Text> : null}
        </View>
      </View>

      {report.attachmentAvailable ? (
        <View style={styles.card}>
          <View style={styles.attachmentHeading}>
            <Text style={styles.cardTitle}>Ảnh hiện trường</Text>
            <Text style={styles.attachmentMeta}>{report.attachmentSize !== null ? `${Math.ceil(report.attachmentSize / 1024)} KB` : 'Đã tải lên'}</Text>
          </View>
          {attachmentError ? <Text accessibilityRole="alert" style={styles.attachmentError}>Không tải được ảnh hiện trường. Trạng thái tin báo vẫn được đồng bộ bình thường.</Text> : <Image source={reportAttachmentSource(report.id, credential.accessToken)} onError={() => setAttachmentError(true)} resizeMode="cover" style={styles.attachment} />}
          <Text numberOfLines={1} style={styles.attachmentName}>{report.attachmentOriginalName ?? 'Ảnh do người báo tin cung cấp'}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin đã gửi</Text>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}><Ionicons name="location-outline" color={colors.green} size={17} /></View>
          <View style={styles.detailContent}><Text style={styles.detailLabel}>VỊ TRÍ SỰ CỐ</Text><Text style={styles.detailText}>{formatCoordinates(report.incidentLatitude, report.incidentLongitude)}</Text></View>
        </View>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}><Ionicons name="navigate-outline" color={colors.green} size={17} /></View>
          <View style={styles.detailContent}><Text style={styles.detailLabel}>VỊ TRÍ THIẾT BỊ</Text><Text style={styles.detailText}>{report.reporterLatitude !== null && report.reporterLongitude !== null ? `${formatCoordinates(report.reporterLatitude, report.reporterLongitude)}${report.gpsAccuracy !== null ? ` · ±${Math.round(report.gpsAccuracy)} m` : ''}` : 'Không cung cấp'}</Text></View>
        </View>
        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, styles.policeDetailIcon]}><Ionicons name="shield-outline" color={colors.police} size={17} /></View>
          <View style={styles.detailContent}><Text style={[styles.detailLabel, styles.policeDetailLabel]}>ĐƠN VỊ XỬ LÝ</Text><Text style={styles.detailText}>{report.assignedPoliceUnit?.name ?? report.suggestedPoliceUnit?.name ?? 'Chưa phân công'}</Text></View>
        </View>
        {report.description ? (
          <View style={styles.descriptionBox}><Text style={styles.detailLabel}>MÔ TẢ HIỆN TRƯỜNG</Text><Text style={styles.description}>{report.description}</Text></View>
        ) : null}
      </View>
      {reportQuery.error || historyQuery.error ? <Text style={styles.syncError}>Mất kết nối tạm thời; ứng dụng đang hiển thị dữ liệu gần nhất và sẽ tự thử lại.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 44, backgroundColor: colors.background },
  hero: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1 },
  eyebrow: { color: colors.green, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 3 },
  reference: { color: colors.muted, fontSize: 10, marginTop: 4 },
  status: { borderRadius: 20, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 7, fontSize: 9, fontWeight: '900' },
  status_submitted: { color: '#557e9a', backgroundColor: '#e9f2f9' },
  status_received: { color: colors.green, backgroundColor: colors.paleGreen },
  status_processing: { color: '#9a6b2e', backgroundColor: '#fbf1df' },
  status_resolved: { color: '#387b73', backgroundColor: '#e5f2f1' },
  polling: { flexDirection: 'row', alignItems: 'center', gap: 7, marginVertical: spacing.lg, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 12, backgroundColor: '#edf6f2' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#24a987' },
  pollingText: { flex: 1, color: colors.muted, fontSize: 9, lineHeight: 14 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: '900', marginBottom: spacing.md },
  timelineRow: { minHeight: 60, flexDirection: 'row', gap: spacing.sm },
  rail: { width: 21, alignItems: 'center' },
  node: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: '#c9d6cd', alignItems: 'center', justifyContent: 'center' },
  nodeDone: { backgroundColor: colors.green, borderColor: colors.green },
  nodeCurrent: { borderWidth: 5, borderColor: colors.green },
  line: { width: 1, flex: 1, backgroundColor: '#dbe6de' },
  timelineText: { flex: 1, paddingBottom: spacing.sm },
  timelineLabel: { color: '#83978a', fontSize: 12, fontWeight: '700', paddingTop: 2 },
  timelineLabelActive: { color: colors.ink, fontWeight: '900' },
  timelineTime: { color: colors.muted, fontSize: 9, marginTop: 5 },
  timelinePending: { color: '#a5b2ab', fontSize: 9, marginTop: 5 },
  mapClip: { height: 180, borderRadius: radius.md, overflow: 'hidden' },
  map: { flex: 1 },
  mapLegend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  incidentLegend: { color: colors.danger, fontSize: 9, fontWeight: '800' },
  policeLegend: { color: colors.police, fontSize: 9, fontWeight: '800' },
  attachmentHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attachmentMeta: { color: colors.green, fontSize: 9, fontWeight: '800', marginBottom: spacing.md },
  attachment: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: '#eef2ef' },
  attachmentName: { color: colors.muted, fontSize: 9, marginTop: spacing.sm },
  attachmentError: { color: colors.danger, fontSize: 11, lineHeight: 17, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#fff0ec' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  detailIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center' },
  policeDetailIcon: { backgroundColor: '#e8f2f8' },
  detailContent: { flex: 1 },
  detailLabel: { color: colors.green, fontSize: 8, fontWeight: '900', letterSpacing: 0.7, marginBottom: 4 },
  policeDetailLabel: { color: colors.police },
  detailText: { color: colors.ink, fontSize: 11, lineHeight: 17, fontWeight: '700' },
  descriptionBox: { padding: 12, borderRadius: radius.sm, backgroundColor: '#f7faf7' },
  description: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  syncError: { color: colors.danger, textAlign: 'center', fontSize: 11 },
});
