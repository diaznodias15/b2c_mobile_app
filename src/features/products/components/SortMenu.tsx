import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { ArrowUpDown, Check, X } from 'lucide-react-native';

import type { SortOption } from '@/features/products/utils/adapters';

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'name-asc', label: 'Nombre A-Z' },
  { value: 'name-desc', label: 'Nombre Z-A' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
];

type Props = {
  value: SortOption;
  onChange: (v: SortOption) => void;
};

/**
 * Botón compacto "Ordenar" que abre un modal con las opciones.
 * Mobile-first: bottom sheet estilizado pero usando RN Modal.
 */
export function SortMenu({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-1.5 bg-backgroundElement rounded-full px-3 py-1.5"
        accessibilityRole="button"
        accessibilityLabel="Ordenar productos"
      >
        <ArrowUpDown size={14} color="#1A1A2E" />
        <Text className="text-xs font-medium text-foreground">
          {current?.label ?? 'Ordenar'}
        </Text>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-background rounded-t-[14px] pt-2 pb-8"
          >
            <View className="px-4 py-3 flex-row items-center justify-between border-b border-backgroundElement">
              <Text className="text-base font-bold text-foreground">
                Ordenar por
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={8}
                className="h-8 w-8 items-center justify-center rounded-full bg-backgroundElement"
                accessibilityLabel="Cerrar"
              >
                <X size={16} color="#1A1A2E" />
              </Pressable>
            </View>
            {OPTIONS.map((opt) => {
              const active = opt.value === value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="px-4 py-3 flex-row items-center justify-between"
                  accessibilityRole="button"
                  accessibilityLabel={`Ordenar por ${opt.label}`}
                >
                  <Text
                    className={
                      active
                        ? 'text-sm font-bold text-primary'
                        : 'text-sm text-foreground'
                    }
                  >
                    {opt.label}
                  </Text>
                  {active ? <Check size={16} color="#0f766e" /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
