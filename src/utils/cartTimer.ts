/**
 * Timer de reserva del carrito (`CartTimer` de la web, doc 09 §3).
 *
 * Es SOLO visual/UX del cliente: la liberación real del stock depende del
 * backend (no está confirmado que reserve y libere). Se calcula siempre por
 * **timestamp** (`deadline`) y no contando ticks, para no desfasarse cuando la
 * app pasa a segundo plano (los `setInterval` se suspenden).
 */

/** Por debajo de este umbral el timer pasa a modo advertencia (color de peligro). */
export const CART_TIMER_WARNING_SECONDS = 60;

/** Segundos que faltan para `deadline` (ms epoch), sin bajar de 0. */
export function getRemainingSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

/** `mm:ss` con ceros a la izquierda: 420 → "07:00", 65 → "01:05". */
export function formatMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function isTimerWarning(remainingSeconds: number): boolean {
  return remainingSeconds <= CART_TIMER_WARNING_SECONDS;
}

/** Fracción (0–1) de tiempo restante, para la barra de progreso. */
export function getTimerProgress(remainingSeconds: number, totalSeconds: number): number {
  if (totalSeconds <= 0) return 0;
  return Math.min(1, Math.max(0, remainingSeconds / totalSeconds));
}
