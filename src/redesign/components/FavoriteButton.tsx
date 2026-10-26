import { memo, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable } from 'react-native';
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
 * Al pasar a favorito (ya confirmado) el corazón da un "pop" breve. Es la única animación y se
 * omite con *reducir movimiento*: se consulta solo en ese momento (no hay un listener por cada
 * card de una lista).
 *
 * Los selectores devuelven booleanos primitivos, así que son seguros con Zustand.
 */
export const FavoriteButton = memo(function FavoriteButton({
  slug,
  productName,
  colors,
  plain = false,
}: {
  slug: string;
  productName: string;
  colors: ThemeColors;
  /** Sin fondo: para filas donde el botón no va sobre una imagen. */
  plain?: boolean;
}) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isFavorite = useFavoritesStore((s) => s.slugs.includes(slug));
  const isPending = useFavoritesStore((s) => s.pending.includes(slug));

  const scale = useRef(new Animated.Value(1)).current;
  // Solo anima al CAMBIAR a favorito, no al montar una card que ya lo era.
  const wasFavorite = useRef(isFavorite);

  useEffect(() => {
    const justAdded = isFavorite && !wasFavorite.current;
    wasFavorite.current = isFavorite;
    if (!justAdded) return;

    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled || reduce) return;
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.35, duration: 110, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
        ]).start();
      });
    return () => {
      cancelled = true;
    };
  }, [isFavorite, scale]);

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
        backgroundColor: plain ? 'transparent' : hexToRgba(colors.background, 0.85),
        opacity: isPending ? 0.5 : pressed ? 0.8 : 1,
      })}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Heart
          size={22}
          color={isFavorite ? colors.danger : colors.muted}
          fill={isFavorite ? colors.danger : 'transparent'}
        />
      </Animated.View>
    </Pressable>
  );
});
