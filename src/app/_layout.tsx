import { useEffect } from 'react';
import { Stack } from 'expo-router';

import { onUnauthorized } from '@/api/axiosRequest';
import { Providers, bootstrapConfig } from '@/components/Providers';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';

export default function RootLayout() {
  useEffect(() => {
    void bootstrapConfig();
    // Si el token de SecureStore ya no existe (limpiado por fuera, o
    // nunca se guardó bien), corrige el `isAuthenticated: true` que
    // haya quedado persistido en Zustand — sin esto, la UI podría
    // mostrar al usuario como logueado sin tener token real.
    void useUserStore.getState().rehydrateAuth();

    // Un 401 de CUALQUIER endpoint significa token inválido/expirado —
    // `axiosRequest` ya lo detecta pero nadie escuchaba `onUnauthorized`
    // (quedó definido pero sin suscriptor). Sin esto, la app seguía
    // "logueada" en el store mientras cada request fallaba en silencio
    // (ver los `console.warn` de `cart.store`). El guard de
    // `isAuthenticated` evita desloguear/mostrar el toast más de una vez
    // si varios requests en paralelo devuelven 401 al mismo tiempo.
    const unsubscribeUnauthorized = onUnauthorized(() => {
      if (!useUserStore.getState().isAuthenticated) return;
      void useUserStore.getState().signOut();
      useToastStore.getState().show('Tu sesión expiró. Iniciá sesión de nuevo.');
    });
    return unsubscribeUnauthorized;
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
        <Stack.Screen
          name="orders"
          options={{ animation: 'slide_from_right', gestureEnabled: true, gestureDirection: 'horizontal' }}
        />
        <Stack.Screen
          name="checkout"
          options={{ animation: 'slide_from_right', gestureEnabled: true, gestureDirection: 'horizontal' }}
        />
      </Stack>
    </Providers>
  );
}
