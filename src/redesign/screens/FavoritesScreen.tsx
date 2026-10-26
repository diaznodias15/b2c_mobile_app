import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Heart, LogIn, RefreshCcw, ShoppingCart } from 'lucide-react-native';

import { addFavoritesToCart, getFavorites, type FavoriteProduct } from '@/api/services/favorites.services';
import { useListAddToCart } from '@/hooks/useListAddToCart';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { useSafePush } from '@/hooks/useSafePush';
import { selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { useCartStore } from '@/store/cart.store';
import { useThemeColors } from '@/store/config.store';
import { useFavoritesStore } from '@/store/favorites.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';
import type { ThemeColors } from '@/theme/colors';
import type { Product } from '@/types/whitelabel';
import { favoriteToProduct, isFavoriteAddable } from '@/utils/favorites';
import { notifyCartBulkResult } from '@/utils/notifyCartBulkResult';

import { ProductListItem } from '../components/ProductListItem';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Txt } from '../ui/Txt';

/**
 * "Mis favoritos" (ruta del stack, desde Perfil). El favorito es el producto; aquí se ve con el
 * precio y el stock de la sede ACTIVA. Un favorito que la sede no maneja sigue en la lista, pero
 * con el aviso "No disponible en esta sede" y sin poder agregarse. "Agregar todos" suma 1 unidad
 * de cada favorito disponible (el backend decide y responde por línea, igual que "repetir pedido").
 *
 * Quitar un corazón aquí oculta la fila de inmediato (el store ya confirmó con el backend).
 */
export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const push = useSafePush();
  const refreshControl = useRefreshControl();
  const addToCart = useListAddToCart();

  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const branchId = useBranchStore(selectEffectiveBranchId);
  const slugs = useFavoritesStore((s) => s.slugs);
  const isLoaded = useFavoritesStore((s) => s.isLoaded);
  const [addingAll, setAddingAll] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['favorites', branchId],
    // `signal`: al cambiar de sede se cancela la petición anterior (una respuesta vieja no pisa a la nueva).
    queryFn: ({ signal }) => getFavorites(branchId as number, { signal }),
    enabled: isAuthenticated && branchId !== null,
    // Al volver de otra pantalla puede haber cambiado (corazones, sede): se relee siempre.
    staleTime: 0,
  });

  // Los quitados en esta pantalla ya no están en el store: se ocultan sin esperar otra petición.
  const favorites = (data ?? []).filter((f) => !isLoaded || slugs.includes(f.tx_slug));
  const anyAddable = favorites.some(isFavoriteAddable);

  const handlePress = useCallback((p: Product) => push(`/product/${p.tx_slug}`), [push]);

  const handleAddAll = async () => {
    if (addingAll || branchId === null) return;
    setAddingAll(true);
    try {
      const { data: result, message } = await addFavoritesToCart(branchId);
      const added = notifyCartBulkResult(result, {
        message,
        emptyMessage: 'Ninguno de tus favoritos está disponible en esta sede.',
      });
      await useCartStore.getState().refreshFromServer(branchId);
      if (added) router.replace('/cart');
    } catch (err) {
      notifyError(err);
    } finally {
      setAddingAll(false);
    }
  };

  const header = (
    <View style={{ gap: 12, marginBottom: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconButton
          icon={ChevronLeft}
          label="Volver"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
          colors={colors}
        />
        <View style={{ flex: 1 }}>
          <Txt variant="title" colors={colors}>
            Mis favoritos
          </Txt>
          {!isLoading && !isError && favorites.length > 0 ? (
            <Txt variant="caption" color="muted" colors={colors}>
              {favorites.length} {favorites.length === 1 ? 'producto' : 'productos'}
            </Txt>
          ) : null}
        </View>
      </View>
      {anyAddable ? (
        <Button
          label="Agregar todos al carrito"
          icon={ShoppingCart}
          onPress={() => void handleAddAll()}
          loading={addingAll}
          colors={colors}
        />
      ) : null}
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8, paddingHorizontal: 16 }}>
        {header}
        <EmptyState
          colors={colors}
          title="Inicia sesión para ver tus favoritos"
          message="Guarda los productos que más compras y encuéntralos aquí."
          action={{ label: 'Iniciar sesión', icon: LogIn, onPress: () => push('/login') }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={isLoading || isError ? [] : favorites}
        keyExtractor={(f) => f.tx_slug}
        refreshControl={refreshControl}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
          gap: 10,
          flexGrow: 1,
        }}
        ListHeaderComponent={header}
        renderItem={({ item }) => <FavoriteRow favorite={item} colors={colors} onPress={handlePress} onAddToCart={addToCart} />}
        ListEmptyComponent={
          isLoading ? (
            <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center', paddingVertical: 40 }}>
              Cargando tus favoritos…
            </Txt>
          ) : isError ? (
            <EmptyState
              colors={colors}
              title="No pudimos cargar tus favoritos"
              message="Revisa tu conexión e inténtalo de nuevo."
              action={{ label: 'Reintentar', icon: RefreshCcw, onPress: () => void refetch() }}
            />
          ) : (
            <EmptyState
              colors={colors}
              title="Aún no tienes favoritos"
              message="Toca el corazón en un producto para guardarlo aquí."
              action={{ label: 'Ir al inicio', onPress: () => router.replace('/') }}
            />
          )
        }
      />
    </View>
  );
}

function notifyError(err: unknown) {
  useToastStore
    .getState()
    .show(err instanceof Error && err.message ? err.message : 'No pudimos agregar tus favoritos al carrito.');
}

function FavoriteRow({
  favorite,
  colors,
  onPress,
  onAddToCart,
}: {
  favorite: FavoriteProduct;
  colors: ThemeColors;
  onPress: (p: Product) => void;
  onAddToCart: (p: Product) => Promise<boolean>;
}) {
  return (
    <View style={{ gap: 4 }}>
      <ProductListItem product={favoriteToProduct(favorite)} colors={colors} onPress={onPress} onAddToCart={onAddToCart} />
      {!favorite.is_in_branch ? (
        <Txt variant="caption" color="muted" colors={colors} style={{ paddingHorizontal: 4 }}>
          No disponible en esta sede
        </Txt>
      ) : null}
    </View>
  );
}

function EmptyState({
  colors,
  title,
  message,
  action,
}: {
  colors: ThemeColors;
  title: string;
  message: string;
  action: { label: string; icon?: typeof RefreshCcw; onPress: () => void };
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primaryOverlay,
          marginBottom: 20,
        }}
      >
        <Heart size={38} color={colors.primary} strokeWidth={1.6} />
      </View>
      <Txt variant="section" colors={colors} style={{ textAlign: 'center', marginBottom: 6 }}>
        {title}
      </Txt>
      <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center', marginBottom: 20 }}>
        {message}
      </Txt>
      <Button label={action.label} icon={action.icon} fullWidth={false} onPress={action.onPress} colors={colors} />
    </View>
  );
}
