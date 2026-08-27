import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * Tabs inferiores de la app.
 * En Fase 0 están como placeholders. Cada tab apunta a su ruta
 * definitiva del file-based router (expo-router).
 */
export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="house.fill"
          drawable="ic_menu_home"
          selectedColor={colors.text}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="categories">
        <NativeTabs.Trigger.Label>Categorías</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="square.grid.2x2.fill"
          drawable="ic_menu_sort_by_size"
          selectedColor={colors.text}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Buscar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="magnifyingglass"
          drawable="ic_menu_search"
          selectedColor={colors.text}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cart">
        <NativeTabs.Trigger.Label>Carrito</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="cart.fill"
          drawable="ic_menu_cart"
          selectedColor={colors.text}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="person.fill"
          drawable="ic_menu_myplaces"
          selectedColor={colors.text}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
