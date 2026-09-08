import { Text, View } from 'react-native';
import { Shield } from 'lucide-react-native';

import { useEffectiveBranchLocation } from '@/store/branch.store';
import type { ThemeColors } from '@/theme/colors';

/**
 * Acento fijo tipo "sello de confianza" — no viene del whitelabel a
 * propósito, es independiente de la marca (igual que en la web).
 */
const ACCENT = '#4C4FE0';
const ACCENT_SOFT = '#EEF0FE';

export function DeliveryBanner({ colors }: { colors: ThemeColors }) {
  const location = useEffectiveBranchLocation();
  if (!location) return null;

  return (
    <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          backgroundColor: colors.section,
          borderRadius: 16,
          paddingVertical: 14,
          paddingHorizontal: 16,
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 6,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: ACCENT_SOFT,
          }}
        >
          <Shield size={18} color={ACCENT} strokeWidth={2} />
        </View>

        <Text style={{ fontSize: 13, flexShrink: 1 }}>
          <Text style={{ fontStyle: 'italic', color: ACCENT }}>Entrega 100% segura en </Text>
          <Text style={{ fontWeight: '700', color: ACCENT }}>
            {location.city} ({location.state}), Edo. {location.state}
          </Text>
        </Text>
      </View>
    </View>
  );
}
