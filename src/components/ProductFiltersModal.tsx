import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, FilterX, X } from 'lucide-react-native';

import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import type { ThemeColors } from '@/theme/colors';
import { formatDisplayPrice } from '@/utils/currency';
import {
  bsToPriceInput,
  clearPrice,
  hasActiveFilters,
  hasPriceFilter,
  priceInputToBs,
  selectCategory,
  selectSubcategory,
  setPriceRange,
  validatePriceRange,
  type FilterCategory,
  type ProductFilters,
} from '@/utils/productFilters';

/**
 * Filtros del listado por departamento, en un `Modal` de pantalla completa
 * (mismo patrón que `BranchSelectorModal`/`ModalOrderDetail`).
 *
 * Categoría/subcategoría se aplican al tocarlas; el precio, con "Aplicar"
 * (dos campos numéricos, sin slider: no hay librería de rango en el proyecto
 * y agregarla exigiría rebuild nativo). Los campos están en la moneda elegida
 * en "Ver más" y se convierten a Bs. al aplicar, porque la query va en Bs.
 */
export function ProductFiltersModal({
  visible,
  onClose,
  colors,
  categories,
  filters,
  onChange,
  priceRange,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
  categories: FilterCategory[];
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
  /** Rango (en Bs.) del conjunto sin filtro de precio; `null` si no hay rango útil. */
  priceRange: { min: number; max: number } | null;
}) {
  const insets = useSafeAreaInsets();
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');
  const [priceError, setPriceError] = useState<string | null>(null);

  // Al abrir, los campos reflejan el filtro vigente. Se hace en `onShow` y no en
  // un efecto para no pisar lo que el usuario está tipeando.
  const syncFields = () => {
    setMinText(bsToPriceInput(filters.minPrice, displayCurrency, exchangeRate));
    setMaxText(bsToPriceInput(filters.maxPrice, displayCurrency, exchangeRate));
    setPriceError(null);
  };

  const applyPrice = () => {
    const min = priceInputToBs(minText, displayCurrency, exchangeRate);
    const max = priceInputToBs(maxText, displayCurrency, exchangeRate);
    if (min == null && max == null) {
      setPriceError(
        minText.trim() || maxText.trim() ? 'Escribe montos válidos.' : 'Escribe un mínimo o un máximo.'
      );
      return;
    }
    const error = validatePriceRange(min, max);
    if (error) {
      setPriceError(error);
      return;
    }
    setPriceError(null);
    onChange(setPriceRange(filters, min, max));
  };

  const removePrice = () => {
    setMinText('');
    setMaxText('');
    setPriceError(null);
    onChange(clearPrice(filters));
  };

  const clearAll = () => {
    setMinText('');
    setMaxText('');
    setPriceError(null);
    onChange({});
  };

  const currencyLabel = displayCurrency === 'REF' ? 'REF' : 'Bs.';
  const rangeHint = priceRange
    ? `${formatDisplayPrice(priceRange.min, exchangeRate, displayCurrency)} – ${formatDisplayPrice(
        priceRange.max,
        exchangeRate,
        displayCurrency
      )}`
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={syncFields}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            paddingTop: insets.top + 12,
            paddingHorizontal: 24,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.foreground }}>Filtros</Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar filtros"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.section,
            }}
          >
            <X size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <KeyboardAwareScrollView
          bottomOffset={24}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 20 }}
        >
          {hasActiveFilters(filters) && (
            <Pressable
              onPress={clearAll}
              accessibilityRole="button"
              accessibilityLabel="Limpiar filtros"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
                gap: 8,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 999,
                backgroundColor: colors.section,
              }}
            >
              <FilterX size={16} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                Limpiar filtros
              </Text>
            </Pressable>
          )}

          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 8 }}>
              Categorías
            </Text>
            {categories.length === 0 ? (
              <Text style={{ fontSize: 14, color: colors.muted }}>No hay categorías disponibles.</Text>
            ) : (
              <View style={{ gap: 4 }}>
                {categories.map((category) => (
                  <View key={category.tx_slug}>
                    <OptionRow
                      label={category.nb_category ?? category.tx_slug ?? ''}
                      selected={filters.category === category.tx_slug}
                      bold
                      colors={colors}
                      onPress={() => onChange(selectCategory(category.tx_slug as string))}
                    />
                    {category.subcategories.map((sub) => (
                      <OptionRow
                        key={sub.tx_slug}
                        label={sub.nb_subcategory ?? sub.tx_slug ?? ''}
                        selected={filters.subcategory === sub.tx_slug}
                        indent
                        colors={colors}
                        onPress={() => onChange(selectSubcategory(sub.tx_slug as string))}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 4 }}>
              Precio ({currencyLabel})
            </Text>
            {rangeHint && (
              <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 10 }}>
                Entre {rangeHint}
              </Text>
            )}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <PriceField
                label="Mínimo"
                value={minText}
                onChangeText={setMinText}
                colors={colors}
              />
              <PriceField
                label="Máximo"
                value={maxText}
                onChangeText={setMaxText}
                colors={colors}
              />
            </View>
            {priceError && (
              <Text style={{ fontSize: 13, color: colors.danger, marginTop: 8 }}>{priceError}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              {hasPriceFilter(filters) && (
                <Pressable
                  onPress={removePrice}
                  accessibilityRole="button"
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.section,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                    Quitar precio
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={applyPrice}
                accessibilityRole="button"
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.onPrimary }}>
                  Aplicar precio
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAwareScrollView>

        <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 8 }}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={{
              height: 50,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.onPrimary }}>Ver productos</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
  colors,
  bold,
  indent,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ThemeColors;
  bold?: boolean;
  indent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingLeft: indent ? 24 : 0,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected && <Check size={14} color={colors.onPrimary} strokeWidth={3} />}
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: bold ? '700' : '400',
          color: colors.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PriceField({
  label,
  value,
  onChangeText,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  colors: ThemeColors;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        style={{
          height: 46,
          borderRadius: 12,
          paddingHorizontal: 12,
          fontSize: 15,
          color: colors.foreground,
          backgroundColor: colors.section,
        }}
      />
    </View>
  );
}

