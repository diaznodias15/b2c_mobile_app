import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import AppTabs from '@/components/app-tabs';
import { Providers, bootstrapConfig } from '@/components/Providers';
import { useConfigStore } from '@/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const appConfig = useConfigStore((s) => s.appConfig);
  const isLoading = useConfigStore((s) => s.isLoading);

  useEffect(() => {
    if (!appConfig && !isLoading) {
      void bootstrapConfig();
    }
  }, [appConfig, isLoading]);

  useEffect(() => {
    if (appConfig) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appConfig]);

  return (
    <Providers>
      <AppTabs />
    </Providers>
  );
}
