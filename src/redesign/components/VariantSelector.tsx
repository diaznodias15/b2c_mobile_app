import { Pressable, View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';
import { getValueState, type FamilyAxis, type FamilyAxisValue, type ProductFamily } from '@/utils/variants';

import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';

/** Lado del círculo de color; con `hitSlop` el área táctil llega a 48. */
const SWATCH = 40;

/**
 * Un selector por eje de la ficha (talla, color…). Tocar un valor navega a la variante que lo
 * tiene conservando los demás ejes (`onSelect` recibe su `tx_slug`; ver `resolveVariantSelection`).
 * Un valor sin ninguna combinación con página se muestra deshabilitado; uno sin stock en la sede,
 * tachado (se puede elegir para ver su página). Ninguno depende solo del color: el seleccionado
 * lleva borde grueso y `accessibilityState.selected`, el tachado se anuncia "sin stock".
 */
export function VariantSelector({
  family,
  colors,
  onSelect,
}: {
  family: ProductFamily;
  colors: ThemeColors;
  onSelect: (slug: string) => void;
}) {
  return (
    <View style={{ gap: 14 }}>
      {family.axes.map((axis) => {
        const selectedValue = axis.values.find((v) => getValueState(family, axis.attribute_id, v.value_id).isSelected);
        return (
          <View key={axis.attribute_id} style={{ gap: 8 }}>
            <Txt variant="label" colors={colors}>
              {axis.nb_attribute}
              {selectedValue ? (
                <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '500' }}>
                  {`: ${selectedValue.tx_value}`}
                </Txt>
              ) : null}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {axis.values.map((value) => (
                <Option
                  key={value.value_id}
                  axis={axis}
                  value={value}
                  family={family}
                  colors={colors}
                  onSelect={onSelect}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Option({
  axis,
  value,
  family,
  colors,
  onSelect,
}: {
  axis: FamilyAxis;
  value: FamilyAxisValue;
  family: ProductFamily;
  colors: ThemeColors;
  onSelect: (slug: string) => void;
}) {
  const { isSelected, isDisabled, isUnavailable, target } = getValueState(family, axis.attribute_id, value.value_id);
  const isColor = axis.tx_type?.toUpperCase() === 'COLOR' && !!value.tx_hex;
  const disabled = isDisabled || !target?.tx_slug;

  const handlePress = () => {
    if (!isSelected && target?.tx_slug) onSelect(target.tx_slug);
  };

  const label = `${axis.nb_attribute} ${value.tx_value}${isUnavailable ? ', sin stock' : ''}${
    disabled ? ', no disponible' : ''
  }`;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      hitSlop={isColor ? 4 : { top: 2, bottom: 2 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected, disabled }}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : pressed ? 0.8 : 1 })}
    >
      {isColor ? (
        <View
          style={{
            width: SWATCH + 6,
            height: SWATCH + 6,
            borderRadius: (SWATCH + 6) / 2,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? colors.primary : colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: SWATCH - 6, height: SWATCH - 6, borderRadius: (SWATCH - 6) / 2, backgroundColor: value.tx_hex as string }}>
            {isUnavailable ? <Slash color={colors.foreground} size={SWATCH - 6} /> : null}
          </View>
        </View>
      ) : (
        <View
          style={{
            minWidth: MIN_TOUCH,
            height: 44,
            paddingHorizontal: 14,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? colors.primary : colors.border,
            backgroundColor: isSelected ? colors.primaryOverlay : colors.productCard,
          }}
        >
          <Txt
            variant="label"
            color={isSelected ? 'primary' : 'foreground'}
            colors={colors}
            style={isUnavailable ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined}
          >
            {value.tx_value}
          </Txt>
        </View>
      )}
    </Pressable>
  );
}

/** Raya diagonal sobre el color sin stock. */
function Slash({ color, size }: { color: string; size: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: size / 2 - 1,
        left: -2,
        width: size + 4,
        height: 2,
        backgroundColor: color,
        transform: [{ rotate: '-45deg' }],
      }}
    />
  );
}
