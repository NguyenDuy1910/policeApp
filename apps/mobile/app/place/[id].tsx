import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { PrimaryButton, QueryState, SecondaryButton, SectionKicker } from '@/components/ui';
import { fetchPlaces, fetchReviews, submitReview } from '@/services/api';
import { formatDateTime } from '@/services/format';
import { colors, radius, spacing } from '@/theme';

export default function PlaceDetailsScreen() {
  const parameters = useLocalSearchParams<{ id: string }>();
  const placeId = Number(parameters.id);
  const queryClient = useQueryClient();
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const placesQuery = useQuery({ queryKey: ['places'], queryFn: fetchPlaces });
  const reviewsQuery = useQuery({ queryKey: ['place-reviews', placeId], queryFn: () => fetchReviews(placeId), enabled: Number.isInteger(placeId) });
  const mutation = useMutation({
    mutationFn: () => submitReview(placeId, authorName, rating, comment),
    onSuccess: async () => {
      setAuthorName('');
      setComment('');
      setRating(5);
      await queryClient.invalidateQueries({ queryKey: ['place-reviews', placeId] });
      Alert.alert('Đã gửi đánh giá', 'Đánh giá đang chờ quản trị viên kiểm duyệt trước khi hiển thị.');
    },
    onError: (error: Error) => Alert.alert('Không gửi được đánh giá', error.message),
  });
  const place = placesQuery.data?.find((item) => item.id === placeId);

  async function openDirections(): Promise<void> {
    if (!place) return;
    const label = encodeURIComponent(place.name);
    const destination = `${place.latitude},${place.longitude}`;
    const url = Platform.OS === 'ios' ? `maps://?daddr=${destination}&q=${label}` : `geo:0,0?q=${destination}(${label})`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Không mở được ứng dụng bản đồ', 'Thiết bị chưa có ứng dụng điều hướng phù hợp.');
    }
  }

  if (placesQuery.isLoading || placesQuery.error) {
    return <QueryState loading={placesQuery.isLoading} error={placesQuery.error} />;
  }
  if (!place) return <QueryState loading={false} error={new Error('Không tìm thấy cơ sở.')} />;

  const validReview = authorName.trim().length >= 2 && comment.trim().length >= 3;
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionKicker>{place.category === 'food' ? 'Ăn uống' : 'Dịch vụ'}</SectionKicker>
        <Text style={styles.title}>{place.name}</Text>
        <View style={styles.ratingLine}>
          <Ionicons name="star" color={colors.amber} size={18} />
          <Text style={styles.ratingText}>
            {place.averageRating ?? 'Chưa có điểm'} · {place.reviewCount} đánh giá đã duyệt
          </Text>
        </View>
        <Text style={[styles.badge, place.verified ? styles.verified : styles.unverified]}>
          {place.verified ? 'Thông tin cơ sở đã xác minh' : 'Chưa xác minh'}
        </Text>

        <MapView
          style={styles.map}
          initialRegion={{ latitude: place.latitude, longitude: place.longitude, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker coordinate={{ latitude: place.latitude, longitude: place.longitude }} pinColor={colors.green} />
        </MapView>
        <View style={styles.mapCaption}>
          <View style={styles.mapCaptionText}><Ionicons name="location-outline" color={colors.green} size={16} /><Text numberOfLines={1} style={styles.mapAddress}>{place.address}</Text></View>
          <SecondaryButton label="Chỉ đường" onPress={() => void openDirections()} icon={<Ionicons name="navigate-outline" color={colors.green} size={17} />} />
        </View>

        <View style={styles.card}>
          <Text style={styles.factLabel}>Địa chỉ</Text>
          <Text style={styles.factValue}>{place.address}</Text>
          <View style={styles.divider} />
          <Text style={styles.factLabel}>Trạng thái xác minh</Text>
          <Text style={styles.factValue}>{place.verificationSource ?? 'Chưa có tổ chức xác minh.'}</Text>
          <Text style={styles.source}>Nguồn dữ liệu: {place.dataSource}</Text>
        </View>

        <View style={styles.distinction}>
          <Ionicons name="shield-checkmark-outline" color={colors.green} size={21} />
          <Text style={styles.distinctionText}>
            Trạng thái xác minh chỉ áp dụng cho thông tin cơ sở. Điểm số và nội dung bên dưới do người dùng gửi, không phải đánh giá của công an.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Đánh giá người dùng</Text>
        <QueryState loading={reviewsQuery.isLoading} error={reviewsQuery.error} />
        {(reviewsQuery.data ?? []).map((review) => (
          <View key={review.id} style={styles.review}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{review.authorName}</Text>
              <Text style={styles.stars}>{'★'.repeat(review.rating)}</Text>
            </View>
            <Text style={styles.reviewComment}>{review.comment}</Text>
            <Text style={styles.reviewMeta}>{formatDateTime(review.createdAt)}</Text>
          </View>
        ))}
        {!reviewsQuery.isLoading && (reviewsQuery.data?.length ?? 0) === 0 ? <Text style={styles.empty}>Chưa có đánh giá đã duyệt.</Text> : null}

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Gửi đánh giá</Text>
          <Text style={styles.formHint}>Đánh giá mới chỉ xuất hiện sau khi được kiểm duyệt.</Text>
          <TextInput
            value={authorName}
            onChangeText={setAuthorName}
            placeholder="Tên hiển thị"
            placeholderTextColor={colors.muted}
            style={styles.input}
            maxLength={80}
          />
          <View style={styles.starPicker}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)} accessibilityLabel={`${value} sao`}>
                <Ionicons name={value <= rating ? 'star' : 'star-outline'} size={30} color={colors.amber} />
              </Pressable>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Chia sẻ trải nghiệm của bạn"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.multiline]}
            multiline
            maxLength={1000}
          />
          <PrimaryButton label={mutation.isPending ? 'Đang gửi…' : 'Gửi đánh giá'} disabled={!validReview || mutation.isPending} onPress={() => mutation.mutate()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: 48, backgroundColor: colors.background },
  title: { color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  ratingLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  ratingText: { color: colors.muted, fontSize: 13 },
  badge: { alignSelf: 'flex-start', borderRadius: 20, overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 7, fontSize: 11, fontWeight: '800', marginTop: spacing.md },
  verified: { color: colors.green, backgroundColor: colors.paleGreen },
  unverified: { color: colors.warningText, backgroundColor: colors.warningBackground },
  map: { height: 210, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: 'hidden', marginTop: spacing.lg },
  mapCaption: { padding: 12, gap: spacing.sm, borderWidth: 1, borderTopWidth: 0, borderColor: colors.line, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg, backgroundColor: colors.surface },
  mapCaptionText: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mapAddress: { flex: 1, color: colors.muted, fontSize: 11 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: spacing.md, marginTop: spacing.md },
  factLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 5 },
  factValue: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  source: { color: colors.muted, fontSize: 11, marginTop: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: spacing.md },
  distinction: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.paleGreen, marginTop: spacing.md },
  distinctionText: { flex: 1, color: colors.darkGreen, fontSize: 12, lineHeight: 18 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: spacing.xl, marginBottom: spacing.sm },
  review: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, marginBottom: spacing.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  reviewAuthor: { color: colors.ink, fontWeight: '800', fontSize: 13 },
  stars: { color: colors.amber, letterSpacing: 1 },
  reviewComment: { color: colors.muted, lineHeight: 19, marginTop: spacing.sm, fontSize: 13 },
  reviewMeta: { color: '#8b9d93', marginTop: spacing.sm, fontSize: 10 },
  empty: { color: colors.muted, paddingVertical: spacing.md },
  form: { marginTop: spacing.sm },
  formHint: { color: colors.muted, fontSize: 12, marginBottom: spacing.md },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#dfe9df', borderRadius: radius.md, paddingHorizontal: spacing.md, backgroundColor: colors.surface, color: colors.ink, marginBottom: spacing.md },
  multiline: { minHeight: 110, paddingTop: 13, textAlignVertical: 'top' },
  starPicker: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
});
