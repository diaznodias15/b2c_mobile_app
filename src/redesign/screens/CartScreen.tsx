import { useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react-native';

import { ModalCartWorkingHours } from '@/components/ModalCartWorkingHours';
import { ModalClearCart } from '@/components/ModalClearCart';
import { ModuleMaintenance } from '@/components/ModuleMaintenance';
import { useCartTimer } from '@/hooks/useCartTimer';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { useSafePush } from '@/hooks/useSafePush';
import { selectEffectiveBranch, selectEffectiveBranchId, useBranchStore } from '@/store/branch.store';
import { cartClearKey, useCartStore } from '@/store/cart.store';
import { useCartTimerStore } from '@/store/cartTimer.store';
import { isModuleEnabled, useConfigStore, useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';
import { hasStockIssue } from '@/utils/cartStock';
import { getCartSummary } from '@/utils/pricing';

import { BottomTabs } from '../components/bottom-tabs';
import { CartLineItem, StockAlert } from '../components/CartLineItem';
import { CartSummaryCard } from '../components/CartSummaryCard';
import { CartTimer } from '../components/CartTimer';
import { Button } from '../ui/Button';
import { Txt } from '../ui/Txt';

/**
 * Carrito del rediseño. Copia TAL CUAL la lógica de `cart.tsx` (filtro por sede activa,
 * `refreshFromServer` al entrar y tras el login, bloqueo del pago con operaciones en
 * vuelo o stock excedido, timer de reserva solo con la pantalla enfocada, aviso de
 * horarios una vez por sede, vaciado con confirmación) y cambia la presentación:
 *
 *  - Barra de pago fija abajo con el **Total** como dato principal y el desglose plegable
 *    (la barra del original ocupaba ~230 px con todo el desglose a la vista).
 *  - Cada línea con stepper y "quitar" de 48 dp (ver `CartLineItem`).
 *  - "Seguir comprando" y "Vaciar carrito" como botones de 48 dp, no como textos de 13 px.
 *  - Estado vacío con un CTA de 48 dp.
 */
export default function CartScreen() {
  const push = useSafePush();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const branchId = useBranchStore(selectEffectiveBranchId);
  const refreshControl = useRefreshControl();
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  // Carrito acotado a la sede activa: los precios/stock son por sede. `items` es la
  // referencia estable del store; se filtra con useMemo (no con un selector inline, que
  // armaría un array nuevo en cada notificación: anti-patrón de Zustand de AGENTS.md).
  const items = useCartStore((s) => s.items);
  const cartItems = useMemo(() => items.filter((item) => item.branch_id === branchId), [items, branchId]);
  const cartSummary = useMemo(() => getCartSummary(cartItems), [cartItems]);

  const { displayCurrency, exchangeRate } = useDisplayCurrency();
  const refreshFromServer = useCartStore((s) => s.refreshFromServer);
  const isSyncingLogin = useCartStore((s) => s.isSyncingLogin);
  const clearBranch = useCartStore((s) => s.clearBranch);
  // Con sesión cada operación espera a la API: mientras haya alguna en curso se bloquea el
  // pago (la orden se arma con el carrito del servidor).
  const hasPendingOps = useCartStore((s) => s.pendingKeys.length > 0);
  const isClearing = useCartStore((s) => branchId !== null && s.pendingKeys.includes(cartClearKey(branchId)));

  // Con sesión el backend arma la orden con SU carrito: al entrar (y al cambiar de sede) se
  // repone desde el servidor. Tras un login espera a que termine `syncOnLogin`.
  useEffect(() => {
    if (isAuthenticated && branchId !== null && !isSyncingLogin) void refreshFromServer(branchId);
  }, [isAuthenticated, branchId, refreshFromServer, isSyncingLogin]);

  // Hay productos con más unidades que el stock: no se puede pagar así.
  const hasStockProblem = cartItems.some(hasStockIssue);
  const checkoutBlocked = isAuthenticated && hasStockProblem;
  const ctaDisabled = checkoutBlocked || hasPendingOps;

  const appConfig = useConfigStore((s) => s.appConfig);
  const branch = useBranchStore(selectEffectiveBranch);
  const timerSeconds = appConfig?.qty_cart_seconds ?? 0;
  const timerEnabled = isAuthenticated && cartItems.length > 0 && timerSeconds > 0;
  // Al ir al checkout (push) esta pantalla queda montada debajo: sin esto su timer seguiría
  // corriendo y podría "ganar" el vencimiento. Solo corre mientras es la pantalla visible.
  const isFocused = useIsFocused();

  // Timer de reserva (solo UX: no está confirmado que el backend libere stock). Al vencer se
  // repone el carrito desde el servidor y la cuenta se reinicia.
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

  // Confirmación propia en vez del Alert nativo.
  const [clearOpen, setClearOpen] = useState(false);
  const confirmClearCart = () => {
    if (branchId !== null) setClearOpen(true);
  };
  const handleClearCart = async () => {
    if (branchId === null) return;
    // Con sesión espera a `DELETE /cart/clear`; solo avisa si el servidor aceptó.
    const cleared = await clearBranch(branchId);
    setClearOpen(false);
    if (cleared) useToastStore.getState().show('Se eliminaron los productos del carrito.');
  };

  if (!isModuleEnabled(appConfig?.is_show_cart)) {
    return <ModuleMaintenance colors={colors} insetsTop={insets.top} withTabs />;
  }

  if (cartItems.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* ScrollView (no View) para poder refrescar con swipe también con el carrito vacío. */}
        <ScrollView
          refreshControl={refreshControl}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: insets.top,
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primaryOverlay,
              marginBottom: 20,
            }}
          >
            <ShoppingCart size={42} color={colors.primary} strokeWidth={1.6} />
          </View>
          <Txt variant="section" colors={colors} style={{ textAlign: 'center', marginBottom: 6 }}>
            Tu carrito está vacío
          </Txt>
          <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center', marginBottom: 24 }}>
            Agrega productos desde el inicio o la búsqueda para verlos aquí.
          </Txt>
          <Button label="Ir a comprar" icon={ShoppingBag} fullWidth={false} onPress={() => router.replace('/')} colors={colors} />
        </ScrollView>
        <BottomTabs />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Txt variant="title" colors={colors}>
            Carrito
          </Txt>
          <Txt variant="label" color="muted" colors={colors}>
            {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Seguir comprando"
              variant="ghost"
              icon={ShoppingBag}
              onPress={() => router.replace('/')}
              colors={colors}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Vaciar carrito"
              variant="ghost"
              icon={Trash2}
              onPress={confirmClearCart}
              loading={isClearing}
              disabled={hasPendingOps}
              colors={{ ...colors, foreground: colors.danger }}
            />
          </View>
        </View>
      </View>

      {timerEnabled && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <CartTimer remainingSeconds={remainingSeconds} totalSeconds={timerSeconds} colors={colors} />
        </View>
      )}

      <FlatList
        data={cartItems}
        keyExtractor={(item) => `${item.tx_slug}-${item.branch_id}`}
        refreshControl={refreshControl}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 16 }}
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
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.productCard,
        }}
      >
        <CartSummaryCard
          summary={cartSummary}
          exchangeRate={exchangeRate}
          displayCurrency={displayCurrency}
          colors={colors}
          collapsible
        >
          {checkoutBlocked && (
            <Txt variant="label" color="danger" colors={colors} style={{ textAlign: 'center' }}>
              Ajusta las cantidades marcadas para continuar.
            </Txt>
          )}
          {!isAuthenticated && (
            <Txt variant="caption" color="muted" colors={colors} style={{ textAlign: 'center' }}>
              Inicia sesión para continuar con tu compra. Tu carrito se conserva.
            </Txt>
          )}
          <Button
            // Sin sesión el backend no deja crear la orden (el checkout exige token, igual que
            // la web): se manda a /login, que al terminar hace router.back() y regresa acá con
            // el carrito ya sincronizado.
            label={isAuthenticated ? 'Proceder al pago' : 'Iniciar sesión para continuar'}
            onPress={() => push(isAuthenticated ? '/checkout' : '/login')}
            disabled={ctaDisabled}
            colors={colors}
          />
        </CartSummaryCard>
      </View>

      <ModalCartWorkingHours
        visible={hoursOpen}
        branchName={branch?.nb_branch ?? ''}
        workingHours={workingHours}
        onClose={() => setHoursOpen(false)}
        colors={colors}
      />

      <ModalClearCart
        visible={clearOpen}
        isLoading={isClearing}
        onConfirm={handleClearCart}
        onClose={() => setClearOpen(false)}
        colors={colors}
      />

      <BottomTabs />
    </View>
  );
}
