import { usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

const TABS = [
  { label: 'Inicio', href: '/' },
  { label: 'Categorías', href: '/categories' },
  { label: 'Buscar', href: '/search' },
  { label: 'Perfil', href: '/profile' },
] as const;

/**
 * Barra de tabs inferior hecha con Pressable + router.push.
 *
 * La alternativa es `NativeTabs` de expo-router/unstable-native-tabs, pero
 * nos dio pantalla blanca en el device, probablemente por incompatibilidad
 * con el New Architecture en Expo Go. Esta version es 100% JS y anda en
 * cualquier plataforma.
 *
 * Cada screen agrega este componente al final y el router se encarga del
 * resto. No necesitamos anidar navegadores.
 */
export function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View className="flex-row bg-background border-t border-border">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
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
            <Text
              className={
                active
                  ? 'text-sm font-semibold text-primary'
                  : 'text-sm text-muted'
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
