import { View } from 'react-native';
import { Archive, CircleUserRound, Truck, Undo2, type LucideIcon } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';

import { Surface } from '../ui/Surface';
import { Txt } from '../ui/Txt';
import { SectionHeader } from './SectionHeader';

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Truck,
    title: 'Envíos rápidos y seguros',
    description: 'Llegamos a la puerta de tu casa en tiempo récord con protocolos de seguridad.',
  },
  {
    icon: Archive,
    title: 'Stock real y actualizado',
    description: 'Contamos con una amplia variedad de medicamentos y productos de bienestar.',
  },
  {
    icon: CircleUserRound,
    title: 'Atención personalizada',
    description: 'Nuestros farmacéuticos expertos están listos para asesorarte en lo que necesites.',
  },
  {
    icon: Undo2,
    title: 'Devoluciones sin complicaciones',
    description: '¿Problemas con tu pedido? Gestionamos tu devolución de forma sencilla.',
  },
];

/**
 * "¿Por qué elegirnos?". **Mismo contrato que `@/components/WhyChooseUs`** (`colors`).
 *
 * Qué cambia: de una cuadrícula 2×2 con descripciones de 12 px a una lista de una columna con la
 * descripción en 14 px, dentro de una sola tarjeta: se lee de corrido sin recortes y ocupa casi la
 * misma altura. Los textos de los títulos son un poco más cortos para no partirse en tres líneas.
 */
export function WhyChooseUs({ colors }: { colors: ThemeColors }) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
      <SectionHeader
        title="¿Por qué elegirnos?"
        subtitle="Una experiencia de compra segura y profesional, priorizando tu bienestar."
        colors={colors}
      />

      <Surface colors={colors} padding={0} style={{ overflow: 'hidden' }}>
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <View
              key={feature.title}
              style={{
                flexDirection: 'row',
                gap: 14,
                padding: 14,
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.primaryOverlay,
                }}
              >
                <Icon size={22} color={colors.primary} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="label" colors={colors} style={{ fontWeight: '700' }}>
                  {feature.title}
                </Txt>
                <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '400', marginTop: 2 }}>
                  {feature.description}
                </Txt>
              </View>
            </View>
          );
        })}
      </Surface>
    </View>
  );
}
