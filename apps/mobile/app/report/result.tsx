import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { INCIDENT_LABELS, STATUS_LABELS } from '@vnpolice/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, QueryState, SecondaryButton } from '@/components/ui';
import { useReportDraft } from '@/features/reports/report-draft-context';
import { fetchReport, reportAttachmentSource } from '@/services/api';
import { formatCoordinates, formatDateTime } from '@/services/format';
import { findReportCredential, saveReportCredential } from '@/services/report-storage';
import { colors, radius, spacing } from '@/theme';

export default function ReportResultScreen() {
  const parameters = useLocalSearchParams<{ id: string; credentialSaved?: string }>();
  const reportId = parameters.id ?? '';
  const { latestResult } = useReportDraft();
  const [credentialStored, setCredentialStored] = useState(parameters.credentialSaved !== 'false');
  const [attachmentError, setAttachmentError] = useState(false);
  const credentialQuery = useQuery({
    queryKey: ['report-credential', reportId],
    queryFn: () => findReportCredential(reportId),
    enabled: latestResult?.report.id !== reportId,
  });
  const credential = credentialQuery.data;
  const reportQuery = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => fetchReport(reportId, credential?.accessToken ?? ''),
    enabled: Boolean(credential?.accessToken) && latestResult?.report.id !== reportId,
  });
  const report = latestResult?.report.id === reportId ? latestResult.report : reportQuery.data;
  const accessToken = latestResult?.report.id === reportId ? latestResult.accessToken : credential?.accessToken;

  async function openTracking(): Promise<void> {
    if (!credentialStored) {
      if (!latestResult || latestResult.report.id !== reportId) {
        Alert.alert('Chưa lưu được mã theo dõi', 'Hãy giữ mã tin báo và thử lại từ thiết bị đã gửi tin.');
        return;
      }
      try {
        await saveReportCredential({
          id: latestResult.report.id,
          accessToken: latestResult.accessToken,
          incidentType: latestResult.report.incidentType,
          createdAt: latestResult.report.createdAt,
        });
        setCredentialStored(true);
      } catch {
        Alert.alert('Chưa lưu được mã theo dõi', 'Tin báo đã được tiếp nhận nhưng thiết bị chưa lưu được quyền theo dõi. Vui lòng thử lại.');
        return;
      }
    }
    router.replace({ pathname: '/report/[id]', params: { id: reportId } });
  }

  if (!report) {
    return <QueryState loading={credentialQuery.isLoading || reportQuery.isLoading} error={credentialQuery.error ?? reportQuery.error ?? (credentialQuery.data === null ? new Error('Thiết bị không có quyền truy cập tin báo này.') : null)} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.successMark}>
        <Ionicons name="checkmark" color={colors.green} size={42} />
      </View>
      <Text style={styles.kicker}>TRUNG TÂM ĐÃ NHẬN TIN</Text>
      <Text style={styles.title}>Gửi tin báo thành công</Text>
      <Text style={styles.lead}>{credentialStored ? 'Mã truy cập đã được lưu riêng trên thiết bị. Trạng thái sẽ tự động cập nhật khi cán bộ trực ban tiếp nhận và xử lý.' : 'Tin báo đã được tiếp nhận, nhưng thiết bị chưa lưu được mã theo dõi. Thử lưu lại trước khi rời màn hình này.'}</Text>

      <View style={styles.receipt}>
        <View style={styles.row}>
          <Text style={styles.label}>Mã tin báo</Text>
          <Text selectable style={styles.value}>{report.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Loại sự cố</Text>
          <Text style={styles.value}>{INCIDENT_LABELS[report.incidentType]}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Thời gian gửi</Text>
          <Text style={styles.value}>{formatDateTime(report.createdAt)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Vị trí sự cố</Text>
          <Text style={styles.value}>{formatCoordinates(report.incidentLatitude, report.incidentLongitude)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Trạng thái</Text>
          <Text style={styles.value}>{STATUS_LABELS[report.status]}</Text>
        </View>
        <View style={[styles.row, styles.lastRow]}>
          <Text style={styles.label}>Đơn vị gợi ý</Text>
          <Text style={styles.value}>{report.suggestedPoliceUnit?.name ?? 'Chưa xác định · cần phân công thủ công'}</Text>
        </View>
      </View>

      {report.attachmentAvailable && accessToken ? (
        <View style={styles.attachmentCard}>
          <View style={styles.attachmentHeading}><Ionicons name={attachmentError ? 'alert-circle-outline' : 'image-outline'} color={attachmentError ? colors.danger : colors.green} size={18} /><Text style={styles.attachmentTitle}>{attachmentError ? 'Chưa tải được ảnh hiện trường' : 'Ảnh hiện trường đã tải lên'}</Text>{attachmentError ? null : <Ionicons name="checkmark-circle" color={colors.green} size={18} />}</View>
          {attachmentError ? <Text accessibilityRole="alert" style={styles.attachmentError}>Tin báo vẫn được lưu. Kiểm tra kết nối rồi mở lại màn hình theo dõi để tải ảnh.</Text> : <Image source={reportAttachmentSource(report.id, accessToken)} onError={() => setAttachmentError(true)} resizeMode="cover" style={styles.attachment} />}
        </View>
      ) : null}

      <View style={styles.nextSteps}>
        <Text style={styles.nextTitle}>Tiếp theo sẽ diễn ra</Text>
        <View style={styles.nextRow}><Text style={styles.nextNumber}>1</Text><Text style={styles.nextText}>Trực ban kiểm tra nội dung, vị trí và ảnh hiện trường.</Text></View>
        <View style={styles.nextRow}><Text style={styles.nextNumber}>2</Text><Text style={styles.nextText}>Tin được phân công đến đơn vị phù hợp theo địa bàn.</Text></View>
        <View style={styles.nextRow}><Text style={styles.nextNumber}>3</Text><Text style={styles.nextText}>Bạn theo dõi từng mốc xử lý ngay trên thiết bị này.</Text></View>
      </View>

      {!credentialStored ? (
        <View accessibilityRole="alert" style={styles.credentialWarning}>
          <Ionicons name="key-outline" color={colors.danger} size={20} />
          <Text style={styles.credentialWarningText}>Không gửi lại tin báo. Chọn “Lưu mã và theo dõi” để thử lưu quyền truy cập trên thiết bị.</Text>
        </View>
      ) : null}

      <View style={styles.warning}>
        <Ionicons name="information-circle-outline" color={colors.warningText} size={20} />
        <Text style={styles.warningText}>Nếu có nguy hiểm thật, hãy gọi 113, 114 hoặc 115 ngay.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label={credentialStored ? 'Theo dõi tin báo' : 'Lưu mã và theo dõi'} onPress={() => void openTracking()} />
        <SecondaryButton label="Về bản đồ" onPress={() => router.replace('/')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: 48, paddingBottom: 44, backgroundColor: colors.surface, alignItems: 'center' },
  successMark: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#e7f7ed', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  kicker: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, textAlign: 'center' },
  title: { color: colors.ink, fontSize: 28, fontWeight: '800', marginTop: spacing.sm },
  lead: { color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: spacing.sm },
  receipt: { alignSelf: 'stretch', backgroundColor: '#f7faf6', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, marginTop: spacing.xl },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  lastRow: { borderBottomWidth: 0 },
  label: { color: colors.muted, fontSize: 11, flex: 0.42 },
  value: { color: colors.ink, fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'right', flex: 0.58 },
  attachmentCard: { alignSelf: 'stretch', overflow: 'hidden', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, marginTop: spacing.md },
  attachmentHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 12 },
  attachmentTitle: { flex: 1, color: colors.ink, fontSize: 11, fontWeight: '900' },
  attachment: { width: '100%', height: 170, backgroundColor: '#edf2ee' },
  attachmentError: { padding: spacing.md, paddingTop: 0, color: colors.danger, fontSize: 11, lineHeight: 17 },
  nextSteps: { alignSelf: 'stretch', borderRadius: radius.lg, padding: spacing.md, backgroundColor: colors.paleGreen, marginTop: spacing.md },
  nextTitle: { color: colors.ink, fontSize: 13, fontWeight: '900', marginBottom: spacing.sm },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 7 },
  nextNumber: { width: 22, height: 22, borderRadius: 11, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', lineHeight: 22, color: colors.surface, backgroundColor: colors.green, fontSize: 10, fontWeight: '900' },
  nextText: { flex: 1, color: colors.darkGreen, fontSize: 10, lineHeight: 15 },
  warning: { alignSelf: 'stretch', flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.warningBackground, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  warningText: { flex: 1, color: colors.warningText, fontSize: 11, lineHeight: 17 },
  credentialWarning: { alignSelf: 'stretch', flexDirection: 'row', gap: spacing.sm, backgroundColor: '#fff0ec', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  credentialWarningText: { flex: 1, color: colors.danger, fontSize: 11, lineHeight: 17 },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg },
});
