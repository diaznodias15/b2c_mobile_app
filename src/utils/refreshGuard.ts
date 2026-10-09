/**
 * Guardia del pull-to-refresh.
 *
 * `axiosRequest` rechaza con `DUPLICATE_REQUEST` cualquier GET idéntico lanzado
 * dentro de los 5 s siguientes a otro ya completado. Un segundo refresh pegado
 * al primero repetía `config/get` y todas las consultas invalidadas, chocaba
 * con esa ventana y terminaba en errores. El refresh no puede arrancar mientras
 * haya otro en curso ni antes de que pase la ventana desde que terminó el
 * último (la ventana cuenta desde que cada GET completó, y el refresh termina
 * después de todos sus GET, así que este margen es suficiente).
 */
export const REFRESH_COOLDOWN_MS = 5_000;

export function canStartRefresh(input: {
  now: number;
  inFlight: boolean;
  /** Cuándo terminó el último refresh (ms epoch); `0` si nunca hubo uno. */
  lastEndedAt: number;
  cooldownMs?: number;
}): boolean {
  const { now, inFlight, lastEndedAt, cooldownMs = REFRESH_COOLDOWN_MS } = input;
  return !inFlight && now - lastEndedAt >= cooldownMs;
}
