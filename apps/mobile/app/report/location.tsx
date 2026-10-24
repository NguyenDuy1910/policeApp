import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type MapPressEvent, type MarkerDragStartEndEvent } from 'react-native-maps';
import { PrimaryButton, ReportProgress } from '@/components/ui';
import { useReportDraft } from '@/features/reports/report-draft-context';
import type { DraftLocation } from '@/features/reports/report-draft';
import { fetchPoliceUnits } from '@/services/api';
import { CA_MAU_CENTER, CA_MAU_REGION, distanceMeters, formatDistance, isWithinCaMauServiceArea } from '@/services/geo';
import { formatCoordinates } from '@/services/format';
import { colors, radius, spacing } from '@/theme';

export default function IncidentLocationScreen() {
  const mapRef = useRef<MapView>(null);
  const [locating, setLocating] = useState(false);
  const { draft, setIncidentLocation, setReporterLocation } = useReportDraft();
  const policeQuery = useQuery({ queryKey: ['police-units'], queryFn: fetchPoliceUnits });

  // Only the focused screen may redirect: after a successful submission the draft is cleared while this
  // screen is still mounted underneath the receipt, and an unfocused redirect would replace the receipt.
  useFocusEffect(
    useCallback(() => {
      if (!draft.incidentType) router.replace('/report/type');
    }, [draft.incidentType]),
  );

  const nearestUnit = useMemo(() => {
    if (!draft.incidentLocation) return null;
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const unit of policeQuery.data ?? []) {
      if (!unit.active || !unit.verified || unit.latitude === null || unit.longitude === null) continue;
      const distance = distanceMeters(draft.incidentLocation, { latitude: unit.latitude, longitude: unit.longitude });
      if (distance < nearestDistance) {
        nearest = unit;
        nearestDistance = distance;
      }
    }
    return nearest ? { unit: nearest, distance: nearestDistance } : null;
  }, [draft.incidentLocation, policeQuery.data]);

  const inServiceArea = draft.incidentLocation ? isWithinCaMauServiceArea(draft.incidentLocation) : true;

  function setManualPin(event: MapPressEvent): void {
    setIncidentLocation({
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude,
      accuracy: null,
      source: 'manual',
    });
  }

  function movePin(event: MarkerDragStartEndEvent): void {
    setIncidentLocation({
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude,
      accuracy: null,
      source: 'manual',
    });
  }

  function useCaMauCenter(): void {
    const location: DraftLocation = { ...CA_MAU_CENTER, accuracy: null, source: 'manual' };
    setIncidentLocation(location);
    mapRef.current?.animateToRegion(CA_MAU_REGION, 500);
  }

  async function useCurrentLocation(): Promise<void> {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Không có quyền GPS', 'Bạn vẫn có thể chạm bản đồ để đặt vị trí sự cố thủ công.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const reporterLocation: DraftLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        source: 'gps',
      };
      const applyLocation = () => {
        setReporterLocation(reporterLocation);
        setIncidentLocation({ ...reporterLocation });
        mapRef.current?.animateToRegion({ ...reporterLocation, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 500);
      };
      if (!isWithinCaMauServiceArea(reporterLocation)) {
        Alert.alert(
          'GPS đang ở ngoài Cà Mau',
          'Bạn có thể dùng vị trí này hoặc đặt ghim thủ công tại nơi sự việc thực sự xảy ra.',
          [
            { text: 'Về bản đồ Cà Mau', onPress: useCaMauCenter },
            { text: 'Dùng vị trí GPS', onPress: applyLocation },
          ],
        );
        return;
      }
      applyLocation();
    } catch (error) {
      Alert.alert('Không lấy được GPS', error instanceof Error ? error.message : 'Hãy đặt ghim thủ công.');
    } finally {
      setLocating(false);
    }
  }

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={styles.map} initialRegion={CA_MAU_REGION} onPress={setManualPin} showsCompass showsUserLocation={draft.reporterLocation !== null}>
        {draft.incidentLocation ? (
          <Marker coordinate={draft.incidentLocation} draggable onDragEnd={movePin} title="Vị trí sự cố">
            <View style={styles.incidentMarker}><Ionicons name="warning" color={colors.surface} size={18} /></View>
          </Marker>
        ) : null}
        {nearestUnit && nearestUnit.unit.latitude !== null && nearestUnit.unit.longitude !== null ? (
          <Marker coordinate={{ latitude: nearestUnit.unit.latitude, longitude: nearestUnit.unit.longitude }} title={nearestUnit.unit.name}>
            <View style={styles.policeMarker}><Ionicons name="shield" color={colors.surface} size={14} /></View>
          </Marker>
        ) : null}
      </MapView>
      <View pointerEvents="none" style={styles.tip}>
        <Text style={styles.tipText}>{draft.incidentLocation ? 'Chạm bản đồ hoặc kéo ghim đỏ để chỉnh vị trí' : 'Chạm đúng nơi xảy ra sự cố để đặt ghim'}</Text>
      </View>
      <Pressable accessibilityLabel="Về trung tâm Cà Mau" onPress={useCaMauCenter} style={styles.mapCenterButton}>
        <Ionicons name="map-outline" color={colors.ink} size={20} />
      </Pressable>

      <View style={styles.panel}>
        <ReportProgress step={2} />
        <Text style={styles.panelTitle}>Xác nhận vị trí sự cố</Text>
        <Text style={styles.panelLead}>Ghim đỏ là nơi cần hỗ trợ. Chấm xanh là vị trí thiết bị và chỉ xuất hiện khi bạn chủ động dùng GPS.</Text>

        <View style={[styles.locationCard, !inServiceArea && styles.locationCardWarning]}>
          <View style={[styles.locationIcon, !inServiceArea && styles.locationIconWarning]}>
            <Ionicons name={inServiceArea ? 'location' : 'alert-circle'} color={inServiceArea ? colors.green : colors.warningText} size={20} />
          </View>
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>{draft.incidentLocation ? 'VỊ TRÍ ĐÃ CHỌN' : 'CHƯA ĐẶT GHIM'}</Text>
            <Text style={styles.locationValue}>
              {draft.incidentLocation ? formatCoordinates(draft.incidentLocation.latitude, draft.incidentLocation.longitude) : 'Chạm bản đồ hoặc dùng GPS'}
            </Text>
            {draft.incidentLocation ? <Text style={styles.locationMeta}>{inServiceArea ? 'Trong khu vực tiếp nhận Cà Mau' : 'Ngoài khu vực tiếp nhận Cà Mau'} · {draft.incidentLocation.source === 'gps' ? 'Từ GPS' : 'Đặt thủ công'}</Text> : null}
          </View>
        </View>

        {nearestUnit ? (
          <View style={styles.routingPreview}>
            <Ionicons name="shield-checkmark-outline" color={colors.police} size={19} />
            <View style={styles.routingText}>
              <Text style={styles.routingLabel}>ĐƠN VỊ GẦN NHẤT DỰ KIẾN</Text>
              <Text style={styles.routingValue}>{nearestUnit.unit.name} · {formatDistance(nearestUnit.distance)}</Text>
            </View>
          </View>
        ) : null}

        {draft.reporterLocation ? (
          <Text style={styles.reporterText}>GPS thiết bị: {formatCoordinates(draft.reporterLocation.latitude, draft.reporterLocation.longitude)}{draft.reporterLocation.accuracy !== null ? ` · chính xác ±${Math.round(draft.reporterLocation.accuracy)} m` : ''}</Text>
        ) : null}

        <View style={styles.actionRow}>
          <Pressable onPress={() => void useCurrentLocation()} disabled={locating} style={({ pressed }) => [styles.gpsButton, pressed && styles.pressed]}>
            <Ionicons name={locating ? 'hourglass-outline' : 'locate-outline'} color={colors.green} size={18} />
            <Text style={styles.gpsButtonText}>{locating ? 'Đang lấy GPS…' : 'Dùng GPS của tôi'}</Text>
          </Pressable>
          <Text style={styles.manualHint}>hoặc chạm bản đồ</Text>
        </View>
        <PrimaryButton label="Tiếp tục thêm chi tiết" disabled={!draft.incidentLocation} onPress={() => router.push('/report/details')} icon={<Ionicons name="arrow-forward" color={colors.surface} size={18} />} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1, minHeight: 290 },
  tip: { position: 'absolute', top: spacing.md, left: 30, right: 30, alignItems: 'center' },
  tipText: { color: colors.ink, backgroundColor: '#ffffffee', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 24, fontSize: 10, fontWeight: '900', overflow: 'hidden', shadowColor: '#183b38', shadowOpacity: 0.1, shadowRadius: 8 },
  mapCenterButton: { position: 'absolute', top: 64, right: spacing.md, width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffffee', shadowColor: '#183b38', shadowOpacity: 0.13, shadowRadius: 7 },
  incidentMarker: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger, borderWidth: 3, borderColor: colors.surface, shadowColor: '#712b20', shadowOpacity: 0.25, shadowRadius: 4 },
  policeMarker: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.police, borderWidth: 3, borderColor: colors.surface },
  panel: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, marginTop: -14, padding: spacing.lg, paddingTop: spacing.md, gap: spacing.sm, elevation: 9 },
  panelTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  panelLead: { color: colors.muted, fontSize: 11, lineHeight: 17, marginBottom: 2 },
  locationCard: { flexDirection: 'row', gap: spacing.sm, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: '#d9e9e0', backgroundColor: colors.paleGreen },
  locationCardWarning: { borderColor: '#ead8b6', backgroundColor: colors.warningBackground },
  locationIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  locationIconWarning: { backgroundColor: '#fffaf1' },
  locationText: { flex: 1 },
  locationLabel: { color: colors.green, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  locationValue: { color: colors.ink, fontSize: 12, fontWeight: '900', marginTop: 4 },
  locationMeta: { color: colors.muted, fontSize: 9, marginTop: 4 },
  routingPreview: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.sm, backgroundColor: '#edf5fa' },
  routingText: { flex: 1 },
  routingLabel: { color: colors.police, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  routingValue: { color: colors.ink, fontSize: 10, fontWeight: '800', marginTop: 3 },
  reporterText: { color: colors.police, fontSize: 9, lineHeight: 14 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: 2 },
  gpsButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: 11, minHeight: 39, borderRadius: radius.sm, backgroundColor: colors.paleGreen },
  gpsButtonText: { color: colors.green, fontSize: 11, fontWeight: '900' },
  manualHint: { color: colors.muted, fontSize: 10 },
  pressed: { opacity: 0.78 },
});
