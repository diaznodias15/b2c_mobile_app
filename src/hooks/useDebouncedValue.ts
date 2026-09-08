import { useEffect, useState } from 'react';

/**
 * Devuelve `value`, pero actualizado recién `delayMs` después del último
 * cambio — el patrón estándar para no pegarle a un endpoint de búsqueda
 * en cada tecla. Si `value` cambia antes de que venza el delay, reinicia
 * el timer (debounce, no throttle).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
