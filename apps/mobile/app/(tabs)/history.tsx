import { Ionicons } from '@expo/vector-icons';
import { useQueries, useQuery } from '@tanstack/react-query';
import { INCIDENT_LABELS, STATUS_LABELS } from '@vnpolice/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { QueryState, SectionKicker } from '@/components/ui';
import { ApiError, fetchReport } from '@/services/api';
import { formatDateTime } from '@/services/format';
import { loadReportCredentials, removeReportCredentials } from '@/services/report-storage';
import { colors, radius, spacing } from '@/theme';

export default function ReportHistoryScreen() {
  const [active, setActive] = useState(false);
  const credentialsQuery = useQuery({ queryKey: ['report-credentials'], queryFn: loadReportCredentials });
  useFocusEffect(
    useCallback(() => {
      setActive(true);
      void credentialsQuery.refetch();
      return () => setActive(false);
    }, [credentialsQuery.refetch]),
  );
  const credentials = credentialsQuery.data ?? [];
  const reportQueries = useQueries({
    queries: credentials.map((credential) => ({
      queryKey: ['report', credential.id],
      queryFn: () => fetchReport(credential.id, credential.accessToken),
      enabled: active,
      refetchInterval: active ? 5_000 : false,
      retry: 1,
    })),
  });
  const staleIds = credentials
    .filter((_, index) => {
      const error = reportQueries[index]?.error;
      return error instanceof ApiError && error.status === 404;
    })
    .map((credential) => credential.id);
  const staleKey = staleIds.join('|');
  const refetchCredentials = credentialsQuery.refetch;
  useEffect(() => {
    if (!staleKey) return;
    void removeReportCredentials(staleKey.split('|')).then(() => refetchCredentials());
  }, [staleKey, refetchCredentials]);
  const loadedReports = reportQueries.flatMap((query) => query.data ? [query.data] : []);
  const activeCount = loadedReports.filter((report) => report.status !== 'resolved').length;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionKicker>Trung tâm tiếp nhận</SectionKicker>
      <View style={styles.headingRow}>
        <View style={styles.headingText}><Text style={styles.title}>Tin của bạn</Text><Text style={styles.lead}>Mã truy cập chỉ lưu trên thiết bị đã gửi tin.</Text></View>
        <View style={styles.syncBadge}><View style={styles.syncDot} /><Text style={styles.syncText}>Tự động cập nhật</Text></View>
      </View>
      {credentials.length > 0 ? (
        <View style={styles.overview}>
          <View style={styles.overviewItem}><Text style={styles.overviewValue}>{credentials.length}</Text><Text style={styles.overviewLabel}>Tổng tin</Text></View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}><Text style={styles.overviewValue}>{activeCount}</Text><Text style={styles.overviewLabel}>Đang xử lý</Text></View>
          <View style={styles.overviewDivider} />
          <View style={styles.overviewItem}><Text style={styles.overviewValue}>{loadedReports.filter((report) => report.status === 'resolved').length}</Text><Text style={styles.overviewLabel}>Đã giải quyết</Text></View>
        </View>
      ) : null}
      <QueryState loading={credentialsQuery.isLoading} error={credentialsQuery.error} />
      {!credentialsQuery.isLoading && credentials.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" color={colors.green} size={38} />
          <Text style={styles.emptyTitle}>Chưa có tin báo</Text>
          <Text style={styles.emptyText}>Tin báo gửi từ bản đồ được lưu an toàn trên thiết bị này để bạn theo dõi tiến độ xử lý.</Text>
        </View>
      ) : null}
      {credentials.map((credential, index) => {
        const query = reportQueries[index];
        const report = query?.data;
        return (
          <Pressable
            key={credential.id}
            onPress={() => router.push({ pathname: '/report/[id]', params: { id: credential.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            {report ? (
              <>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}><Ionicons name={report.incidentType === 'traffic_accident' ? 'car-outline' : report.incidentType === 'fire' ? 'flame-outline' : report.incidentType === 'fighting' ? 'people-outline' : 'shield-outline'} color={colors.green} size={20} /></View>
                  <View style={styles.cardTitleBlock}>
                    <Text style={styles.cardTitle}>{INCIDENT_LABELS[report.incidentType]}</Text>
                    <Text style={styles.cardTime}>{formatDateTime(report.createdAt)}</Text>
                  </View>
                  <Text style={[styles.status, styles[`status_${report.status}`]]}>{STATUS_LABELS[report.status]}</Text>
                </View>
                {report.description ? <Text numberOfLines={2} style={styles.description}>{report.description}</Text> : null}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}><Ionicons name="shield-outline" color={colors.police} size={14} /><Text numberOfLines={1} style={styles.metaText}>{report.assignedPoliceUnit?.name ?? report.suggestedPoliceUnit?.name ?? 'Chưa phân công'}</Text></View>
                  {report.attachmentAvailable ? <View style={styles.photoBadge}><Ionicons name="image-outline" color={colors.green} size={13} /><Text style={styles.photoText}>Có ảnh</Text></View> : null}
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.reportId}>{report.id}</Text>
                  <View style={styles.openAction}><Text style={styles.openText}>Xem tiến độ</Text><Ionicons name="arrow-forward" color={colors.green} size={15} /></View>
                </View>
              </>
            ) : (
              <View style={styles.loadingRow}>
                <Text style={styles.reportId}>{credential.id}</Text>
                <Text style={styles.loadError}>{query?.error ? 'Không thể đồng bộ' : 'Đang đồng bộ…'}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.lg, paddingBottom: 42, backgroundColor: colors.background },
  title: { color: colors.ink, fontSize: 27, fontWeight: '900' },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.lg },
  headingText: { flex: 1 },
  lead: { color: colors.muted, lineHeight: 17, fontSize: 11, marginTop: spacing.xs },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 16, backgroundColor: colors.paleGreen },
  syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#24a987' },
  syncText: { color: colors.green, fontSize: 8, fontWeight: '900' },
  overview: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.ink, borderRadius: radius.lg, paddingVertical: 15, marginBottom: spacing.lg },
  overviewItem: { flex: 1, alignItems: 'center' },
  overviewValue: { color: colors.surface, fontSize: 20, fontWeight: '900' },
  overviewLabel: { color: '#bcd1c7', fontSize: 9, marginTop: 3 },
  overviewDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: '#ffffff30' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 38, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  emptyTitle: { color: colors.ink, fontWeight: '800', fontSize: 17, marginTop: spacing.md },
  emptyText: { color: colors.muted, textAlign: 'center', lineHeight: 19, marginTop: spacing.xs },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  pressed: { opacity: 0.78 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center' },
  cardTitleBlock: { flex: 1 },
  cardTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  cardTime: { color: colors.muted, fontSize: 11, marginTop: 6 },
  status: { borderRadius: 18, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 6, fontSize: 10, fontWeight: '800' },
  status_submitted: { color: '#557e9a', backgroundColor: '#e9f2f9' },
  status_received: { color: colors.green, backgroundColor: colors.paleGreen },
  status_processing: { color: '#9a6b2e', backgroundColor: '#fbf1df' },
  status_resolved: { color: '#387b73', backgroundColor: '#e5f2f1' },
  description: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  metaItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { flex: 1, color: colors.muted, fontSize: 9 },
  photoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, backgroundColor: colors.paleGreen },
  photoText: { color: colors.green, fontSize: 8, fontWeight: '900' },
  cardFooter: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reportId: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  openAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  openText: { color: colors.green, fontSize: 10, fontWeight: '900' },
  loadingRow: { flexDirection: 'row', justifyContent: 'space-between' },
  loadError: { color: colors.muted, fontSize: 11 },
});
