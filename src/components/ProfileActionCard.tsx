import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { hexToRgba, type ThemeColors } from '@/theme/colors';

export type ProfileActionVariant = 'info' | 'orders' | 'logout';

/**
 * Card de acción del perfil (PROFILE-VIEW.md §6/§20): ícono + label,
 * con acento de color según `variant`. `info`/`orders` usan el primary
 * del whitelabel; `logout` usa `danger` — ambos derivados con
 * `hexToRgba` en vez de hardcodear un rojo fijo, para que el admin
 * pueda seguir controlando la paleta.
 */
export function ProfileActionCard({
  icon,
  label,
  variant,
  isActive = false,
  onPress,
  colors,
}: {
  icon: ReactNode;
  label: string;
  variant: ProfileActionVariant;
  isActive?: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const accent = variant === 'logout' ? colors.danger : colors.primary;
  const iconBg = hexToRgba(accent, 0.12);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 18,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: colors.section,
        borderWidth: 1,
        borderColor: isActive ? accent : colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <Text
        style={{ fontSize: 12.5, fontWeight: '600', color: colors.foreground, textAlign: 'center' }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}
