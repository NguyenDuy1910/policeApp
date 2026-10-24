import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

export function EmergencyNotice() {
  return (
    <View style={styles.notice}>
      <Ionicons name="information-circle-outline" color={colors.warningText} size={18} />
      <Text style={styles.noticeText}>Nguy hiểm tức thời: gọi 113 (công an), 114 (cứu hỏa) hoặc 115 (cấp cứu).</Text>
    </View>
  );
}

export function Page({ children }: PropsWithChildren) {
  return <View style={styles.page}>{children}</View>;
}

export function SectionKicker({ children }: PropsWithChildren) {
  return <Text style={styles.kicker}>{children}</Text>;
}

export function ReportProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View accessibilityLabel={`Bước ${step} trên 3`} style={styles.progress}>
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.progressItem}>
          <View style={[styles.progressBar, item <= step ? styles.progressBarActive : null]} />
          <Text style={[styles.progressLabel, item === step ? styles.progressLabelActive : null]}>
            {item === 1 ? 'Sự việc' : item === 2 ? 'Vị trí' : 'Chi tiết'}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled = false, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primary, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      {icon}
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled = false, icon }: { label: string; onPress: () => void; disabled?: boolean; icon?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.secondary, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      {icon}
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function QueryState({ loading, error }: { loading: boolean; error: Error | null }) {
  if (loading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator color={colors.green} />
        <Text style={styles.stateText}>Đang tải dữ liệu…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.stateBox}>
        <Ionicons name="cloud-offline-outline" color={colors.danger} size={24} />
        <Text style={styles.stateText}>{error.message}</Text>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#f4e7cc',
    padding: spacing.md,
    backgroundColor: '#fff9ed',
    alignItems: 'flex-start',
  },
  noticeText: { flex: 1, color: colors.warningText, fontSize: 12, lineHeight: 18 },
  kicker: { color: colors.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: spacing.xs },
  progress: { flexDirection: 'row', gap: 7, marginBottom: spacing.lg },
  progressItem: { flex: 1, gap: 6 },
  progressBar: { height: 4, borderRadius: 2, backgroundColor: '#dfe8e2' },
  progressBarActive: { backgroundColor: colors.green },
  progressLabel: { color: '#9aaba2', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  progressLabelActive: { color: colors.green, fontWeight: '900' },
  primary: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryText: { color: colors.surface, fontSize: 14, fontWeight: '800' },
  secondary: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.paleGreen,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryText: { color: colors.green, fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  stateBox: { gap: spacing.sm, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  stateText: { color: colors.muted, textAlign: 'center', lineHeight: 19 },
});
