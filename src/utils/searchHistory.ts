/** Cuántas búsquedas recientes se recuerdan. */
export const MAX_SEARCH_HISTORY = 6;

/** Mínimo de letras para que una búsqueda valga la pena guardarla (igual que para buscar). */
export const MIN_HISTORY_LENGTH = 3;

/**
 * Agrega `query` al inicio del historial: la recorta, ignora las muy cortas, no repite (sin
 * distinguir mayúsculas: la búsqueda más reciente sube al primer lugar con su escritura nueva) y
 * se queda con las `MAX_SEARCH_HISTORY` más recientes. Devuelve una lista nueva (nunca muta).
 */
export function addToSearchHistory(history: readonly string[], query: string): string[] {
  const clean = query.trim().replace(/\s+/g, ' ');
  if (clean.length < MIN_HISTORY_LENGTH) return [...history];
  const rest = history.filter((item) => item.toLowerCase() !== clean.toLowerCase());
  return [clean, ...rest].slice(0, MAX_SEARCH_HISTORY);
}

/** Quita una búsqueda del historial (sin distinguir mayúsculas). */
export function removeFromSearchHistory(history: readonly string[], query: string): string[] {
  return history.filter((item) => item.toLowerCase() !== query.trim().toLowerCase());
}
