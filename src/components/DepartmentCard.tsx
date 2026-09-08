import { Dimensions, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';

import type { ThemeColors } from '@/theme/colors';
import type { Department } from '@/types/whitelabel';

const SCREEN_WIDTH = Dimensions.get('window').width;

/** Grid de 2 columnas con 24px de padding lateral y 12px de gap — usado en Home y Departamentos. */
export const DEPARTMENT_CARD_WIDTH = (SCREEN_WIDTH - 24 * 2 - 12) / 2;
export const DEPARTMENT_CARD_HEIGHT = 168;

/**
 * Fake-gradient sin expo-linear-gradient: muchas franjas finas con opacidad
 * progresiva (curva ease-in fuerte) en vez de 2-3 bandas gruesas — con pocas
 * bandas se ven "escalones" duros; con ~28 el ojo lo percibe como un fade
 * suave. Exponente alto (2.6) + altura acotada (52%) para que la foto se
 * vea limpia arriba y el oscurecido quede marcado solo abajo, donde está
 * el texto.
 */
const SCRIM_BAND_COUNT = 28;
const SCRIM_HEIGHT_PERCENT = 52;
const SCRIM_MAX_OPACITY = 0.82;
const SCRIM_BAND_OPACITIES = Array.from({ length: SCRIM_BAND_COUNT }, (_, i) => {
  const t = (i + 1) / SCRIM_BAND_COUNT;
  return Math.pow(t, 2.6) * SCRIM_MAX_OPACITY;
});

export function DepartmentCard({
  department,
  colors,
  onPress,
}: {
  department: Department;
  colors: ThemeColors;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: DEPARTMENT_CARD_WIDTH,
        height: DEPARTMENT_CARD_HEIGHT,
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: department.col_department ?? colors.section,
      }}
      accessibilityRole="button"
      accessibilityLabel={department.nb_department}
    >
      {department.tx_img_url && (
        <Image
          source={{ uri: department.tx_img_url }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
        />
      )}

      {/* Scrim de abajo: franjas finas, no bandas gruesas (ver comentario arriba) */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: `${SCRIM_HEIGHT_PERCENT}%`,
          flexDirection: 'column',
        }}
      >
        {SCRIM_BAND_OPACITIES.map((opacity, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: `rgba(0,0,0,${opacity})` }} />
        ))}
      </View>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 14 }}>
        <Text
          numberOfLines={2}
          style={{
            fontSize: 15.5,
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: 4,
          }}
        >
          {department.nb_department}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 11.5, fontWeight: '500', color: 'rgba(255,255,255,0.85)' }}>
            Ver productos
          </Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>
            →
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
