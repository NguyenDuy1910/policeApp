import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import type { Place, PoliceUnit } from '@vnpolice/shared';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useReportDraft } from '@/features/reports/report-draft-context';
import { fetchPlaces, fetchPoliceUnits } from '@/services/api';
import {
  CA_MAU_REGION,
  distanceMeters,
  formatDistance,
  isWithinCaMauServiceArea,
  normalizeVietnameseSearch,
  type Coordinates,
} from '@/services/geo';
import { colors, radius, spacing } from '@/theme';

type MapFilter = 'all' | 'police' | 'food' | 'service';
type Selection = { kind: 'police'; item: PoliceUnit } | { kind: 'place'; item: Place };

const filterOptions: { key: MapFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'Tất cả', icon: 'apps-outline' },
  { key: 'police', label: 'Công an', icon: 'shield-outline' },
  { key: 'food', label: 'Ăn uống', icon: 'restaurant-outline' },
  { key: 'service', label: 'Dịch vụ', icon: 'construct-outline' },
];

export default function HomeMapScreen() {
  const mapRef = useRef<MapView>(null);
  const { begin } = useReportDraft();
  const [filter, setFilter] = useState<MapFilter>('all');
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const policeQuery = useQuery({ queryKey: ['police-units'], queryFn: fetchPoliceUnits });
  const placesQuery = useQuery({ queryKey: ['places'], queryFn: fetchPlaces });
  const policeUnits = policeQuery.data ?? [];
  const places = placesQuery.data ?? [];
  const normalizedSearch = normalizeVietnameseSearch(search);

  const searchResults = useMemo<Selection[]>(() => {
    if (!normalizedSearch) return [];
    const matchingPolice = filter === 'all' || filter === 'police'
      ? policeUnits
          .filter((unit) => normalizeVietnameseSearch(`${unit.name} ${unit.address ?? ''}`).includes(normalizedSearch))
          .map((item) => ({ kind: 'police' as const, item }))
      : [];
    const matchingPlaces = filter === 'all' || filter === 'food' || filter === 'service'
      ? places
          .filter((place) => (filter === 'all' || place.category === filter) && normalizeVietnameseSearch(`${place.name} ${place.address}`).includes(normalizedSearch))
          .map((item) => ({ kind: 'place' as const, item }))
      : [];
    return [...matchingPolice, ...matchingPlaces].slice(0, 8);
  }, [filter, normalizedSearch, places, policeUnits]);

  const selectedCoordinates = selection?.item.latitude !== null && selection?.item.longitude !== null && selection
    ? { latitude: selection.item.latitude, longitude: selection.item.longitude }
    : null;
  const selectedDistance = userLocation && selectedCoordinates
    ? formatDistance(distanceMeters(userLocation, selectedCoordinates))
    : null;
  const loading = policeQuery.isLoading || placesQuery.isLoading;
  const loadError = policeQuery.error ?? placesQuery.error;

  async function locateUser(): Promise<void> {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Chưa cấp quyền vị trí', 'Bạn vẫn có thể xem dữ liệu Cà Mau và đặt ghim sự cố thủ công.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setUserLocation(coordinates);
      if (!isWithinCaMauServiceArea(coordinates)) {
        Alert.alert(
          'Bạn đang ở ngoài khu vực Cà Mau',
          'Vị trí thiết bị vẫn được ghi nhận. Bạn có thể quay về bản đồ Cà Mau để xem đơn vị và dịch vụ tại địa phương.',
          [
            { text: 'Xem vị trí của tôi', onPress: () => mapRef.current?.animateToRegion({ ...coordinates, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 500) },
            { text: 'Về Cà Mau', onPress: () => mapRef.current?.animateToRegion(CA_MAU_REGION, 500) },
          ],
        );
        return;
      }
      mapRef.current?.animateToRegion({ ...coordinates, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 500);
    } catch (error) {
      Alert.alert('Không lấy được GPS', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setLocating(false);
    }
  }

  function chooseResult(result: Selection): void {
    setSearch('');
    setSelection(result);
    const { latitude, longitude } = result.item;
    if (latitude !== null && longitude !== null) {
      mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 400);
    }
  }

  function startReport(): void {
    begin();
    router.push('/report/type');
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={CA_MAU_REGION}
        showsCompass
        showsUserLocation={userLocation !== null}
        showsMyLocationButton={false}
        mapPadding={{ top: 170, right: 12, bottom: 150, left: 12 }}
      >
        {(filter === 'all' || filter === 'police') && policeUnits.map((unit) =>
          unit.latitude !== null && unit.longitude !== null ? (
            <Marker key={`police-${unit.id}`} coordinate={{ latitude: unit.latitude, longitude: unit.longitude }} onPress={() => setSelection({ kind: 'police', item: unit })}>
              <View style={[styles.mapMarker, styles.policeMarker]}>
                <Ionicons name="shield" color={colors.surface} size={16} />
              </View>
            </Marker>
          ) : null,
        )}
        {places.map((place) => filter === 'all' || filter === place.category ? (
          <Marker key={`place-${place.id}`} coordinate={{ latitude: place.latitude, longitude: place.longitude }} onPress={() => setSelection({ kind: 'place', item: place })}>
            <View style={[styles.mapMarker, place.category === 'food' ? styles.foodMarker : styles.serviceMarker]}>
              <Ionicons name={place.category === 'food' ? 'restaurant' : 'construct'} color={colors.surface} size={15} />
            </View>
          </Marker>
        ) : null)}
      </MapView>

      <View style={styles.topPanel}>
        <View style={styles.contextRow}>
          <View>
            <Text style={styles.contextKicker}>BẢN ĐỒ AN TOÀN</Text>
            <Text style={styles.contextTitle}>Cà Mau</Text>
          </View>
          <View style={styles.dataStatus}>
            <View style={[styles.dataDot, loadError ? styles.dataDotError : null]} />
            <Text style={styles.dataStatusText}>{loadError ? 'Mất kết nối dữ liệu' : loading ? 'Đang tải dữ liệu…' : `${policeUnits.length} đơn vị · ${places.length} địa điểm`}</Text>
          </View>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={colors.green} />
          <TextInput
            accessibilityLabel="Tìm địa điểm hoặc đơn vị công an"
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm tên, đường, phường/xã…"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
          {search.length > 0 ? (
            <Pressable accessibilityLabel="Xóa từ khóa" onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={19} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.filters}>
          {filterOptions.map((option) => (
            <Pressable key={option.key} onPress={() => setFilter(option.key)} style={[styles.filter, filter === option.key && styles.filterActive]}>
              <Ionicons name={option.icon} size={14} color={filter === option.key ? colors.surface : colors.muted} />
              <Text style={[styles.filterText, filter === option.key && styles.filterTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        {normalizedSearch ? (
          <View style={styles.results}>
            {searchResults.length === 0 ? <Text style={styles.emptyResult}>Không tìm thấy dữ liệu phù hợp.</Text> : null}
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={searchResults}
              keyExtractor={(result) => `${result.kind}-${result.item.id}`}
              renderItem={({ item: result }) => (
                <Pressable onPress={() => chooseResult(result)} style={styles.resultRow}>
                  <View style={[styles.resultIcon, result.kind === 'police' ? styles.resultIconPolice : null]}>
                    <Ionicons name={result.kind === 'police' ? 'shield-outline' : result.item.category === 'food' ? 'restaurant-outline' : 'construct-outline'} size={18} color={result.kind === 'police' ? colors.police : colors.green} />
                  </View>
                  <View style={styles.resultText}>
                    <Text style={styles.resultTitle}>{result.item.name}</Text>
                    <Text numberOfLines={1} style={styles.resultMeta}>{result.item.address ?? 'Chưa cập nhật địa chỉ'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" color={colors.muted} size={17} />
                </Pressable>
              )}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.mapTools}>
        <Pressable accessibilityLabel="Về trung tâm Cà Mau" onPress={() => mapRef.current?.animateToRegion(CA_MAU_REGION, 500)} style={styles.toolButton}>
          <Ionicons name="map-outline" color={colors.ink} size={21} />
        </Pressable>
        <Pressable accessibilityLabel="Dùng vị trí của tôi" onPress={() => void locateUser()} style={styles.toolButton}>
          <Ionicons name={locating ? 'hourglass-outline' : 'locate'} color={colors.green} size={22} />
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={startReport} style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}>
        <View style={styles.reportIcon}><Ionicons name="warning-outline" color={colors.surface} size={24} /></View>
        <View style={styles.reportText}>
          <Text style={styles.reportButtonText}>Báo tin sự cố</Text>
          <Text style={styles.reportButtonHelper}>Gửi vị trí, mô tả và ảnh hiện trường</Text>
        </View>
        <Ionicons name="arrow-forward" color={colors.surface} size={20} />
      </Pressable>

      <Modal visible={selection !== null} transparent animationType="slide" onRequestClose={() => setSelection(null)}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Đóng chi tiết" style={styles.backdrop} onPress={() => setSelection(null)} />
          <View style={styles.sheet}>
            <View style={styles.grab} />
            {selection ? (
              <>
                <View style={styles.sheetHeading}>
                  <View style={[styles.sheetIcon, selection.kind === 'police' ? styles.sheetIconPolice : null]}>
                    <Ionicons name={selection.kind === 'police' ? 'shield' : selection.item.category === 'food' ? 'restaurant' : 'construct'} color={selection.kind === 'police' ? colors.police : colors.green} size={22} />
                  </View>
                  <View style={styles.sheetHeadingText}>
                    <Text style={styles.sheetKicker}>{selection.kind === 'police' ? selection.item.administrativeLevel : selection.item.category === 'food' ? 'ĂN UỐNG' : 'DỊCH VỤ'}</Text>
                    <Text style={styles.sheetTitle}>{selection.item.name}</Text>
                  </View>
                </View>
                <View style={styles.sheetBadges}>
                  <Text style={[styles.verification, selection.item.verified ? styles.verified : styles.unverified]}>{selection.item.verified ? 'Đã xác minh' : 'Chưa xác minh'}</Text>
                  {selectedDistance ? <Text style={styles.distanceBadge}><Ionicons name="navigate-outline" size={12} /> Cách bạn {selectedDistance}</Text> : null}
                </View>
                <View style={styles.addressRow}>
                  <Ionicons name="location-outline" color={colors.muted} size={18} />
                  <Text style={styles.sheetAddress}>{selection.item.address ?? 'Chưa cập nhật địa chỉ.'}</Text>
                </View>
                <View style={styles.sheetFacts}>
                  {selection.kind === 'police' ? (
                    <>
                      <View><Text style={styles.factLabel}>SỐ TRỰC BAN</Text><Text style={styles.factValue}>{selection.item.dutyHotline ?? 'Chưa cập nhật'}</Text></View>
                      <View><Text style={styles.factLabel}>TRẠNG THÁI</Text><Text style={styles.factValue}>{selection.item.active ? 'Đang hoạt động' : 'Tạm ngưng'}</Text></View>
                    </>
                  ) : (
                    <>
                      <View><Text style={styles.factLabel}>ĐIỂM ĐÁNH GIÁ</Text><Text style={styles.factValue}>★ {selection.item.averageRating ?? 'Chưa có'}</Text></View>
                      <View><Text style={styles.factLabel}>LƯỢT ĐÁNH GIÁ</Text><Text style={styles.factValue}>{selection.item.reviewCount}</Text></View>
                    </>
                  )}
                </View>
                <Pressable
                  onPress={() => {
                    const target = selection.kind === 'police' ? `/police/${selection.item.id}` : `/place/${selection.item.id}`;
                    setSelection(null);
                    router.push(target);
                  }}
                  style={styles.sheetAction}
                >
                  <Text style={styles.sheetActionText}>Xem thông tin chi tiết</Text>
                  <Ionicons name="arrow-forward" color={colors.surface} size={18} />
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf0e8' },
  topPanel: { position: 'absolute', top: spacing.sm, left: spacing.md, right: spacing.md },
  contextRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.xs },
  contextKicker: { color: colors.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  contextTitle: { color: colors.ink, fontSize: 21, lineHeight: 23, fontWeight: '900' },
  dataStatus: { maxWidth: '62%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18, backgroundColor: '#ffffffed' },
  dataDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#20a875' },
  dataDotError: { backgroundColor: colors.danger },
  dataStatusText: { flexShrink: 1, color: colors.muted, fontSize: 9, fontWeight: '800' },
  searchBox: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.sm, shadowColor: '#203d37', shadowOpacity: 0.14, shadowRadius: 14, elevation: 5 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14, paddingVertical: 12 },
  filters: { flexDirection: 'row', gap: 6, marginTop: 8 },
  filter: { flex: 1, minHeight: 37, paddingHorizontal: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fffffff3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  filterActive: { backgroundColor: colors.green, borderColor: colors.green },
  filterText: { color: '#516d60', fontSize: 9, fontWeight: '800' },
  filterTextActive: { color: colors.surface },
  results: { backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.sm, maxHeight: 326, overflow: 'hidden', elevation: 7 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 12, borderBottomColor: colors.line, borderBottomWidth: StyleSheet.hairlineWidth },
  resultIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.paleGreen, alignItems: 'center', justifyContent: 'center' },
  resultIconPolice: { backgroundColor: '#e8f2f8' },
  resultText: { flex: 1 },
  resultTitle: { color: colors.ink, fontWeight: '800', fontSize: 13 },
  resultMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  emptyResult: { color: colors.muted, padding: spacing.md, textAlign: 'center' },
  mapMarker: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface, shadowColor: '#153f38', shadowOpacity: 0.28, shadowRadius: 4, elevation: 5 },
  policeMarker: { backgroundColor: colors.police },
  foodMarker: { backgroundColor: colors.green },
  serviceMarker: { backgroundColor: colors.amber },
  mapTools: { position: 'absolute', right: spacing.md, bottom: 92, gap: 8 },
  toolButton: { width: 47, height: 47, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, shadowColor: '#203d37', shadowOpacity: 0.16, shadowRadius: 8, elevation: 5 },
  reportButton: { position: 'absolute', left: spacing.md, right: 77, bottom: spacing.md, minHeight: 66, borderRadius: radius.lg, paddingHorizontal: 12, backgroundColor: colors.danger, alignItems: 'center', flexDirection: 'row', gap: 10, shadowColor: '#6b251b', shadowOpacity: 0.23, shadowRadius: 8, elevation: 6 },
  reportIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#ffffff20', alignItems: 'center', justifyContent: 'center' },
  reportText: { flex: 1 },
  reportButtonText: { color: colors.surface, fontSize: 15, fontWeight: '900' },
  reportButtonHelper: { color: '#ffe4dc', fontSize: 9, marginTop: 3 },
  pressed: { opacity: 0.82 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', inset: 0, backgroundColor: '#0b242061' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: spacing.lg, paddingBottom: 32, paddingTop: 10 },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#d6dfd8', alignSelf: 'center', marginBottom: spacing.lg },
  sheetHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sheetIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paleGreen },
  sheetIconPolice: { backgroundColor: '#e7f1f7' },
  sheetHeadingText: { flex: 1 },
  sheetKicker: { color: colors.green, fontWeight: '900', fontSize: 9, letterSpacing: 1.1, marginBottom: 4 },
  sheetTitle: { color: colors.ink, fontWeight: '900', fontSize: 21, lineHeight: 27 },
  sheetBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: spacing.md },
  verification: { borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 6, fontSize: 10, fontWeight: '800', overflow: 'hidden' },
  verified: { color: colors.green, backgroundColor: colors.paleGreen },
  unverified: { color: colors.warningText, backgroundColor: colors.warningBackground },
  distanceBadge: { color: colors.police, backgroundColor: '#e8f2f8', borderRadius: 20, paddingHorizontal: spacing.sm, paddingVertical: 6, fontSize: 10, fontWeight: '800', overflow: 'hidden' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginVertical: spacing.md },
  sheetAddress: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 20 },
  sheetFacts: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  factLabel: { color: '#8a9c93', fontSize: 8, fontWeight: '900', letterSpacing: 0.7, marginBottom: 5 },
  factValue: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  sheetAction: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  sheetActionText: { color: colors.surface, fontWeight: '900' },
});
