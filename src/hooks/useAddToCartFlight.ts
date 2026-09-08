import { useRef, useState } from 'react';
import type { ImageSourcePropType, View } from 'react-native';

import { useFlyingCartStore } from '@/store/flyingCart.store';

/** Duración de la animación "flying to cart" — el botón queda deshabilitado ese tiempo. */
const ADDING_FEEDBACK_MS = 650;

/**
 * Lógica compartida por los 3 lugares que agregan al carrito
 * (`ProductCard`, `ProductListItem`, `product/[slug].tsx`): medir la
 * imagen en pantalla, disparar `startFly` hacia el ícono del carrito, y
 * deshabilitar el botón mientras dura la animación (evita doble-tap).
 * Cada componente sigue dueño de su propio JSX/estilos — son layouts
 * genuinamente distintos (card vertical, fila horizontal, pantalla
 * completa) — pero ya no repiten esta lógica.
 */
export function useAddToCartFlight() {
  const imageRef = useRef<View>(null);
  const [isAdding, setIsAdding] = useState(false);

  /** Devuelve `false` (y no hace nada) si ya hay una animación en curso. */
  function trigger(source: ImageSourcePropType): boolean {
    if (isAdding) return false;
    setIsAdding(true);

    imageRef.current?.measureInWindow((x, y, width, height) => {
      useFlyingCartStore.getState().startFly(source, { x, y, width, height });
    });

    setTimeout(() => setIsAdding(false), ADDING_FEEDBACK_MS);
    return true;
  }

  return { imageRef, isAdding, trigger };
}
