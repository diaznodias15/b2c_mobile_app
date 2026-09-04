import { useEffect } from 'react';
import { Stack } from 'expo-router';

import { Providers, bootstrapConfig } from '@/components/Providers';

export default function RootLayout() {
  useEffect(() => {
    void bootstrapConfig();
  }, []);

  return (
    <Providers>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
    </Providers>
  );
}
