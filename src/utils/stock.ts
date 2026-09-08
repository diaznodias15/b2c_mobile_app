import type { ThemeColors } from '@/theme/colors';
import type { StockLevel } from '@/types/whitelabel';

/** Metadata visual compartida por cualquier UI que muestre `availability_indicator`. */
export const STOCK_META: Record<
  StockLevel,
  { label: string; colorKey: keyof ThemeColors }
> = {
  2: { label: 'En stock', colorKey: 'success' },
  1: { label: 'Pocas unidades', colorKey: 'warning' },
  0: { label: 'Sin stock', colorKey: 'danger' },
};
