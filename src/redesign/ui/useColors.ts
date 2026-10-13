import { useThemeColors } from '@/store/config.store';
import type { ThemeColors } from '@/theme/colors';

/**
 * Colores del whitelabel para las primitivas del rediseño. Un `override` permite
 * que un componente que ya recibe `colors` por prop (contrato de los originales)
 * se los pase a las primitivas sin leer el store dos veces con valores distintos.
 */
export function useColors(override?: ThemeColors): ThemeColors {
  const fromStore = useThemeColors();
  return override ?? fromStore;
}
