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
 * Barra de tabs inferior con Pressable + router.push.
 *
 * La alternativa es `NativeTabs` de expo-router/unstable-native-tabs, pero
 * nos dio pantalla blanca en el device, probablemente por incompatibilidad
 * con el New Architecture en Expo Go. Esta version es 100% JS y anda en
 * cualquier plataforma.
 *
 * Cada screen agrega este componente al final y el router se encarga del
 * resto. No necesitamos anidar navegadores.
 *
 * NOTA: usamos `style` inline (NO className) porque las clases de Uniwind
 * para flex-direction, fontSize, color y margin en Text/View no se aplican
 * de forma consistente entre web y Android (Expo Go). Los estilos inline
 * via StyleSheet son la fuente de verdad en este componente.
 */
export function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
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
              paddingVertical: 10,
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
                marginBottom: 6,
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
