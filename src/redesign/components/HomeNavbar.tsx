import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, MapPin, Search } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BranchSelectorModal } from '@/components/BranchSelectorModal';
import { selectEffectiveBranch, useBranchStore } from '@/store/branch.store';
import { isLightColor, type ThemeColors } from '@/theme/colors';
import { LOGO_DARK as LOGO_DARK_URI, LOGO_LIGHT as LOGO_LIGHT_URI } from '@/utils/localImages.generated';

import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';

const LOGO_LIGHT = { uri: LOGO_LIGHT_URI };
const LOGO_DARK = { uri: LOGO_DARK_URI };

/**
 * Navbar fija del Home del rediseño. **Mismo contrato que `@/components/HomeNavbar`**
 * (`colors`).
 *
 * Qué cambia: (1) el selector de sede es una pastilla con icono de ubicación y área
 * táctil de 48 (era un texto suelto de 14 px), y (2) hay un buscador visible que lleva a
 * la pestaña Buscar: en e-commerce la búsqueda es la vía principal para llegar a un
 * producto y antes estaba a dos toques (tab inferior).
 *
 * Igual que el original, el logo y los tonos se eligen por el color REAL de la navbar
 * del whitelabel (`isLightColor`), no por el modo claro/oscuro del sistema.
 */
export function HomeNavbar({ colors }: { colors: ThemeColors }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const branch = useBranchStore(selectEffectiveBranch);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

  const isLight = isLightColor(colors.navbar);
  const logoSource = isLight ? LOGO_LIGHT : LOGO_DARK;
  // Sobre navbar clara, controles en el gris de fondo de la app; sobre oscura, blanco translúcido.
  const controlBg = isLight ? colors.background : 'rgba(255,255,255,0.14)';
  const controlBorder = isLight ? colors.border : 'rgba(255,255,255,0.18)';
  const hintColor = isLight ? colors.muted : 'rgba(255,255,255,0.78)';

  const branchName = branch ? (branch.tx_alias ?? branch.label) : null;

  return (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        gap: 10,
        backgroundColor: colors.navbar,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Image source={logoSource} style={{ width: 120, height: 36 }} resizeMode="contain" />

        {branchName && (
          <Pressable
            onPress={() => setIsBranchModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Sede ${branchName}. Cambiar de sede`}
            style={({ pressed }) => ({
              flexShrink: 1,
              minHeight: MIN_TOUCH,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: controlBorder,
              backgroundColor: controlBg,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <MapPin size={16} color={colors.navbarForeground} />
            <View style={{ flexShrink: 1 }}>
              <Txt variant="label" colors={colors} numberOfLines={1} style={{ color: colors.navbarForeground }}>
                {branchName}
              </Txt>
            </View>
            <ChevronDown size={16} color={colors.navbarForeground} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      <Pressable
        // `/search` es una pestaña: se navega con `replace`, igual que `bottom-tabs`.
        onPress={() => router.replace('/search')}
        accessibilityRole="search"
        accessibilityLabel="Buscar productos"
        style={({ pressed }) => ({
          minHeight: MIN_TOUCH,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: controlBorder,
          backgroundColor: controlBg,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Search size={18} color={hintColor} />
        <Txt variant="body" colors={colors} numberOfLines={1} style={{ color: hintColor }}>
          Buscar productos
        </Txt>
      </Pressable>

      <BranchSelectorModal
        visible={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        colors={colors}
      />
    </View>
  );
}
