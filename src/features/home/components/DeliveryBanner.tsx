import { Text, View } from 'react-native';
import { ShieldCheck, MapPin } from 'lucide-react-native';

import { useBranchStore } from '@/store';
import { findBranchById } from '@/features/branches/utils/tree';

/**
 * Banner "Entrega segura" con info de la sede activa.
 * Si no hay sede seleccionada, muestra CTA genérico.
 */
export function DeliveryBanner() {
  const branchTree = useBranchStore((s) => s.branchTree);
  const selectedId = useBranchStore((s) => s.selectedBranch?.value);

  // Buscamos la ciudad/estado del branch para mostrarlo en el banner.
  // Si no hay match, mostramos copy genérico.
  const group = branchTree.find((g) =>
    g.items.some((it) => it.value === selectedId)
  );

  return (
    <View className="mt-6 mx-4 mb-4 rounded-[14px] bg-primary/5 border border-primary/20 p-4">
      <View className="flex-row items-center gap-2 mb-1">
        <ShieldCheck size={16} color="#0f766e" />
        <Text className="text-sm font-bold text-foreground">
          Entrega 100% segura
        </Text>
      </View>
      <View className="flex-row items-center gap-1">
        <MapPin size={12} color="#60646C" />
        <Text className="text-xs text-muted">
          {group
            ? `Despachamos desde ${group.nb_city}, ${group.nb_state}`
            : 'Selecciona tu sede para ver disponibilidad'}
        </Text>
      </View>
    </View>
  );
}

// Re-export para tests
export { findBranchById };
