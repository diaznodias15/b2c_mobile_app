import { memo, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable } from 'react-native';
import { Heart } from 'lucide-react-native';

import { useFavoritesStore } from '@/store/favorites.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';
import { hexToRgba, type ThemeColors } from '@/theme/colors';

import { MIN_TOUCH } from '../ui/tokens';

/** Círculo visible de 36: sobre la foto de una card pesaba demasiado a 48. */
const DEFAULT_SIZE = 36;

/**
 * Corazón de favoritos (solo clientes con sesión). El favorito es el **producto**, no depende de
 * la sede. Sin sesión avisa que hay que iniciarla. No es optimista: se rellena cuando el backend
 * confirma; mientras tanto se atenúa y ignora toques repetidos (ver `favorites.store`).
 *
 * Tamaño: el círculo visible es de 36 (ícono de 20), pero el área táctil sigue siendo de 48 dp
 * porque `hitSlop` rellena la diferencia (mínimo de Android). Sobre una foto lleva un fondo claro
 * casi opaco con borde fino, para que el corazón se lea sobre cualquier imagen.
 *
 * Mientras la petición va en vuelo el corazón "late" (opacidad) y, al confirmarse un favorito
 * nuevo, da un "pop" breve. Ambas animaciones se omiten con *reducir movimiento* (el latido queda
 * como una opacidad fija): se consulta solo en ese momento, sin un listener por cada card.
 *
 * Los selectores devuelven booleanos primitivos, así que son seguros con Zustand.
 */
export const FavoriteButton = memo(function FavoriteButton({
  slug,
  productName,
  colors,
  plain = false,
  size = DEFAULT_SIZE,
}: {
  slug: string;
  productName: string;
  colors: ThemeColors;
  /** Sin fondo: para filas donde el botón no va sobre una imagen. */
  plain?: boolean;
  /** Lado VISIBLE del círculo; el área táctil se completa hasta 48 dp con `hitSlop`. */
  size?: number;
}) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isFavorite = useFavoritesStore((s) => s.slugs.includes(slug));
  const isPending = useFavoritesStore((s) => s.pending.includes(slug));

  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  // Latido mientras el backend responde.
  useEffect(() => {
    if (!isPending) return;
    let cancelled = false;
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          pulse.setValue(0.5);
          return;
        }
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, { toValue: 0.35, duration: 350, useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0.85, duration: 350, useNativeDriver: true }),
          ])
        );
        loop.start();
      });
    return () => {
      cancelled = true;
      loop?.stop();
      pulse.setValue(1);
    };
  }, [isPending, pulse]);
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
      useToastStore.getState().show('Inicia sesión para guardar tus productos favoritos.');
      return;
    }
    void useFavoritesStore.getState().toggle(slug);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isPending}
      hitSlop={Math.max(0, (MIN_TOUCH - size) / 2)}
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite ? `Quitar ${productName} de favoritos` : `Agregar ${productName} a favoritos`
      }
      accessibilityState={{ selected: isFavorite, busy: isPending }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: plain ? 'transparent' : hexToRgba(colors.productCard, 0.92),
        borderWidth: plain ? 0 : 1,
        borderColor: hexToRgba(colors.border, 0.8),
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Animated.View style={{ opacity: pulse, transform: [{ scale }] }}>
        <Heart
          size={Math.round(size * 0.55)}
          color={isFavorite ? colors.danger : colors.muted}
          fill={isFavorite ? colors.danger : 'transparent'}
        />
      </Animated.View>
    </Pressable>
  );
});
