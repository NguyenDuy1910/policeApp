import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { INCIDENT_LABELS } from '@vnpolice/shared';
import * as ImagePicker from 'expo-image-picker';
import { router, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton, ReportProgress, SectionKicker } from '@/components/ui';
import { useReportDraft } from '@/features/reports/report-draft-context';
import type { DraftAttachment } from '@/features/reports/report-draft';
import { reportSubmissionErrorMessage, submitReport } from '@/services/api';
import { formatCoordinates } from '@/services/format';
import { saveReportCredential } from '@/services/report-storage';
import { colors, radius, spacing } from '@/theme';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const supportedImageTypes: Record<string, DraftAttachment['mimeType']> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
};

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return 'Không xác định dung lượng';
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} MB`;
}

function inferImageType(asset: ImagePicker.ImagePickerAsset): DraftAttachment['mimeType'] | null {
  if (asset.mimeType) {
    const mappedType = supportedImageTypes[asset.mimeType.toLocaleLowerCase()];
    if (mappedType) return mappedType;
  }
  const extension = asset.fileName?.split('.').at(-1)?.toLocaleLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return null;
}

export default function IncidentDetailsScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();
  const navigation = useNavigation<{ reset: (state: { index: number; routes: { name: string; params?: Record<string, string> }[] }) => void }>();
  const submissionCompletedRef = useRef(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { completeSubmission, draft, setAttachment, setDescription } = useReportDraft();

  useEffect(() => {
    if (!submissionCompletedRef.current && (!draft.incidentType || !draft.incidentLocation)) router.replace('/report/type');
  }, [draft.incidentLocation, draft.incidentType]);

  const mutation = useMutation({
    mutationFn: () => submitReport(draft, setUploadProgress),
    onMutate: () => setUploadProgress(1),
    onSuccess: async (result) => {
      let credentialSaved = true;
      try {
        await saveReportCredential({
          id: result.report.id,
          accessToken: result.accessToken,
          incidentType: result.report.incidentType,
          createdAt: result.report.createdAt,
        });
      } catch {
        credentialSaved = false;
      }
      submissionCompletedRef.current = true;
      completeSubmission(result);
      queryClient.setQueryData(['report', result.report.id], result.report);
      await queryClient.invalidateQueries({ queryKey: ['report-credentials'] });
      // Close the finished wizard: the stack becomes [tabs, receipt], so leaving the receipt or the
      // tracking screen returns to the map instead of the cleared type/location steps.
      navigation.reset({
        index: 1,
        routes: [
          { name: '(tabs)' },
          { name: 'report/result', params: { id: result.report.id, credentialSaved: String(credentialSaved) } },
        ],
      });
    },
    onError: () => {
      setUploadProgress(0);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    },
  });

  const submissionError = mutation.isError ? reportSubmissionErrorMessage(mutation.error) : null;

  function processImage(asset: ImagePicker.ImagePickerAsset): void {
    if (mutation.isError) mutation.reset();
    const mimeType = inferImageType(asset);
    if (!mimeType) {
      Alert.alert('Định dạng chưa hỗ trợ', 'Hãy chọn ảnh JPEG, PNG hoặc WebP. Ảnh HEIC nên được xuất sang định dạng tương thích trước khi gửi.');
      return;
    }
    if (asset.fileSize !== undefined && asset.fileSize > MAX_ATTACHMENT_BYTES) {
      Alert.alert('Ảnh lớn hơn 5 MB', 'Hãy chọn ảnh khác hoặc giảm dung lượng ảnh trước khi gửi.');
      return;
    }
    setAttachment({
      uri: asset.uri,
      fileName: asset.fileName ?? `hien-truong-${Date.now()}.${mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'}`,
      mimeType,
      fileSize: asset.fileSize ?? null,
      width: asset.width,
      height: asset.height,
    });
  }

  async function chooseFromLibrary(): Promise<void> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Chưa cấp quyền ảnh', 'Mở Cài đặt để cấp quyền thư viện ảnh, hoặc tiếp tục gửi tin mà không có ảnh.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.78,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      selectionLimit: 1,
    });
    if (!result.canceled && result.assets[0]) processImage(result.assets[0]);
  }

  async function takePhoto(): Promise<void> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Chưa cấp quyền camera', 'Mở Cài đặt để cấp quyền camera, hoặc chọn ảnh có sẵn từ thư viện.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], cameraType: ImagePicker.CameraType.back, quality: 0.78 });
    if (!result.canceled && result.assets[0]) processImage(result.assets[0]);
  }

  function openImageMenu(): void {
    Alert.alert('Thêm ảnh hiện trường', 'Không chụp ảnh nếu việc đó khiến bạn gặp nguy hiểm.', [
      { text: 'Chụp ảnh', onPress: () => void takePhoto() },
      { text: 'Chọn từ thư viện', onPress: () => void chooseFromLibrary() },
      { text: 'Hủy', style: 'cancel' },
    ]);
  }

  function updateDescription(value: string): void {
    if (mutation.isError) mutation.reset();
    setDescription(value);
  }

  function removeImage(): void {
    if (mutation.isError) mutation.reset();
    setAttachment(null);
  }

  function confirmSubmission(): void {
    if (!draft.description.trim() && !draft.attachment) {
      Alert.alert('Gửi chỉ với vị trí?', 'Mô tả hoặc ảnh sẽ giúp cán bộ trực ban đánh giá tình huống nhanh hơn.', [
        { text: 'Bổ sung thông tin', style: 'cancel' },
        { text: 'Vẫn gửi', onPress: () => mutation.mutate() },
      ]);
      return;
    }
    mutation.mutate();
  }

  if (!draft.incidentType || !draft.incidentLocation) return null;
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={16}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionKicker>Gửi tin báo</SectionKicker>
        <ReportProgress step={3} />
        <Text style={styles.title}>Kiểm tra và gửi tin</Text>
        <Text style={styles.support}>Xác nhận lại sự việc, vị trí và ảnh hiện trường trước khi chuyển đến trung tâm tiếp nhận.</Text>

        <View style={styles.summary}>
          <View style={styles.summaryIcon}><Ionicons name="warning-outline" color={colors.danger} size={22} /></View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>{INCIDENT_LABELS[draft.incidentType]}</Text>
            <Text style={styles.summaryMeta}>{formatCoordinates(draft.incidentLocation.latitude, draft.incidentLocation.longitude)} · {draft.incidentLocation.source === 'gps' ? 'GPS' : 'Ghim thủ công'}</Text>
            <Text style={styles.summaryMeta}>{draft.reporterLocation ? `Thiết bị đã chia sẻ GPS${draft.reporterLocation.accuracy !== null ? ` ±${Math.round(draft.reporterLocation.accuracy)} m` : ''}` : 'Không chia sẻ vị trí thiết bị'}</Text>
          </View>
          <Pressable accessibilityLabel="Sửa vị trí" onPress={() => router.back()} hitSlop={8}><Text style={styles.editText}>Sửa</Text></Pressable>
        </View>

        <View style={styles.labelRow}>
          <Text style={styles.label}>Mô tả hiện trường</Text>
          <Text style={styles.counter}>{draft.description.length}/2000</Text>
        </View>
        <TextInput
          value={draft.description}
          onChangeText={updateDescription}
          placeholder="Ví dụ: Xe máy va chạm ô tô tại giao lộ, một người bị thương ở tay, giao thông đang ùn theo hướng…"
          placeholderTextColor="#94a59a"
          multiline
          maxLength={2000}
          editable={!mutation.isPending}
          style={styles.textArea}
        />
        <View style={styles.privacyHint}><Ionicons name="lock-closed-outline" color={colors.muted} size={14} /><Text style={styles.hint}>Chỉ nêu thông tin cần thiết; tránh đăng số giấy tờ hoặc dữ liệu riêng tư của người khác.</Text></View>

        <View style={styles.labelRow}>
          <Text style={styles.label}>Ảnh hiện trường</Text>
          <Text style={styles.optional}>Không bắt buộc · tối đa 5 MB</Text>
        </View>
        {draft.attachment ? (
          <View style={styles.previewCard}>
            <Image source={{ uri: draft.attachment.uri }} resizeMode="cover" style={styles.preview} />
            <View style={styles.previewInfo}>
              <View style={styles.previewText}>
                <Text numberOfLines={1} style={styles.previewName}>{draft.attachment.fileName}</Text>
                <Text style={styles.previewMeta}>{draft.attachment.width} × {draft.attachment.height} px · {formatFileSize(draft.attachment.fileSize)}</Text>
                <Text style={styles.previewReady}><Ionicons name="checkmark-circle" size={13} /> Sẵn sàng tải lên</Text>
              </View>
              <View style={styles.imageActions}>
                <Pressable disabled={mutation.isPending} onPress={openImageMenu} style={styles.imageAction}><Ionicons name="sync-outline" color={colors.green} size={16} /><Text style={styles.imageActionText}>Thay</Text></Pressable>
                <Pressable accessibilityLabel="Xóa ảnh hiện trường" disabled={mutation.isPending} onPress={removeImage} style={styles.removeAction}><Ionicons name="trash-outline" color={colors.danger} size={16} /></Pressable>
              </View>
            </View>
          </View>
        ) : (
          <Pressable disabled={mutation.isPending} onPress={openImageMenu} style={({ pressed }) => [styles.upload, pressed && styles.uploadPressed]}>
            <View style={styles.uploadIcon}><Ionicons name="camera-outline" color={colors.green} size={25} /></View>
            <View style={styles.uploadTextBlock}>
              <Text style={styles.uploadText}>Chụp hoặc chọn ảnh</Text>
              <Text style={styles.uploadHint}>JPEG, PNG hoặc WebP · không quay video</Text>
            </View>
            <Ionicons name="add-circle-outline" color={colors.green} size={22} />
          </Pressable>
        )}

        {mutation.isPending ? (
          <View style={styles.progressCard}>
            <View style={styles.progressHeading}><Text style={styles.progressTitle}>{draft.attachment ? 'Đang tải ảnh và gửi tin…' : 'Đang gửi tin báo…'}</Text><Text style={styles.progressPercent}>{uploadProgress}%</Text></View>
            <View style={styles.uploadTrack}><View style={[styles.uploadFill, { width: `${Math.max(4, uploadProgress)}%` }]} /></View>
            <Text style={styles.progressHint}>Vui lòng giữ ứng dụng mở cho đến khi nhận mã tin báo.</Text>
          </View>
        ) : submissionError ? (
          <View accessibilityRole="alert" style={styles.errorCard}>
            <View style={styles.errorIcon}><Ionicons name="cloud-offline-outline" color={colors.danger} size={21} /></View>
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Tin báo chưa được gửi</Text>
              <Text style={styles.errorText}>{submissionError}</Text>
              <Text style={styles.errorPreserved}><Ionicons name="checkmark-circle-outline" size={13} /> Nội dung, vị trí và ảnh vẫn được giữ nguyên.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.readyCard}>
          <Text style={styles.readyTitle}>Sẵn sàng chuyển đến trực ban</Text>
          <View style={styles.readyRow}><Ionicons name="checkmark-circle" color={colors.green} size={17} /><Text style={styles.readyText}>Đã xác nhận loại sự việc và vị trí</Text></View>
          <View style={styles.readyRow}><Ionicons name="checkmark-circle" color={colors.green} size={17} /><Text style={styles.readyText}>{draft.attachment ? 'Ảnh hiện trường sẽ được tải kèm' : 'Không đính kèm ảnh hiện trường'}</Text></View>
          <View style={styles.readyRow}><Ionicons name="lock-closed" color={colors.green} size={16} /><Text style={styles.readyText}>Mã theo dõi chỉ lưu trên thiết bị này</Text></View>
        </View>

        <View style={styles.safety}>
          <Ionicons name="shield-checkmark-outline" color={colors.warningText} size={20} />
          <Text style={styles.safetyText}>Cung cấp thông tin trung thực. Không tiếp cận hiện trường nguy hiểm chỉ để chụp ảnh. Trường hợp đe dọa tính mạng, gọi ngay 113, 114 hoặc 115.</Text>
        </View>
        <PrimaryButton
          label={mutation.isPending ? `Đang gửi ${uploadProgress}%` : mutation.isError ? 'Thử gửi lại ngay' : 'Xác nhận và gửi tin báo'}
          disabled={mutation.isPending}
          onPress={confirmSubmission}
          icon={<Ionicons name={mutation.isError ? 'refresh-outline' : 'send-outline'} color={colors.surface} size={19} />}
        />
        <Text style={styles.submitNote}>Sau khi gửi thành công, ứng dụng lưu mã truy cập riêng trên thiết bị này để theo dõi tiến độ.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 48, backgroundColor: colors.background },
  title: { color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '900' },
  support: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: spacing.xs, marginBottom: spacing.lg },
  summary: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, marginBottom: spacing.lg },
  summaryIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#fcece8', alignItems: 'center', justifyContent: 'center' },
  summaryText: { flex: 1 },
  summaryTitle: { color: colors.ink, fontSize: 14, fontWeight: '900', marginBottom: 5 },
  summaryMeta: { color: colors.muted, fontSize: 10, lineHeight: 16 },
  editText: { color: colors.green, fontSize: 11, fontWeight: '900' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  label: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  counter: { color: colors.muted, fontSize: 10 },
  optional: { color: colors.muted, fontSize: 9 },
  textArea: { minHeight: 132, textAlignVertical: 'top', backgroundColor: colors.surface, borderWidth: 1, borderColor: '#dbe7df', borderRadius: radius.md, padding: 14, color: colors.ink, fontSize: 13, lineHeight: 19 },
  privacyHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: spacing.xs, marginBottom: spacing.lg },
  hint: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 16 },
  upload: { minHeight: 78, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#9ecab9', backgroundColor: '#fafdFA', borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md },
  uploadPressed: { backgroundColor: colors.paleGreen },
  uploadIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center' },
  uploadTextBlock: { flex: 1 },
  uploadText: { color: colors.green, fontSize: 12, fontWeight: '900' },
  uploadHint: { color: colors.muted, fontSize: 9, marginTop: 4 },
  previewCard: { overflow: 'hidden', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  preview: { width: '100%', height: 220, backgroundColor: '#edf2ee' },
  previewInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 12 },
  previewText: { flex: 1 },
  previewName: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  previewMeta: { color: colors.muted, fontSize: 9, marginTop: 3 },
  previewReady: { color: colors.green, fontSize: 9, fontWeight: '800', marginTop: 5 },
  imageActions: { flexDirection: 'row', gap: 7 },
  imageAction: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.paleGreen },
  imageActionText: { color: colors.green, fontSize: 10, fontWeight: '900' },
  removeAction: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fcece8' },
  progressCard: { padding: spacing.md, borderRadius: radius.md, backgroundColor: '#edf6f2', marginTop: spacing.md },
  progressHeading: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  progressTitle: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  progressPercent: { color: colors.green, fontSize: 11, fontWeight: '900' },
  uploadTrack: { height: 7, borderRadius: 4, backgroundColor: '#d4e7de', overflow: 'hidden', marginTop: 10 },
  uploadFill: { height: '100%', borderRadius: 4, backgroundColor: colors.green },
  progressHint: { color: colors.muted, fontSize: 9, marginTop: 8 },
  errorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: '#f1ccc4', backgroundColor: '#fff5f2', marginTop: spacing.md },
  errorIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fce4df' },
  errorContent: { flex: 1 },
  errorTitle: { color: colors.danger, fontSize: 12, fontWeight: '900' },
  errorText: { color: '#8c4b40', fontSize: 10, lineHeight: 16, marginTop: 4 },
  errorPreserved: { color: colors.green, fontSize: 9, lineHeight: 15, fontWeight: '800', marginTop: 7 },
  readyCard: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: '#d8e8df', backgroundColor: colors.surface, marginTop: spacing.lg },
  readyTitle: { color: colors.ink, fontSize: 12, fontWeight: '900', marginBottom: spacing.sm },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 7 },
  readyText: { flex: 1, color: colors.muted, fontSize: 10, lineHeight: 15 },
  safety: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.warningBackground, marginVertical: spacing.md },
  safetyText: { flex: 1, color: colors.warningText, fontSize: 10, lineHeight: 16 },
  submitNote: { color: colors.muted, textAlign: 'center', fontSize: 9, lineHeight: 15, marginTop: spacing.sm },
});
