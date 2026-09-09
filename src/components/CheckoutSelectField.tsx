import { useState } from 'react';
import { Modal, Pressable, Text } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';

import { CheckoutField, checkoutInputStyle } from '@/components/CheckoutPrimitives';
import type { ThemeColors } from '@/theme/colors';

export type SelectOption = { value: string; label: string };

/**
 * Select con modal de lista — mismo patrón que el selector de tipo de
 * documento en `register.tsx` (pedido explícito del usuario en esa
 * pantalla, reutilizado acá para "Banco de origen"). Evita agregar un
 * picker nativo nuevo solo para el checkout.
 */
export function CheckoutSelectField({
  label,
  placeholder,
  value,
  options,
  onChange,
  colors,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  colors: ThemeColors;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <CheckoutField label={label} colors={colors}>
      <Pressable
        onPress={() => setIsOpen(true)}
        style={[
          checkoutInputStyle(colors),
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text
          style={{ fontSize: 15, color: selected ? colors.foreground : colors.muted, flex: 1 }}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={16} color={colors.muted} />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 32 }}
          onPress={() => setIsOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              paddingVertical: 8,
              maxHeight: '70%',
            }}
            onPress={() => {}}
          >
            {options.length === 0 ? (
              <Text style={{ padding: 18, fontSize: 14, color: colors.muted, textAlign: 'center' }}>
                No hay opciones disponibles.
              </Text>
            ) : (
              options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    paddingHorizontal: 18,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.foreground,
                      fontWeight: value === option.value ? '700' : '400',
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                  {value === option.value && <Check size={18} color={colors.primary} />}
                </Pressable>
              ))
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </CheckoutField>
  );
}
