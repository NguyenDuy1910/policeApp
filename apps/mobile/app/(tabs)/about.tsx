import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmergencyNotice, SectionKicker } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <SectionKicker>VNPolice Care</SectionKicker>
      <Text style={styles.title}>An tâm, gần bạn, đúng lúc.</Text>
      <Text style={styles.lead}>
        Bản đồ an toàn và kênh báo tin trực tuyến giúp người dân Cà Mau gửi sự việc đến cán bộ trực ban và theo dõi tiến độ xử lý.
      </Text>
      <EmergencyNotice />
      <View style={styles.emergencyNumbers}>
        {[
          { number: '113', label: 'Công an', color: colors.police },
          { number: '114', label: 'Cứu hỏa', color: colors.danger },
          { number: '115', label: 'Cấp cứu', color: colors.green },
        ].map((item) => (
          <Pressable key={item.number} accessibilityLabel={`Gọi ${item.number} ${item.label}`} onPress={() => void Linking.openURL(`tel:${item.number}`)} style={({ pressed }) => [styles.emergencyItem, pressed && styles.pressed]}>
            <Ionicons name="call" size={15} color={item.color} />
            <Text style={[styles.emergencyNumber, { color: item.color }]}>{item.number}</Text>
            <Text style={styles.emergencyLabel}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="shield-outline" size={22} color={colors.green} />
          <View style={styles.textBlock}>
            <Text style={styles.rowTitle}>Chuyển đến đơn vị gần nhất</Text>
            <Text style={styles.rowText}>Tin báo được gửi về trung tâm tiếp nhận và phân công cho công an phường, xã gần vị trí sự việc. Ứng dụng không thay thế các số khẩn cấp.</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={22} color={colors.green} />
          <View style={styles.textBlock}>
            <Text style={styles.rowTitle}>Vị trí theo hành động rõ ràng</Text>
            <Text style={styles.rowText}>Quyền GPS chỉ được hỏi khi bạn nhấn định vị. Vị trí thiết bị và vị trí sự cố được lưu riêng.</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Ionicons name="lock-closed-outline" size={22} color={colors.green} />
          <View style={styles.textBlock}>
            <Text style={styles.rowTitle}>Theo dõi bằng quyền truy cập bảo mật</Text>
            <Text style={styles.rowText}>Mã truy cập tin báo được lưu bằng SecureStore trên thiết bị; mã tin báo đơn lẻ không mở được dữ liệu riêng tư.</Text>
          </View>
        </View>
        <View style={[styles.row, styles.lastRow]}>
          <Ionicons name="server-outline" size={22} color={colors.green} />
          <View style={styles.textBlock}>
            <Text style={styles.rowTitle}>Thông tin được kiểm duyệt</Text>
            <Text style={styles.rowText}>Thông tin đơn vị, cơ sở được quản trị viên xác minh; đánh giá của người dùng chỉ hiển thị sau khi kiểm duyệt.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 42, backgroundColor: colors.background },
  title: { color: colors.ink, fontSize: 29, lineHeight: 35, fontWeight: '800', marginBottom: spacing.sm },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 22, marginBottom: spacing.lg },
  emergencyNumbers: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  emergencyItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  emergencyNumber: { fontSize: 16, fontWeight: '900' },
  emergencyLabel: { color: colors.muted, fontSize: 8, fontWeight: '800' },
  pressed: { opacity: 0.72 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, marginTop: spacing.lg, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  lastRow: { borderBottomWidth: 0 },
  textBlock: { flex: 1 },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  rowText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
