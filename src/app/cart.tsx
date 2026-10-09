import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image as RNImage, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useIsFocused, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Info, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react-native';

import { useSafePush } from '@/hooks/useSafePush';
import { BottomTabs } from '@/components/bottom-tabs';
import { CartMaintenance } from '@/components/CartMaintenance';
import { CartSummaryCard } from '@/components/CartSummaryCard';
import { CartTimer } from '@/components/CartTimer';
import { DiscountBadge } from '@/components/DiscountBadge';
import { ModalCartWorkingHours } from '@/components/ModalCartWorkingHours';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useCartTimer } from '@/hooks/useCartTimer';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { useBranchStore, selectEffectiveBranch, selectEffectiveBranchId } from '@/store/branch.store';
import { useCartTimerStore } from '@/store/cartTimer.store';
import { cartClearKey, cartLineKey, useCartStore } from '@/store/cart.store';
import { isCartModuleEnabled, useConfigStore, useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';
import { getAvailableUnits, getMaxQuantity, hasStockIssue } from '@/utils/cartStock';
import { formatDisplayPrice } from '@/utils/currency';
import { getCartLinePricing, getCartSummary } from '@/utils/pricing';
import { UNAVAILABLE_PRODUCT_IMAGE } from '@/utils/localImages.generated';
import { hexToRgba } from '@/theme/colors';
import type { ThemeColors } from '@/theme/colors';
import type { CartItem } from '@/types/cart';

const MAX_QTY = 99;
/** Data URI base64 embebido (ver el comentario largo en `ProductCard.tsx`). */
const PLACEHOLDER_IMAGE = { uri: UNAVAILABLE_PRODUCT_IMAGE };

export default function CartScreen() {
  const push = useSafePush();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const branchId = useBranchStore(selectEffectiveBranchId);
  const refreshControl = useRefreshControl();
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  // Carrito acotado a la sede activa: los precios/stock son por sede,
  // así que mezclar items de sedes distintas en un mismo total no
  // tendría sentido. `items` es la referencia estable del store — se
  // filtra acá con useMemo en vez de un selector inline (que armaría un
  // array nuevo en cada notificación del store, el mismo anti-patrón de
  // Zustand documentado en AGENTS.md).
  const items = useCartStore((s) => s.items);
  const cartItems = useMemo(
    () => items.filter((item) => item.branch_id === branchId),
    [items, branchId]
  );
  const cartSummary = useMemo(() => getCartSummary(cartItems), [cartItems]);

  const { displayCurrency, exchangeRate } = useDisplayCurrency();
  const refreshFromServer = useCartStore((s) => s.refreshFromServer);
  const clearBranch = useCartStore((s) => s.clearBranch);
  // Con sesión cada operación espera a la API: mientras haya alguna en curso se
  // bloquea el pago (la orden se arma con el carrito del servidor).
  const hasPendingOps = useCartStore((s) => s.pendingKeys.length > 0);
  const isClearing = useCartStore((s) => branchId !== null && s.pendingKeys.includes(cartClearKey(branchId)));

  // Con sesión el backend arma la orden con SU carrito, no con el local: al
  // entrar (y al cambiar de sede) se repone desde el servidor para ver precios,
  // stock y cantidades reales.
  useEffect(() => {
    if (isAuthenticated && branchId !== null) void refreshFromServer(branchId);
  }, [isAuthenticated, branchId, refreshFromServer]);

  // Hay productos con más unidades que el stock: no se puede pagar así.
  const hasStockProblem = cartItems.some(hasStockIssue);
  const checkoutBlocked = isAuthenticated && hasStockProblem;
  const ctaDisabled = checkoutBlocked || hasPendingOps;

  const appConfig = useConfigStore((s) => s.appConfig);
  const branch = useBranchStore(selectEffectiveBranch);
  const timerSeconds = appConfig?.qty_cart_seconds ?? 0;
  const timerEnabled = isAuthenticated && cartItems.length > 0 && timerSeconds > 0;
  // Al ir al checkout (push) esta pantalla queda montada debajo: sin esto su timer
  // seguiría corriendo y podría "ganar" el vencimiento, impidiendo que el checkout
  // vuelva al carrito. Solo corre mientras es la pantalla visible.
  const isFocused = useIsFocused();

  // Timer de reserva (solo UX: no está confirmado que el backend libere stock).
  // Al vencer se repone el carrito desde el servidor y la cuenta se reinicia.
  const remainingSeconds = useCartTimer({
    enabled: timerEnabled && isFocused,
    totalSeconds: timerSeconds,
    onExpire: () => {
      if (branchId !== null) void refreshFromServer(branchId);
      useToastStore.getState().show('Se actualizó tu carrito porque venció el tiempo de reserva.');
    },
  });

  // Aviso de horarios: 1 s después de entrar, una vez por sede y sesión.
  const [hoursOpen, setHoursOpen] = useState(false);
  const workingHours = branch?.tx_working_hours?.trim() ?? '';
  const branchValue = branch?.value ?? null;
  const hasItems = cartItems.length > 0;
  useEffect(() => {
    if (branchValue === null || !workingHours || !hasItems) return;
    if (useCartTimerStore.getState().workingHoursShownFor.includes(branchValue)) return;
    const id = setTimeout(() => {
      useCartTimerStore.getState().markWorkingHoursShown(branchValue);
      setHoursOpen(true);
    }, 1000);
    return () => clearTimeout(id);
  }, [branchValue, workingHours, hasItems]);

  const confirmClearCart = () => {
    if (branchId === null) return;
    Alert.alert(
      'Vaciar carrito',
      'Se eliminarán todos los productos de tu carrito. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar todo',
          style: 'destructive',
          onPress: async () => {
            // Con sesión espera a `DELETE /cart/clear`; solo avisa si el servidor aceptó.
            const cleared = await clearBranch(branchId);
            if (cleared) useToastStore.getState().show('Se eliminaron los productos del carrito.');
          },
        },
      ]
    );
  };

  if (!isCartModuleEnabled(appConfig?.is_show_cart)) {
    return <CartMaintenance colors={colors} insetsTop={insets.top} withTabs />;
  }

  if (cartItems.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: insets.top,
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primaryOverlaySoft,
              marginBottom: 20,
            }}
          >
            <ShoppingCart size={40} color={colors.primary} strokeWidth={1.6} />
          </View>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            Tu carrito está vacío
          </Text>
          <Text
            style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 24 }}
          >
            Agregá productos desde el inicio o la búsqueda para verlos acá.
          </Text>
          <Pressable
            onPress={() => router.replace('/')}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 999,
              backgroundColor: colors.primary,
            }}
            accessibilityRole="button"
            accessibilityLabel="Ir a comprar"
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.onPrimary }}>
              Ir a comprar
            </Text>
          </Pressable>
        </View>
        <BottomTabs />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.foreground }}>Carrito</Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={() => router.replace('/')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingVertical: 7,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: colors.section,
            }}
            accessibilityRole="button"
            accessibilityLabel="Seguir comprando"
          >
            <ShoppingBag size={14} color={colors.foreground} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>Seguir comprando</Text>
          </Pressable>
          <Pressable
            onPress={confirmClearCart}
            disabled={isClearing || hasPendingOps}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, opacity: hasPendingOps ? 0.6 : 1 }}
            accessibilityRole="button"
            accessibilityLabel="Vaciar carrito"
            accessibilityState={{ busy: isClearing }}
          >
            {isClearing ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Trash2 size={14} color={colors.danger} />
            )}
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.danger }}>Vaciar carrito</Text>
          </Pressable>
        </View>
      </View>

      {timerEnabled && (
        <View style={{ paddingHorizontal: 24, paddingBottom: 10 }}>
          <CartTimer remainingSeconds={remainingSeconds} totalSeconds={timerSeconds} colors={colors} />
        </View>
      )}

      <FlatList
        data={cartItems}
        keyExtractor={(item) => `${item.tx_slug}-${item.branch_id}`}
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 10, paddingBottom: 16 }}
        renderItem={({ item }) => (
          // La alerta va FUERA de la card (hermana) para no deformar su alto.
          <View style={{ gap: 6 }}>
            <CartLineItem item={item} colors={colors} />
            {hasStockIssue(item) && <StockAlert item={item} colors={colors} />}
          </View>
        )}
      />

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <CartSummaryCard
          summary={cartSummary}
          exchangeRate={exchangeRate}
          displayCurrency={displayCurrency}
          colors={colors}
        >
          {checkoutBlocked && (
            <Text style={{ fontSize: 13, color: colors.danger, textAlign: 'center' }}>
              Ajusta las cantidades marcadas para continuar.
            </Text>
          )}
          {!isAuthenticated && (
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>
              Inicia sesión para continuar con tu compra. Tu carrito se conserva.
            </Text>
          )}
          <Pressable
            // Sin sesión el backend no deja crear la orden (el checkout exige
            // token, igual que la web): se manda a /login, que al terminar
            // hace router.back() y regresa acá con el carrito ya sincronizado.
            onPress={() => push(isAuthenticated ? '/checkout' : '/login')}
            disabled={ctaDisabled}
            style={{
              height: 48,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: ctaDisabled ? colors.border : colors.primary,
            }}
            accessibilityRole="button"
            accessibilityLabel={isAuthenticated ? 'Proceder al pago' : 'Iniciar sesión para continuar'}
          >
            <Text
              style={{ fontSize: 15, fontWeight: '700', color: ctaDisabled ? colors.muted : colors.onPrimary }}
            >
              {isAuthenticated ? 'Proceder al pago' : 'Iniciar sesión para continuar'}
            </Text>
          </Pressable>
        </CartSummaryCard>
      </View>

      <ModalCartWorkingHours
        visible={hoursOpen}
        branchName={branch?.nb_branch ?? ''}
        workingHours={workingHours}
        onClose={() => setHoursOpen(false)}
        colors={colors}
      />

      <BottomTabs />
    </View>
  );
}

