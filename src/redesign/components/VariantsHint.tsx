import type { ThemeColors } from '@/theme/colors';
import { variantsHintText } from '@/utils/variants';

import { Txt } from '../ui/Txt';

/**
 * Indicador de que el producto tiene otras variantes (talla, color…). Es solo informativo: tocar
 * la card abre el detalle de ESE producto, donde están los selectores. Precio, stock e imagen de
 * la card siguen siendo los del producto mostrado.
 */
export function VariantsHint({ count, colors }: { count: number | undefined; colors: ThemeColors }) {
  const text = variantsHintText(count);
  if (!text) return null;
  return (
    <Txt variant="caption" color="primary" colors={colors} numberOfLines={1} style={{ fontWeight: '700' }}>
      {text}
    </Txt>
  );
}
