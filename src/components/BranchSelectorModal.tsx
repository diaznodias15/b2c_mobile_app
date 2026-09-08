import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronLeft, ChevronUp, MapPin, Navigation, X } from 'lucide-react-native';

import {
  selectDefaultBranch,
  selectEffectiveBranchId,
  useBranchStore,
} from '@/store/branch.store';
import type { ThemeColors } from '@/theme/colors';
import type { BranchGroup, BranchItem } from '@/types/whitelabel';

// En la arquitectura vieja de Android, LayoutAnimation requiere este flag
// experimental. En Fabric (nueva arquitectura, la que usa este proyecto)
// es un no-op — se deja detrás de un chequeo por si algún día se corre
// con la arquitectura vieja.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACCORDION_ANIMATION = LayoutAnimation.create(
  220,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity
);

/**
 * Modal para elegir sede (estado → ciudad → sedes), inspirado en el
 * selector de la web. Al confirmar una sede llama `setSelectedBranch` —
 * cualquier componente que lea `selectEffectiveBranchId`/`selectEffectiveBranch`
 * (ej. `TopProducts`) se refresca solo porque cambia el state de Zustand,
 * no hace falta ningún callback extra acá.
 */
export function BranchSelectorModal({
  visible,
  onClose,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
}) {
  const insets = useSafeAreaInsets();
  const branchTree = useBranchStore((s) => s.branchTree);
  const setSelectedBranch = useBranchStore((s) => s.setSelectedBranch);
  const effectiveBranchId = useBranchStore(selectEffectiveBranchId);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(600)).current;

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    // Al abrir, expandir el grupo de la sede efectiva actual.
    const current = branchTree.find((group) =>
      group.items.some((item) => item.value === effectiveBranchId)
    );
    setExpandedGroup(current?.group ?? branchTree[0]?.group ?? null);

    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(600);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    ]).start();
  }, [visible]);

  function selectBranch(item: BranchItem) {
    setSelectedBranch(item);
    onClose();
  }

  function selectRecommended() {
    const recommended = selectDefaultBranch({ branchTree });
    if (recommended) setSelectedBranch(recommended);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Cerrar selector de sede">
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            opacity: backdropOpacity,
          }}
        />
      </Pressable>

      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '85%',
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          transform: [{ translateY: sheetTranslateY }],
        }}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 19, fontWeight: '700', color: colors.foreground, flexShrink: 1 }}>
              Selecciona una sede
            </Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Cerrar">
              <X size={22} color={colors.muted} />
            </Pressable>
          </View>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
            Elige la tienda donde deseas hacer tu compra
          </Text>
        </View>

        <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
          {branchTree.map((group) => (
            <BranchGroupRow
              key={group.group}
              group={group}
              colors={colors}
              expanded={expandedGroup === group.group}
              effectiveBranchId={effectiveBranchId}
              onToggle={() => {
                LayoutAnimation.configureNext(ACCORDION_ANIMATION);
                setExpandedGroup((prev) => (prev === group.group ? null : group.group));
              }}
              onSelect={selectBranch}
            />
          ))}
          {branchTree.length === 0 && (
            <Text style={{ fontSize: 14, color: colors.muted, paddingVertical: 24, textAlign: 'center' }}>
              Todavía no hay sedes disponibles.
            </Text>
          )}
          <View style={{ height: 12 }} />
        </ScrollView>

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
            gap: 4,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Pressable
            onPress={selectRecommended}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              backgroundColor: colors.primary,
              borderRadius: 14,
              paddingVertical: 14,
            }}
            accessibilityRole="button"
            accessibilityLabel="Selección recomendada"
          >
            <Navigation size={18} color={colors.onPrimary} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.onPrimary }}>
              Selección recomendada
            </Text>
          </Pressable>

          <Pressable
            onPress={onClose}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingVertical: 12,
            }}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
          >
            <ChevronLeft size={16} color={colors.muted} />
            <Text style={{ fontSize: 14, color: colors.muted }}>Cerrar</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

function BranchGroupRow({
  group,
  colors,
  expanded,
  effectiveBranchId,
  onToggle,
  onSelect,
}: {
  group: BranchGroup;
  colors: ThemeColors;
  expanded: boolean;
  effectiveBranchId: number | null;
  onToggle: () => void;
  onSelect: (item: BranchItem) => void;
}) {
  const ChevronIcon = expanded ? ChevronUp : ChevronDown;

  return (
    <View style={{ marginBottom: 12 }}>
      <Pressable
        onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
        accessibilityRole="button"
        accessibilityLabel={`${group.nb_city}, ${group.nb_state}`}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primaryOverlaySoft,
          }}
        >
          <MapPin size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>{group.nb_state}</Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>
            {group.nb_city}
          </Text>
        </View>
        <ChevronIcon size={20} color={colors.muted} />
      </Pressable>

      {expanded && (
        <View style={{ gap: 10, paddingTop: 4 }}>
          {group.items.map((item) => {
            const isCurrent = item.value === effectiveBranchId;
            return (
              <View
                key={item.value}
                style={{
                  backgroundColor: colors.section,
                  borderRadius: 14,
                  padding: 14,
                  gap: 10,
                  borderWidth: isCurrent ? 1.5 : 0,
                  borderColor: colors.primary,
                }}
              >
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <MapPin size={16} color={colors.muted} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>
                      {item.tx_alias ?? item.nb_branch}
                    </Text>
                    {item.tx_address && (
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        {item.tx_address}
                      </Text>
                    )}
                    {item.tx_working_hours && (
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        {item.tx_working_hours}
                      </Text>
                    )}
                  </View>
                </View>

                <Pressable
                  onPress={() => !isCurrent && onSelect(item)}
                  disabled={isCurrent}
                  style={{
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: isCurrent ? colors.border : colors.primary,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={isCurrent ? 'Sede actual' : `Seleccionar ${item.tx_alias ?? item.nb_branch}`}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: isCurrent ? colors.muted : colors.onPrimary,
                    }}
                  >
                    {isCurrent ? 'Sede actual' : 'Seleccionar'}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
