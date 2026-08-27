import { useMemo } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import { X, MapPin, Phone, Clock, Check } from 'lucide-react-native';

import { useBranchStore } from '@/store';
import { findBranchById } from '@/features/branches/utils/tree';
import type { BranchGroup, BranchItem } from '@/types/whitelabel';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Modal para cambiar de sede.
 *
 * Estructura visual:
 *  1. Header con título "Elige tu sede" + botón cerrar
 *  2. Lista de ciudades agrupadas por estado
 *  3. Cada item muestra alias, dirección, horario y teléfono
 *  4. La sede activa lleva un check verde
 *
 * Tocar una sede la selecciona, cierra el modal y persiste
 * (Zustand + AsyncStorage).
 */
export function ModalBranches({ visible, onClose }: Props) {
  const branchTree = useBranchStore((s) => s.branchTree);
  const selectedBranch = useBranchStore((s) => s.selectedBranch);
  const setSelectedBranch = useBranchStore((s) => s.setSelectedBranch);

  // Aplanamos el árbol a items con metadata de agrupación,
  // para que la FlatList pueda renderizar section headers
  // (estado/ciudad) en una sola pasada.
  const flat = useMemo(
    () => buildFlatList(branchTree),
    [branchTree]
  );

  const handleSelect = (item: BranchItem) => {
    setSelectedBranch(item);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between border-b border-backgroundElement px-4 py-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">
              Elige tu sede
            </Text>
            <Text className="text-xs text-muted">
              La disponibilidad y los precios pueden variar según la sede
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            className="h-9 w-9 items-center justify-center rounded-full bg-backgroundElement"
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <X size={18} color="#1A1A2E" />
          </Pressable>
        </View>

        {branchTree.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-sm text-muted text-center">
              No hay sedes disponibles en este momento.
            </Text>
          </View>
        ) : (
          <FlatList
            data={flat}
            keyExtractor={keyExtractor}
            renderItem={renderItem({
              selectedId: selectedBranch?.value,
              onSelect: handleSelect,
            })}
            contentContainerStyle={{ paddingVertical: 12 }}
            ItemSeparatorComponent={Separator}
          />
        )}
      </View>
    </Modal>
  );
}

type FlatRow =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'item'; key: string; item: BranchItem };

function buildFlatList(tree: BranchGroup[]): FlatRow[] {
  const out: FlatRow[] = [];
  for (const group of tree) {
    out.push({
      kind: 'header',
      key: `h:${group.nb_state}|${group.nb_city}`,
      title: `${group.nb_city}, ${group.nb_state}`,
    });
    for (const item of group.items) {
      out.push({
        kind: 'item',
        key: `i:${item.value}`,
        item,
      });
    }
  }
  return out;
}

function keyExtractor(row: FlatRow): string {
  return row.key;
}

function Separator() {
  return <View className="h-px bg-backgroundElement mx-4" />;
}

function renderItem({
  selectedId,
  onSelect,
}: {
  selectedId?: number;
  onSelect: (b: BranchItem) => void;
}): ListRenderItem<FlatRow> {
  return ({ item }) => {
    if (item.kind === 'header') {
      return (
        <View className="px-4 pt-4 pb-2">
          <Text className="text-xs font-bold uppercase text-muted tracking-wider">
            {item.title}
          </Text>
        </View>
      );
    }
    const isActive = item.item.value === selectedId;
    return (
      <Pressable
        onPress={() => onSelect(item.item)}
        className={`px-4 py-3 ${isActive ? 'bg-primary/5' : ''}`}
        accessibilityRole="button"
        accessibilityLabel={`Seleccionar ${item.item.label}`}
      >
        <View className="flex-row items-start gap-3">
          <View className="mt-0.5">
            {isActive ? (
              <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
                <Check size={14} color="#FFFFFF" />
              </View>
            ) : (
              <View className="h-6 w-6 items-center justify-center rounded-full border border-backgroundElement">
                <MapPin size={12} color="#60646C" />
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground">
              {item.item.tx_alias || item.item.label}
            </Text>
            {item.item.tx_address ? (
              <View className="flex-row items-center gap-1 mt-0.5">
                <MapPin size={11} color="#60646C" />
                <Text className="text-xs text-muted" numberOfLines={2}>
                  {item.item.tx_address}
                </Text>
              </View>
            ) : null}
            {item.item.tx_working_hours ? (
              <View className="flex-row items-center gap-1 mt-0.5">
                <Clock size={11} color="#60646C" />
                <Text className="text-xs text-muted">
                  {item.item.tx_working_hours}
                </Text>
              </View>
            ) : null}
            {item.item.tx_phone ? (
              <View className="flex-row items-center gap-1 mt-0.5">
                <Phone size={11} color="#60646C" />
                <Text className="text-xs text-muted">{item.item.tx_phone}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  };
}

// Re-export del helper por si lo necesitan tests
export { findBranchById };
