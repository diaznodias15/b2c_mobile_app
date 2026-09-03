import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, LayoutGrid, Search, User } from 'lucide-react-native';

import { SOFT_COLORS } from '@/theme/colors';

const TABS = [
  { label: 'Inicio', href: '/', icon: House },
  { label: 'Categorías', href: '/categories', icon: LayoutGrid },
  { label: 'Buscar', href: '/search', icon: Search },
  { label: 'Perfil', href: '/profile', icon: User },
] as const;

/**
 * Barra de tabs inferior.
 *
 * Va pineada al fondo con `position: 'absolute'` (equivalente a
 * `position: fixed` en web) para que:
 *   1. El contenido de la pantalla SIEMPRE ocupe toda la altura disponible
 *      sin tener que descontar la altura de la tab bar.
 *   2. La tab bar NO dependa del flex layout del padre. En Android (Expo
 *      Go) el `flex: 1` no se aplicaba consistentemente y el contenido se
 *      colapsaba a 0px.
 *
 * La alternativa es `NativeTabs` de expo-router/unstable-native-tabs, pero
 * nos dio pantalla blanca en el device. Esta version es 100% JS.
 *
 * Cada screen debe agregar `paddingBottom` al contenido para que el texto
 * no quede tapado por las tabs (usamos TAB_BAR_HEIGHT como constante).
 *
 * Estilos: 100% inline (NO className) porque las clases de Uniwind para
 * flex/fontSize/color/margin no se aplican igual entre web y Android.
 */
export const TAB_BAR_HEIGHT = 64;

export function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: SOFT_COLORS.bottomNavbar,
        borderTopWidth: 1,
        borderTopColor: SOFT_COLORS.border,
        paddingBottom: insets.bottom,
      }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        const iconColor = active ? SOFT_COLORS.primary : SOFT_COLORS.muted;
        const labelColor = active ? SOFT_COLORS.primary : SOFT_COLORS.muted;
        return (
          <Pressable
            key={tab.href}
            onPress={() => router.push(tab.href as any)}
            style={{
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
            }}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <View
              style={{
                width: 32,
                height: 3,
                borderRadius: 2,
                backgroundColor: active ? SOFT_COLORS.primary : 'transparent',
                marginBottom: 4,
              }}
            />
            <Icon size={22} color={iconColor} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                fontWeight: active ? '600' : '400',
                color: labelColor,
                marginTop: 4,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
