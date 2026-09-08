import { Text, View } from 'react-native';
import { Archive, CircleUserRound, Truck, Undo2 } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { SectionHeader } from '@/components/SectionHeader';
import type { ThemeColors } from '@/theme/colors';

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
    title: 'Atención al cliente personalizada',
    description: 'Nuestros farmacéuticos expertos están listos para asesorarte en lo que necesites.',
  },
  {
    icon: Undo2,
    title: 'Devoluciones fáciles y sin complicaciones',
    description: '¿Problemas con tu pedido? Gestionamos tu devolución de forma sencilla.',
  },
];

export function WhyChooseUs({ colors }: { colors: ThemeColors }) {
  return (
    <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
      <SectionHeader
        title="¿Por qué elegirnos?"
        subtitle="Nos enfocamos en brindar una experiencia de compra segura y profesional, priorizando tu bienestar por encima de todo."
        colors={colors}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} colors={colors} />
        ))}
      </View>
    </View>
  );
}

function FeatureCard({
  feature,
  colors,
}: {
  feature: { icon: LucideIcon; title: string; description: string };
  colors: ThemeColors;
}) {
  const Icon = feature.icon;
  return (
    <View
      style={{
        flexBasis: '47%',
        flexGrow: 1,
        backgroundColor: colors.section,
        borderRadius: 16,
        padding: 14,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryOverlaySoft,
          marginBottom: 10,
        }}
      >
        <Icon size={20} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text
        style={{
          fontSize: 13.5,
          fontWeight: '700',
          color: colors.foreground,
          marginBottom: 4,
          lineHeight: 18,
        }}
      >
        {feature.title}
      </Text>
      <Text style={{ fontSize: 12, color: colors.muted, lineHeight: 16 }}>
        {feature.description}
      </Text>
    </View>
  );
}
