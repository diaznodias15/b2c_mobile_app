import { Dimensions, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { ArrowRight, Package } from 'lucide-react-native';

import type { ThemeColors } from '@/theme/colors';
import type { Department } from '@/types/whitelabel';

import { Txt } from '../ui/Txt';

const SCREEN_WIDTH = Dimensions.get('window').width;

/**
 * Grid de 2 columnas con 16 px de margen lateral (el gutter del rediseño, ver
 * `docs/redesign/DESIGN-SYSTEM.md` §4) y 12 de separación. Lo usan las vistas v2 de Home y
 * Departamentos, que usan el mismo margen.
 */
export const DEPARTMENT_CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 12) / 2;
const IMAGE_HEIGHT = 112;
/** Imagen + panel de texto (2 líneas de nombre + "Ver productos" + padding). */
export const DEPARTMENT_CARD_HEIGHT = 192;

/**
 * Card de departamento del rediseño. **Mismo contrato que `@/components/DepartmentCard`**
 * (`department`, `colors`, `onPress`) y mismas constantes exportadas.
 *
 * Qué cambia: el nombre ya no va sobre la foto (con fotos claras o recargadas el
 * contraste dependía de un degradado simulado con 28 franjas), sino en un panel
 * propio debajo de la imagen: contraste garantizado con cualquier foto y con los
 * colores del whitelabel, y sin trucos de capas. Sin imagen cae al color del
 * departamento con un icono.
 */
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
      accessibilityRole="button"
      accessibilityLabel={`${department.nb_department}, ver productos`}
      style={({ pressed }) => ({
        width: DEPARTMENT_CARD_WIDTH,
        height: DEPARTMENT_CARD_HEIGHT,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        backgroundColor: colors.productCard,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View
        style={{
          height: IMAGE_HEIGHT,
          backgroundColor: department.col_department ?? colors.section,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {department.tx_img_url ? (
          <Image
            source={{ uri: department.tx_img_url }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            contentFit="cover"
          />
        ) : (
          <Package size={32} color={colors.onPrimary} strokeWidth={1.6} />
        )}
      </View>

      <View style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>
        <Txt variant="label" colors={colors} numberOfLines={2}>
          {department.nb_department}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt variant="caption" color="primary" colors={colors} style={{ fontWeight: '600' }}>
            Ver productos
          </Txt>
          <ArrowRight size={14} color={colors.primary} strokeWidth={2.5} />
        </View>
      </View>
    </Pressable>
  );
}
