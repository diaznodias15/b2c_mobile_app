import { memo } from 'react';
import { Pressable } from 'react-native';
import { Heart } from 'lucide-react-native';

import { useFavoritesStore } from '@/store/favorites.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';
import { hexToRgba, type ThemeColors } from '@/theme/colors';

import { MIN_TOUCH } from '../ui/tokens';

/**
 * Corazón de favoritos (solo clientes con sesión). El favorito es el **producto**, no depende de
 * la sede. Sin sesión avisa que hay que iniciarla. No es optimista: se rellena cuando el backend
 * confirma; mientras tanto se atenúa y ignora toques repetidos (ver `favorites.store`).
 *
 * Los selectores devuelven booleanos primitivos, así que son seguros con Zustand.
 */
export const FavoriteButton = memo(function FavoriteButton({
  slug,
  productName,
  colors,
}: {
  slug: string;
  productName: string;
  colors: ThemeColors;
}) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isFavorite = useFavoritesStore((s) => s.slugs.includes(slug));
  const isPending = useFavoritesStore((s) => s.pending.includes(slug));

  const handlePress = () => {
    if (!isAuthenticated) {
      useToastStore.getState().show('Inicia sesión para guardar tus favoritos.');
      return;
    }
    void useFavoritesStore.getState().toggle(slug);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isPending}
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite ? `Quitar ${productName} de favoritos` : `Agregar ${productName} a favoritos`
      }
      accessibilityState={{ selected: isFavorite, busy: isPending }}
      style={({ pressed }) => ({
        width: MIN_TOUCH,
        height: MIN_TOUCH,
        borderRadius: MIN_TOUCH / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hexToRgba(colors.background, 0.85),
        opacity: isPending ? 0.5 : pressed ? 0.8 : 1,
      })}
    >
      <Heart
        size={22}
        color={isFavorite ? colors.danger : colors.muted}
        fill={isFavorite ? colors.danger : 'transparent'}
      />
    </Pressable>
  );
});
