import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, View } from 'react-native';
import { useRouter, usePathname, Redirect, Stack } from 'expo-router';

import { Providers, bootstrapConfig } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';
import AppTabs from '@/components/app-tabs';
import { useConfigStore, useUserStore } from '@/store';

SplashScreen.preventAutoHideAsync();

const PUBLIC_ROUTES = new Set([
  '/login',
  '/registrarse',
  '/recuperar-contrasena',
  '/terminos-y-condiciones',
  '/politicas-de-privacidad',
]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith('/cuenta/verificar-correo/')) return true;
  return false;
}

export default function RootLayout() {
  const appConfig = useConfigStore((s) => s.appConfig);
  const isLoading = useConfigStore((s) => s.isLoading);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const rehydrateAuth = useUserStore((s) => s.rehydrateAuth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!appConfig && !isLoading) {
      void bootstrapConfig();
    }
  }, [appConfig, isLoading]);

  useEffect(() => {
    void rehydrateAuth();
  }, [rehydrateAuth]);

  useEffect(() => {
    if (appConfig) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appConfig]);

  if (!appConfig) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  // Auth guard: redirect a /login si no está autenticado en ruta privada.
  if (isAuthenticated && isPublicRoute(pathname) && pathname !== '/terminos-y-condiciones' && pathname !== '/politicas-de-privacidad') {
    return <Redirect href="/" />;
  }

  return (
    <Providers>
      <AppShell>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          {/* Tabs: rutas del tab navigator. */}
          <Stack.Screen name="index" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="search" />
          <Stack.Screen name="cart" />
          <Stack.Screen name="profile" />

          {/* Auth: rutas públicas, presentadas como modales. */}
          <Stack.Screen
            name="login"
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="registrarse"
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="recuperar-contrasena"
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="terminos-y-condiciones"
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="cuenta/verificar-correo/[id]/[token]"
            options={{ presentation: 'modal' }}
          />
        </Stack>
      </AppShell>
    </Providers>
  );
}
