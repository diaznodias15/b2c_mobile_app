import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useCartTimerStore } from '@/store/cartTimer.store';
import { getRemainingSeconds } from '@/utils/cartTimer';

/**
 * Cuenta regresiva de reserva del carrito (ver `utils/cartTimer.ts`).
 *
 * - Solo corre si `enabled` (sesión + productos + `qty_cart_seconds > 0`).
 * - El `deadline` está en `useCartTimerStore`: sigue corriendo al pasar del
 *   carrito al checkout. Si al entrar ya venció (o no existe) arranca uno nuevo.
 * - Al llegar a 0 llama a `onExpire` y reinicia la cuenta (igual que la web).
 *   Cada pantalla decide qué hacer: el carrito se repone del servidor y el
 *   checkout vuelve al carrito.
 * - Se recalcula por timestamp y al volver de segundo plano (`AppState`): los
 *   intervalos se suspenden con la app en background y los ticks se desfasarían.
 */
export function useCartTimer({
  enabled,
  totalSeconds,
  onExpire,
}: {
  enabled: boolean;
  totalSeconds: number;
  onExpire: () => void;
}): number {
  const deadline = useCartTimerStore((s) => s.deadline);
  const [remaining, setRemaining] = useState(totalSeconds);

  // `onExpire` cambia de identidad en cada render: se guarda en una ref para no
  // reiniciar el intervalo cada vez.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Asegura que haya una cuenta vigente al activarse.
  useEffect(() => {
    if (!enabled) return;
    const { deadline: current, start } = useCartTimerStore.getState();
    if (current === null || current <= Date.now()) start(totalSeconds);
  }, [enabled, totalSeconds]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      // Se lee del store (no de la closure): el efecto anterior pudo haber
      // arrancado una cuenta nueva en este mismo commit.
      const current = useCartTimerStore.getState().deadline;
      if (current === null) return;
      const left = getRemainingSeconds(current, Date.now());
      setRemaining(left);
      if (left <= 0) {
        onExpireRef.current();
        useCartTimerStore.getState().start(totalSeconds);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [enabled, deadline, totalSeconds]);

  return remaining;
}
