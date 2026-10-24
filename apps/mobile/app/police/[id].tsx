import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { PrimaryButton, QueryState, SecondaryButton } from '@/components/ui';
import { fetchPoliceUnits } from '@/services/api';
import { formatCoordinates } from '@/services/format';
import { colors, radius, spacing } from '@/theme';

export default function PoliceDetailsScreen() {
  const parameters = useLocalSearchParams<{ id: string }>();
  const unitId = Number(parameters.id);
  const query = useQuery({ queryKey: ['police-units'], queryFn: fetchPoliceUnits });
  const unit = query.data?.find((item) => item.id === unitId);

  async function callDutyNumber(): Promise<void> {
    if (!unit?.dutyHotline) return;
    try {
      await Linking.openURL(`tel:${unit.dutyHotline}`);
    } catch {
      Alert.alert('Không mở được trình gọi điện', 'Hãy nhập số trực ban thủ công.');
    }
  }

  async function openDirections(): Promise<void> {
    if (!unit?.verified || unit.latitude === null || unit.longitude === null) return;
    const label = encodeURIComponent(unit.name);
    const destination = `${unit.latitude},${unit.longitude}`;
    const url = Platform.OS === 'ios' ? `maps://?daddr=${destination}&q=${label}` : `geo:0,0?q=${destination}(${label})`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Không mở được ứng dụng bản đồ', 'Thiết bị chưa có ứng dụng điều hướng phù hợp.');
    }
  }

  if (query.isLoading || query.error) {
    return <QueryState loading={query.isLoading} error={query.error} />;
  }
  if (!unit) {
    return <QueryState loading={false} error={new Error('Không tìm thấy đơn vị công an.')} />;
  }

  const coordinates = unit.verified && unit.latitude !== null && unit.longitude !== null
    ? { latitude: unit.latitude, longitude: unit.longitude }
    : null;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.iconBox}>
          <Ionicons name="shield-checkmark-outline" size={34} color={colors.police} />
        </View>
        <Text style={styles.level}>{unit.administrativeLevel}</Text>
        <Text style={styles.title}>{unit.name}</Text>
        <Text style={[styles.badge, unit.verified ? styles.verified : styles.unverified]}>
          {unit.verified ? 'Dữ liệu đã xác minh' : 'Chưa xác minh độc lập'}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.fact}>
          <Ionicons name="location-outline" color={colors.green} size={20} />
          <View style={styles.factText}>
            <Text style={styles.factLabel}>Địa chỉ</Text>
            <Text style={styles.factValue}>{unit.address ?? 'Chưa có địa chỉ được xác minh.'}</Text>
            {!unit.verified ? <Text style={styles.caution}>Không hiển thị là địa chỉ chính thức khi bản ghi chưa xác minh.</Text> : null}
          </View>
        </View>
        <View style={styles.fact}>
          <Ionicons name="call-outline" color={colors.green} size={20} />
          <View style={styles.factText}>
            <Text style={styles.factLabel}>Số trực đơn vị</Text>
            <Text style={styles.factValue}>{unit.dutyHotline ?? 'Chưa có số trực ban.'}</Text>
            {!unit.verified && unit.dutyHotline ? <Text style={styles.caution}>Số từ tài liệu tham chiếu; chưa xác minh độc lập.</Text> : null}
          </View>
        </View>
        <View style={styles.fact}>
          <Ionicons name="navigate-outline" color={colors.green} size={20} />
          <View style={styles.factText}>
            <Text style={styles.factLabel}>Tọa độ</Text>
            <Text style={styles.factValue}>
              {unit.latitude !== null && unit.longitude !== null ? formatCoordinates(unit.latitude, unit.longitude) : 'Chưa có tọa độ.'}
            </Text>
          </View>
        </View>
        <View style={styles.fact}>
          <Ionicons name="document-text-outline" color={colors.green} size={20} />
          <View style={styles.factText}>
            <Text style={styles.factLabel}>Nguồn / trạng thái</Text>
            <Text style={styles.factValue}>{unit.verificationSource ?? 'Chưa cung cấp nguồn xác minh.'}</Text>
          </View>
        </View>
      </View>

      {coordinates ? (
        <MapView
          style={styles.map}
          initialRegion={{ ...coordinates, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker coordinate={coordinates} pinColor={colors.police} />
        </MapView>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton
          label="Gọi số trực"
          disabled={!unit.dutyHotline}
          onPress={() => void callDutyNumber()}
          icon={<Ionicons name="call-outline" color={colors.surface} size={19} />}
        />
        <SecondaryButton
          label="Mở chỉ đường"
          disabled={!coordinates}
          onPress={() => void openDirections()}
          icon={<Ionicons name="navigate-outline" color={colors.green} size={19} />}
        />
      </View>
      {!coordinates ? (
        <Text style={styles.footerNote}>Chỉ đường bị tắt cho đến khi tọa độ và nguồn của đơn vị được xác minh.</Text>
      ) : (
        <Text style={styles.footerNote}>Số trực ban phục vụ tiếp nhận theo địa bàn. Trường hợp khẩn cấp, gọi 113.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 44, backgroundColor: colors.background },
  hero: { alignItems: 'center', paddingVertical: spacing.md },
  iconBox: { width: 68, height: 68, borderRadius: 22, backgroundColor: '#e5f0f7', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  level: { color: colors.police, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.ink, fontSize: 25, lineHeight: 31, textAlign: 'center', fontWeight: '800', marginTop: spacing.xs },
  badge: { marginTop: spacing.md, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, overflow: 'hidden', fontSize: 11, fontWeight: '800' },
  verified: { color: colors.green, backgroundColor: colors.paleGreen },
  unverified: { color: colors.warningText, backgroundColor: colors.warningBackground },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, paddingHorizontal: spacing.md, marginTop: spacing.md },
  fact: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  factText: { flex: 1 },
  factLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 4 },
  factValue: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  caution: { color: colors.warningText, fontSize: 11, lineHeight: 16, marginTop: 4 },
  map: { height: 190, borderRadius: radius.lg, marginTop: spacing.md, overflow: 'hidden' },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  footerNote: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: spacing.md },
});
