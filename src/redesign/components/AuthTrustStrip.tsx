import { View } from 'react-native';
import { Archive, CircleUserRound, ShieldCheck, type LucideIcon } from 'lucide-react-native';

import { useThemeColors } from '@/store/config.store';

import { Txt } from '../ui/Txt';

/** Las tres promesas de la tienda que ya comunica el Home ("¿Por qué elegirnos?"). */
const TRUST_POINTS: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: 'Compra segura' },
  { icon: Archive, label: 'Stock real' },
  { icon: CircleUserRound, label: 'Atención personalizada' },
];

/** Sello de confianza de las pantallas de acceso: tres iconos con su promesa, anunciados como una frase. */
export function AuthTrustStrip() {
  const colors = useThemeColors();
  return (
    <View
      style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24 }}
      accessible
      accessibilityLabel="Compra segura, stock real y atención personalizada"
    >
      {TRUST_POINTS.map(({ icon: Icon, label }) => (
        <View key={label} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primaryOverlay,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={22} color={colors.primary} strokeWidth={1.8} />
          </View>
          <Txt variant="caption" color="muted" colors={colors} style={{ textAlign: 'center' }}>
            {label}
          </Txt>
        </View>
      ))}
    </View>
  );
}
