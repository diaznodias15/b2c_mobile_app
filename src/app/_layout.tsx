import { useEffect } from 'react';
import { Stack } from 'expo-router';

import { Providers, bootstrapConfig } from '@/components/Providers';

export default function RootLayout() {
  useEffect(() => {
    void bootstrapConfig();
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
      </Stack>
    </Providers>
  );
}
