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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  /**
   * Agrega esperando la respuesta: `isSubmitting` (loader en el botón) dura lo que
   * tarde `action`, y solo si el servidor la aceptó (`true`) se dispara la
   * animación hacia el carrito. Con sesión el carrito espera a la API antes de
   * cambiar nada (ver `cart.store`); sin sesión resuelve al instante.
   * Si ya hay un intento en curso o la animación anterior no terminó, no hace nada.
   */
  async function addWithFlight(
    source: ImageSourcePropType,
    action: () => Promise<boolean> | boolean
  ): Promise<void> {
    if (isAdding || isSubmitting) return;
    setIsSubmitting(true);
    let ok = false;
    try {
      ok = await action();
    } finally {
      setIsSubmitting(false);
    }
    if (ok) trigger(source);
  }

  return { imageRef, isAdding, isSubmitting, trigger, addWithFlight };
}
