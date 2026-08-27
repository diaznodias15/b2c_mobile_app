import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { MapPin, ChevronDown } from 'lucide-react-native';

import { useBranchStore } from '@/store';
import { ModalBranches } from './ModalBranches';

/**
 * Botón compacto que muestra la sede activa y abre el
 * `ModalBranches` al tocarlo.
 *
 * Se monta en el header del Home. Si el usuario no tiene sede
 * (caso raro, debería auto-pickearse en boot), muestra el CTA
 * "Selecciona tu sede".
 */
export function BranchSelector() {
  const selectedBranch = useBranchStore((s) => s.selectedBranch);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={8}
        className="flex-row items-center gap-1"
        accessibilityRole="button"
        accessibilityLabel="Cambiar sede"
      >
        <MapPin size={12} color="#0f766e" />
        <Text
          className="text-xs font-medium text-primary"
          numberOfLines={1}
        >
          {selectedBranch?.tx_alias ||
            selectedBranch?.label ||
            'Selecciona tu sede'}
        </Text>
        <ChevronDown size={12} color="#0f766e" />
      </Pressable>
      <ModalBranches visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
