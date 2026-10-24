import { Ionicons } from '@expo/vector-icons';
import type { IncidentType } from '@vnpolice/shared';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmergencyNotice, ReportProgress, SectionKicker } from '@/components/ui';
import { useReportDraft } from '@/features/reports/report-draft-context';
import { colors, radius, spacing } from '@/theme';

const incidentOptions: { key: IncidentType; title: string; helper: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'fire', title: 'Cháy / hỏa hoạn', helper: 'Khói, lửa, rò rỉ khí hoặc nguy cơ cháy lan', icon: 'flame-outline' },
  { key: 'traffic_accident', title: 'Tai nạn giao thông', helper: 'Va chạm, người bị nạn hoặc vật cản nguy hiểm', icon: 'car-outline' },
  { key: 'fighting', title: 'Đánh nhau / bạo lực', helper: 'Xô xát, đe dọa hoặc có hung khí', icon: 'people-outline' },
  { key: 'public_security', title: 'An ninh / trật tự', helper: 'Trộm cắp, gây rối hoặc dấu hiệu bất thường', icon: 'shield-outline' },
  { key: 'other', title: 'Sự việc khác', helper: 'Người đi lạc, cây đổ hoặc tình huống cần hỗ trợ', icon: 'ellipsis-horizontal-outline' },
];

export default function IncidentTypeScreen() {
  const { setIncidentType } = useReportDraft();

  function selectType(incidentType: IncidentType): void {
    setIncidentType(incidentType);
    router.push('/report/location');
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionKicker>Gửi tin báo</SectionKicker>
      <ReportProgress step={1} />
      <Text style={styles.title}>Chuyện gì đang xảy ra?</Text>
      <Text style={styles.support}>Chọn nhóm gần nhất với tình huống bạn quan sát. Bạn có thể bổ sung mô tả và ảnh ở bước cuối.</Text>
      <View style={styles.list}>
        {incidentOptions.map((option, index) => (
          <Pressable key={option.key} onPress={() => selectType(option.key)} style={({ pressed }) => [styles.choice, pressed && styles.pressed]}>
            <View style={[styles.symbol, index === 1 && styles.symbolAmber, index === 3 && styles.symbolBlue]}>
              <Ionicons name={option.icon} size={24} color={index === 1 ? colors.amber : index === 3 ? colors.police : colors.danger} />
            </View>
            <View style={styles.choiceText}>
              <Text style={styles.choiceTitle}>{option.title}</Text>
              <Text style={styles.choiceHelper}>{option.helper}</Text>
            </View>
            <Ionicons name="chevron-forward" color="#9db0a5" size={19} />
          </Pressable>
        ))}
      </View>
      <View style={styles.noticeSpace}><EmergencyNotice /></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40, backgroundColor: colors.background },
  title: { color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  support: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: spacing.xs, marginBottom: spacing.lg },
  list: { gap: spacing.sm },
  choice: { minHeight: 82, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.md, padding: 14, flexDirection: 'row', alignItems: 'center', gap: spacing.md, shadowColor: '#183b38', shadowOpacity: 0.035, shadowRadius: 8 },
  pressed: { borderColor: '#76bca6', opacity: 0.85 },
  symbol: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fceae4', alignItems: 'center', justifyContent: 'center' },
  symbolAmber: { backgroundColor: '#fff0df' },
  symbolBlue: { backgroundColor: '#e8f2f8' },
  choiceText: { flex: 1 },
  choiceTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  choiceHelper: { color: '#71877d', fontSize: 11, lineHeight: 16, marginTop: 4 },
  noticeSpace: { marginTop: spacing.lg },
});
