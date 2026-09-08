import { useEffect } from 'react';
import { Stack } from 'expo-router';

import { Providers, bootstrapConfig } from '@/components/Providers';
import { useUserStore } from '@/store/user.store';

export default function RootLayout() {
  useEffect(() => {
    void bootstrapConfig();
    // Si el token de SecureStore ya no existe (limpiado por fuera, o
    // nunca se guardó bien), corrige el `isAuthenticated: true` que
    // haya quedado persistido en Zustand — sin esto, la UI podría
    // mostrar al usuario como logueado sin tener token real.
    void useUserStore.getState().rehydrateAuth();
  }, []);

  return (
    <Providers>
      {/*
        animation: 'none' es el default (fix del artefacto de slide al
        cambiar de tab, ver AGENTS.md) — pero product/[slug] SÍ necesita
        una animación real: sin ella no hay nada que interpolar y el
        swipe-back de iOS queda roto (no se puede "arrastrar" una
        transición que no existe). Android no depende de esto — el botón
        / gesto de back del sistema hace pop del stack solo, siempre que
        se navegue con router.push (no router.replace).
      */}
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen
          name="product/[slug]"
          options={{ animation: 'slide_from_right', gestureEnabled: true, gestureDirection: 'horizontal' }}
        />
        <Stack.Screen
          name="login"
          options={{ animation: 'slide_from_right', gestureEnabled: true, gestureDirection: 'horizontal' }}
        />
        <Stack.Screen
          name="register"
          options={{ animation: 'slide_from_right', gestureEnabled: true, gestureDirection: 'horizontal' }}
        />
      </Stack>
    </Providers>
  );
}
