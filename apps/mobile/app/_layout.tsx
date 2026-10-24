import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ReportDraftProvider } from '@/features/reports/report-draft-context';
import { colors } from '@/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ReportDraftProvider>
          <SafeAreaView edges={['top']} style={styles.safeArea}>
            <StatusBar style="dark" />
            <View style={styles.content}>
              <Stack
                screenOptions={({ navigation }) => ({
                  headerStyle: { backgroundColor: colors.surface },
                  headerTintColor: colors.ink,
                  headerTitleStyle: { fontWeight: '700' },
                  headerShadowVisible: false,
                  headerBackVisible: false,
                  headerLeft: () =>
                    navigation.canGoBack() ? (
                      <Pressable accessibilityLabel="Quay lại" hitSlop={8} onPress={() => navigation.goBack()} style={styles.headerBack}>
                        <Ionicons color={colors.darkGreen} name="chevron-back" size={28} />
                      </Pressable>
                    ) : null,
                  contentStyle: { backgroundColor: colors.background },
                })}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="police/[id]" options={{ title: 'Trụ sở công an' }} />
                <Stack.Screen name="place/[id]" options={{ title: 'Thông tin cơ sở' }} />
                <Stack.Screen name="report/type" options={{ title: 'Báo sự cố' }} />
                <Stack.Screen name="report/location" options={{ title: 'Xác nhận vị trí' }} />
                <Stack.Screen name="report/details" options={{ title: 'Chi tiết sự cố' }} />
                <Stack.Screen name="report/result" options={{ headerShown: false }} />
                <Stack.Screen name="report/[id]" options={{ title: 'Theo dõi tin báo' }} />
              </Stack>
            </View>
          </SafeAreaView>
        </ReportDraftProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  headerBack: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  content: { flex: 1, backgroundColor: colors.background },
});
