import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, LayoutGrid, Search, User } from 'lucide-react-native';

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
 * El padding bottom se calcula con `useSafeAreaInsets` para respetar el
 * home indicator en iOS / gesture bar en Android, sin necesidad de envolver
 * todo en un SafeAreaView (que en algunas versiones de react-native-safe-
 * area-context rompe el flujo flex de la pantalla).
 */
export function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row bg-background border-t border-border"
      style={{ paddingBottom: insets.bottom }}
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        const iconColor = active ? '#008000' : '#60646C';
        return (
          <Pressable
            key={tab.href}
            onPress={() => router.push(tab.href as any)}
            className="flex-1 items-center justify-center py-3"
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <View
              className={
                active
                  ? 'h-1 w-8 rounded-full bg-primary mb-1'
                  : 'h-1 w-8 rounded-full bg-transparent mb-1'
              }
            />
            <Icon size={22} color={iconColor} />
            <Text
              className={
                active
                  ? 'text-xs font-semibold text-primary mt-1'
                  : 'text-xs text-muted mt-1'
              }
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
