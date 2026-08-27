import { Pressable, ScrollView, useColorScheme, View } from 'react-native';
import { Text } from 'heroui-native';
import { Link } from 'expo-router';

import { Colors } from '@/constants/theme';

const TABS = [
  { name: 'Inicio', href: '/' },
  { name: 'Categorías', href: '/categories' },
  { name: 'Buscar', href: '/search' },
  { name: 'Carrito', href: '/cart' },
  { name: 'Perfil', href: '/profile' },
] as const;

/**
 * Versión web de AppTabs. Como `expo-router/unstable-native-tabs`
 * (NativeTabs) no funciona en web, renderizamos una barra de
 * navegación horizontal con links usando expo-router `Link`.
 */
export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.backgroundElement,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, alignItems: 'center' }}
      >
        {TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} asChild>
            <Pressable
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 9999,
                backgroundColor: colors.backgroundElement,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>
                {tab.name}
              </Text>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}
