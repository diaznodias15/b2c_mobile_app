import { Text, View } from 'react-native';

import type { ThemeColors } from '@/theme/colors';

/**
 * Encabezado de sección reutilizable para el Home (y cualquier pantalla con
 * scroll de secciones): título centrado + subtítulo opcional. Usar esto en
 * vez de armar el título suelto en cada sección para que todas se vean
 * consistentes.
 */
export function SectionHeader({
  title,
  subtitle,
  colors,
}: {
  title: string;
  subtitle?: string;
  colors: ThemeColors;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.foreground,
          textAlign: 'center',
          marginBottom: subtitle ? 6 : 0,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 13,
            color: colors.muted,
            textAlign: 'center',
            lineHeight: 18,
            paddingHorizontal: 8,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
