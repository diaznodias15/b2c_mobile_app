import { View } from 'react-native';
import { Shield } from 'lucide-react-native';

import { useEffectiveBranchLocation } from '@/store/branch.store';
import type { ThemeColors } from '@/theme/colors';

import { Surface } from '../ui/Surface';
import { Txt } from '../ui/Txt';

/**
 * Banner "Entrega 100% segura en …". **Mismo contrato que `@/components/DeliveryBanner`**
 * (`colors`).
 *
 * Qué cambia:
 *  - Usa el color primario del whitelabel en vez de un azul fijo (`#4C4FE0`) que ignoraba la marca
 *    del admin.
 *  - Corrige el texto: el original repetía el estado ("Maracaibo (Zulia), Edo. Zulia"); ahora dice
 *    "Maracaibo, Edo. Zulia".
 *  - Texto de 14 px (era 13) y sin cursiva, que dificulta la lectura.
 */
export function DeliveryBanner({ colors }: { colors: ThemeColors }) {
  const location = useEffectiveBranchLocation();
  if (!location) return null;

  return (
    <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
      <Surface colors={colors} padding={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primaryOverlay,
          }}
        >
          <Shield size={20} color={colors.primary} strokeWidth={2} />
        </View>

        <View style={{ flex: 1 }}>
          <Txt variant="label" colors={colors} style={{ fontWeight: '500' }}>
            Entrega 100% segura en{' '}
            <Txt variant="label" color="primary" colors={colors} style={{ fontWeight: '800' }}>
              {location.city}, Edo. {location.state}
            </Txt>
          </Txt>
        </View>
      </Surface>
    </View>
  );
}
