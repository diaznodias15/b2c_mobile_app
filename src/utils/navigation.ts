/**
 * Guardia anti doble toque para navegación.
 *
 * `router.push` siempre apila una pantalla nueva: si el usuario toca varias
 * veces seguidas un producto (o cualquier botón que navega) antes de que
 * termine la animación, se abren N vistas iguales y hay que volver N veces.
 * El guardia deja pasar la primera navegación y descarta las siguientes
 * durante `lockMs`, que cubre la animación de entrada (`slide_from_right`).
 */
export function createNavigationGuard(lockMs: number, now: () => number = Date.now) {
  let lastAt = -Infinity;
  return function canNavigate(): boolean {
    const t = now();
    if (t - lastAt < lockMs) return false;
    lastAt = t;
    return true;
  };
}

/** Una sola instancia compartida: aplica a toda la app (no a un componente). */
export const NAVIGATION_LOCK_MS = 700;
export const canNavigate = createNavigationGuard(NAVIGATION_LOCK_MS);
