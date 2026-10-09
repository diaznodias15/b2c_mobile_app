import { useEffect, useState } from 'react';

/**
 * `true` cuando `active` lleva más de `delayMs` seguido (por defecto 12 s).
 * Sirve para dejar de mostrar un esqueleto mudo y ofrecer "Reintentar".
 *
 * `resetKey` reinicia la cuenta (se incrementa al reintentar: sin eso, tras
 * pulsar "Reintentar" seguiría marcando "tarda demasiado" desde el primer
 * intento). El `false` se pone en el cleanup del efecto, no en su cuerpo.
 */
export function useSlowLoading(active: boolean, resetKey = 0, delayMs = 12_000): boolean {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) return;
    const id = setTimeout(() => setSlow(true), delayMs);
    return () => {
      clearTimeout(id);
      setSlow(false);
    };
  }, [active, resetKey, delayMs]);

  return slow;
}
