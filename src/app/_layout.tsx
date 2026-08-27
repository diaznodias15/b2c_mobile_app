import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { usePathname, Redirect, Stack } from 'expo-router';

import { Providers, bootstrapConfig } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';
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
  const isError = useConfigStore((s) => s.isError);
  const errorInfo = useConfigStore((s) => s.errorInfo);
  const setLoading = useConfigStore((s) => s.setLoading);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const rehydrateAuth = useUserStore((s) => s.rehydrateAuth);
  const pathname = usePathname();

  useEffect(() => {
    if (!appConfig && !isLoading && !isError) {
      void bootstrapConfig();
    }
  }, [appConfig, isLoading, isError]);

  useEffect(() => {
    void rehydrateAuth();
  }, [rehydrateAuth]);

  useEffect(() => {
    if (appConfig) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appConfig]);

  if (!appConfig) {
    if (isError) {
      return (
        <View className="flex-1 items-center justify-center bg-background px-8 gap-4">
          <Text className="text-2xl font-bold text-foreground text-center">
            No pudimos conectar
          </Text>
          <Text className="text-sm text-muted text-center">
            {errorInfo ?? 'Verificá tu conexión e intentá de nuevo.'}
          </Text>
          <Pressable
            onPress={() => {
              setLoading(false);
              void bootstrapConfig();
            }}
            className="h-12 px-6 items-center justify-center rounded-[14px] bg-primary"
          >
            <Text className="text-base font-semibold text-primary-foreground">
              Reintentar
            </Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (
    isAuthenticated &&
    isPublicRoute(pathname) &&
    pathname !== '/terminos-y-condiciones' &&
    pathname !== '/politicas-de-privacidad'
  ) {
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
          <Stack.Screen name="index" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="search" />
          <Stack.Screen name="cart" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="login" options={{ presentation: 'modal' }} />
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
