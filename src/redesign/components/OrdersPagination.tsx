import { View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

import { Button } from '../ui/Button';
import { Txt } from '../ui/Txt';

/**
 * Paginación anterior/siguiente. **Mismo contrato que `@/components/OrdersPagination`**
 * (`page`, `lastPage`, `isLoading`, `onChange`, `colors`).
 *
 * Qué cambia: botones de texto de 48 dp ("Anterior" / "Siguiente") en lugar de dos flechas de
 * 32 px, con "Página X de Y" legible (14 px) entre ambos.
 */
export function OrdersPagination({
  page,
  lastPage,
  isLoading,
  onChange,
  colors,
}: {
  page: number;
  lastPage: number;
  isLoading: boolean;
  onChange: (page: number) => void;
  colors: ThemeColors;
}) {
  const canPrev = page > 1 && !isLoading;
  const canNext = page < lastPage && !isLoading;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1 }}>
        <Button
          label="Anterior"
          variant="ghost"
          icon={ChevronLeft}
          disabled={!canPrev}
          onPress={() => onChange(page - 1)}
          colors={colors}
        />
      </View>
      <Txt variant="label" color="muted" colors={colors} style={{ minWidth: 88, textAlign: 'center' }}>
        {page} de {lastPage}
      </Txt>
      <View style={{ flex: 1 }}>
        <Button
          label="Siguiente"
          variant="ghost"
          disabled={!canNext}
          onPress={() => onChange(page + 1)}
          colors={colors}
        />
      </View>
    </View>
  );
}

