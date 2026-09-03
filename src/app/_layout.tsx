import { Stack } from 'expo-router';

import { Providers } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';

/**
 * Root layout minimal. Solo monta Providers + AppShell + un Stack
 * con las screens basicas. Sin bootstrap, sin auth, sin redirects.
 *
 * Para volver a sumar features (auth, cart, configuracion del whitelabel),
 * hacerlo incrementalmente y validar en cada paso.
 */
export default function RootLayout() {
  return (
    <Providers>
      <AppShell>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="search" />
          <Stack.Screen name="profile" />
        </Stack>
      </AppShell>
    </Providers>
  );
}
