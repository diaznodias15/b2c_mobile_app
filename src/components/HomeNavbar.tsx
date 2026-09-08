import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { selectEffectiveBranch, useBranchStore } from '@/store/branch.store';
import { isLightColor, type ThemeColors } from '@/theme/colors';

const LOGO_LIGHT = require('../../assets/images/logo-light.webp');
const LOGO_DARK = require('../../assets/images/logo-dark.webp');

/**
 * Navbar fija arriba del Home: logo + nombre de la sede seleccionada +
 * flecha de "select". El chevron es puramente visual por ahora — todavía
 * no existe pantalla/modal de selección de sede (`onPress` vacío a
 * propósito, ver pedido del usuario).
 *
 * El logo tiene dos variantes locales (`logo-light`/`logo-dark`, no vienen
 * del backend): `logo-light` es el logo a color, pensado para fondos
 * claros; `logo-dark` es una versión casi blanca, pensada para fondos
 * oscuros (queda invisible sobre blanco). Elegimos por el color real de
 * fondo del navbar (whitelabel), no por el modo claro/oscuro del sistema.
 */
export function HomeNavbar({ colors }: { colors: ThemeColors }) {
  const insets = useSafeAreaInsets();
  const branch = useBranchStore(selectEffectiveBranch);
  const logoSource = isLightColor(colors.navbar) ? LOGO_LIGHT : LOGO_DARK;

  return (
    <View
      style={{
        paddingTop: insets.top + 10,
        paddingBottom: 10,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        backgroundColor: colors.navbar,
      }}
    >
      <Image
        source={logoSource}
        style={{ width: 120, height: 36 }}
        contentFit="contain"
      />

      {branch && (
        <Pressable
          onPress={() => {}}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: colors.navbarForeground,
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {branch.tx_alias ?? branch.label}
          </Text>
          <ChevronDown size={18} color={colors.navbarForeground} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );
}
