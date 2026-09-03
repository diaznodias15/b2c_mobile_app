import { useMemo } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeroUINativeProvider } from 'heroui-native';

import { AppShell } from '@/components/AppShell';

export default function RootLayout() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
    []
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <HeroUINativeProvider
            config={{
              textProps: {
                allowFontScaling: true,
                maxFontSizeMultiplier: 1.4,
              },
            }}
          >
            <View className="flex-1 bg-background">
              <AppShell>
                <Stack screenOptions={{ headerShown: false }} />
              </AppShell>
            </View>
          </HeroUINativeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