function CartLineItem({ item, colors }: { item: CartItem; colors: ThemeColors }) {
  const push = useSafePush();
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeProduct = useCartStore((s) => s.removeProduct);
  // Hay una operación de ESTA línea esperando a la API: loader y botones bloqueados.
  const isPending = useCartStore((s) => s.pendingKeys.includes(cartLineKey(item.branch_id, item.tx_slug)));
  const { displayCurrency, exchangeRate } = useDisplayCurrency();

  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !item.tx_img_url || imageFailed;
  // Con la cantidad actual: la fila se recalcula al instante al tocar +/−.
  const pricing = getCartLinePricing(item);
  const fmt = (amount: number) => formatDisplayPrice(amount, exchangeRate, displayCurrency);

  const handleRemove = async () => {
    // Con sesión espera a `DELETE`; el toast solo sale si el servidor aceptó.
    const removed = await removeProduct(item.tx_slug, item.branch_id);
    if (removed) useToastStore.getState().show('El producto ha sido eliminado del carrito.');
  };

  return (
    <Pressable
      onPress={() => push(`/product/${item.tx_slug}`)}
      style={{
        flexDirection: 'row',
        gap: 12,
        backgroundColor: colors.productCard,
        borderRadius: 14,
        padding: 10,
        shadowColor: colors.shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 6,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${item.nb_product}`}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: colors.section,
        }}
      >
        {showPlaceholder ? (
          <RNImage
            source={PLACEHOLDER_IMAGE}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={{ uri: item.tx_img_url ?? undefined }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            onError={() => setImageFailed(true)}
          />
        )}
        {pricing.hasDiscount && (
          <View style={{ position: 'absolute', top: 3, left: 3 }}>
            <DiscountBadge percent={Math.round(pricing.discountPercent)} colors={colors} size="sm" />
          </View>
        )}
      </View>

      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Text
            numberOfLines={1}
            style={{ fontSize: 11, fontWeight: '600', color: colors.muted, marginBottom: 2 }}
          >
            {item.nb_brand}
          </Text>
          <Text
            numberOfLines={2}
            style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, lineHeight: 17 }}
          >
            {item.nb_product}
          </Text>
        </View>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 6 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>{fmt(pricing.lineTotal)}</Text>
            {pricing.hasDiscount && (
              <Text style={{ fontSize: 11, color: colors.muted, textDecorationLine: 'line-through' }}>
                {fmt(pricing.lineBase)}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 11, color: colors.muted }}>
            {item.qty} × {fmt(pricing.unitPrice)}
            {pricing.lineTax > 0 ? ` · IVA inc. ${fmt(pricing.lineTax)}` : ''}
          </Text>
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => void handleRemove()}
          disabled={isPending}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${item.nb_product} del carrito`}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Trash2 size={18} color={colors.danger} />
          )}
        </Pressable>
        <QuantityStepper
          value={item.qty}
          max={getMaxQuantity(item, MAX_QTY)}
          onChange={(qty) => void updateQuantity(item.tx_slug, item.branch_id, qty)}
          onRemove={() => void handleRemove()}
          loading={isPending}
          colors={colors}
        />
      </View>
    </Pressable>
  );
}

/** Aviso bajo la card cuando se pidió más de lo disponible (igual que `AvailabilityAlert` de la web). */
function StockAlert({ item, colors }: { item: CartItem; colors: ThemeColors }) {
  const available = getAvailableUnits(item) ?? 0;
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        backgroundColor: hexToRgba(colors.danger, 0.1),
        borderRadius: 10,
        padding: 10,
      }}
      accessibilityRole="alert"
    >
      <Info size={16} color={colors.danger} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, fontSize: 12, lineHeight: 17, color: colors.foreground }}>
        {available === 0 ? (
          <>
            <Text style={{ fontWeight: '700' }}>Producto no disponible: </Text>
            ya no hay existencias en esta sede. Quítalo del carrito para continuar.
          </>
        ) : (
          <>
            <Text style={{ fontWeight: '700' }}>Cantidad no disponible: </Text>
            solo hay {available} {available === 1 ? 'unidad disponible' : 'unidades disponibles'}. Has agregado{' '}
            {item.qty}. Ajusta la cantidad.
          </>
        )}
      </Text>
    </View>
  );
}
