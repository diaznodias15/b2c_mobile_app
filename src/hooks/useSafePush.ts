import { useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';

import { canNavigate } from '@/utils/navigation';

/**
 * `router.push` protegido contra doble toque (ver `utils/navigation.ts`).
 * Usarlo en lugar de `router.push` en cualquier botón/fila que abra una
 * pantalla del stack.
 */
export function useSafePush() {
  const router = useRouter();
  return useCallback(
    (href: Href) => {
      if (canNavigate()) router.push(href);
    },
    [router]
  );
}
