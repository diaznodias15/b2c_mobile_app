import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * `true` si la persona pidió "reducir movimiento" en el sistema. Se lee al montar y se mantiene al
 * día si cambia mientras la app está abierta. Mientras no se sepa, asume `false` (animaciones
 * normales) para no dejar la interfaz sin movimiento por un fallo de la API de accesibilidad.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduce(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduce;
}
