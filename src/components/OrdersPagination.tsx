import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

/**
 * Paginación simple prev/next (MY-ORDERS-MODULE.md §12.3/22 recomienda
 * justamente esto para mobile — sin números de página ni siblings,
 * eso es solo para desktop).
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <ArrowButton
        icon={ChevronLeft}
        disabled={!canPrev}
        onPress={() => onChange(page - 1)}
        colors={colors}
        label="Página anterior"
      />
      <Text style={{ fontSize: 12, color: colors.muted, minWidth: 64, textAlign: 'center' }}>
        {page} de {lastPage}
      </Text>
      <ArrowButton
        icon={ChevronRight}
        disabled={!canNext}
        onPress={() => onChange(page + 1)}
        colors={colors}
        label="Página siguiente"
      />
    </View>
  );
}

function ArrowButton({
  icon: Icon,
  disabled,
  onPress,
  colors,
  label,
}: {
  icon: typeof ChevronLeft;
  disabled: boolean;
  onPress: () => void;
  colors: ThemeColors;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.section,
        opacity: disabled ? 0.4 : 1,
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
    >
      <Icon size={16} color={colors.foreground} />
    </Pressable>
  );
}
