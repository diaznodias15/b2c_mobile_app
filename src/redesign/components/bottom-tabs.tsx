import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Animated, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReanimatedAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  ChevronRight,
  CircleQuestionMark,
  Ellipsis,
  House,
  LayoutGrid,
  LogIn,
  MapPin,
  Search,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';

import { BranchSelectorModal } from '@/components/BranchSelectorModal';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useSafePush } from '@/hooks/useSafePush';
import { selectEffectiveBranch, useBranchStore } from '@/store/branch.store';
import { useCartStore, selectCartCount } from '@/store/cart.store';
import { useThemeColors } from '@/store/config.store';
import { useCurrencyStore, type DisplayCurrency } from '@/store/currency.store';
import { useFlyingCartStore } from '@/store/flyingCart.store';
import { useUserStore } from '@/store/user.store';
import type { ThemeColors } from '@/theme/colors';
import { formatPrice } from '@/utils/currency';

import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';

/**
 * "Departamentos" se muestra como "Categorías": con el mínimo de 12 px la palabra
 * completa no cabe en un quinto del ancho de un teléfono de 360 dp y se cortaba.
 * La etiqueta accesible sigue siendo la del destino ("Departamentos").
 */
const NAV_TABS: readonly { label: string; a11yLabel: string; href: string; icon: LucideIcon }[] = [
  { label: 'Inicio', a11yLabel: 'Inicio', href: '/', icon: House },
  { label: 'Categorías', a11yLabel: 'Departamentos', href: '/departments', icon: LayoutGrid },
  { label: 'Buscar', a11yLabel: 'Buscar', href: '/search', icon: Search },
  { label: 'Carrito', a11yLabel: 'Carrito', href: '/cart', icon: ShoppingCart },
];

/**
 * "Pedidos" (`/orders`) NO vive acá a propósito — se accede solo desde el perfil
 * (`ProfileActionCard` "Mis órdenes"), con push + swipe-back (ver `_layout.tsx`).
 */
const MORE_MENU: readonly { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Perfil', href: '/profile', icon: UserRound },
  { label: 'Ayuda', href: '/help', icon: CircleQuestionMark },
];

const MORE_ROUTES = MORE_MENU.map((item) => item.href);

/**
 * Barra de tabs inferior del rediseño. **Mismo contrato que `@/components/bottom-tabs`**
 * (`BottomTabs` sin props) y misma lógica sensible: navegación con `router.replace` (no
 * re-navega a la tab activa), medición del icono del carrito para la animación
 * "flying to cart" y rebote del icono al aterrizar.
 *
 * Qué cambia:
 *  - Estado activo con una píldora detrás del icono (no solo una rayita de 3 px) y
 *    etiqueta en negrita: se distingue sin depender del color.
 *  - Etiquetas de 12 px (eran 11), iconos de 24, badge del carrito de 20 px con número
 *    de 12 px y anunciado por el lector de pantalla.
 *  - Tabs inactivas en `muted` (el `secondary` del whitelabel quedaba en un azul claro
 *    con poco contraste sobre blanco).
 *  - "Ver más": hoja con filas de 56 dp, selector de moneda de 48 dp y la tasa vigente.
 */
export function BottomTabs() {
  const router = useRouter();
  const push = useSafePush();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const cartCount = useCartStore(selectCartCount);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const displayCurrency = useCurrencyStore((s) => s.displayCurrency);
  const setDisplayCurrency = useCurrencyStore((s) => s.setDisplayCurrency);
  const { exchangeRate } = useDisplayCurrency();
  const setCartIconPosition = useFlyingCartStore((s) => s.setCartIconPosition);
  const bounceSignal = useFlyingCartStore((s) => s.bounceSignal);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const branch = useBranchStore(selectEffectiveBranch);
  const branchName = branch ? (branch.tx_alias ?? branch.label) : null;
  // `useState` con inicializador (y no `useRef(...).current`): el valor animado se crea una sola
  // vez sin leer un ref durante el render.
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [sheetTranslateY] = useState(() => new Animated.Value(400));
  const cartIconRef = useRef<View>(null);
  const bounceScale = useSharedValue(1);
  const isFirstBounce = useRef(true);

  const isMoreActive = MORE_ROUTES.includes(pathname);

  // "Flying to cart" hace rebotar el icono al aterrizar (`bounceSignal` cambia en
  // `clearFly`); se salta el primer render para no rebotar solo porque el store ya existía.
  useEffect(() => {
    if (isFirstBounce.current) {
      isFirstBounce.current = false;
      return;
    }
    bounceScale.value = withSequence(
      withTiming(1.35, { duration: 120 }),
      withTiming(1, { duration: 180 })
    );
  }, [bounceSignal, bounceScale]);

  const cartIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounceScale.value }],
  }));

  useEffect(() => {
    if (!isMoreOpen) return;
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(400);
    Animated.parallel([
      Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(sheetTranslateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [isMoreOpen, backdropOpacity, sheetTranslateY]);

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.bottomNavbar,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 6,
        paddingBottom: insets.bottom + 4,
      }}
    >
      {NAV_TABS.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        const iconColor = active ? colors.primaryBottomNavbar : colors.muted;
        const isCart = tab.href === '/cart';

        const icon = <Icon size={24} color={iconColor} strokeWidth={active ? 2.4 : 2} />;

        return (
          <TabItem
            key={tab.href}
            label={tab.label}
            accessibilityLabel={
              isCart && cartCount > 0
                ? `${tab.a11yLabel}, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}`
                : tab.a11yLabel
            }
            active={active}
            colors={colors}
            // Tocar la tab ya activa no debe re-navegar: `router.replace` re-monta la
            // pantalla igual y resetea el estado local (p. ej. el texto de Buscar).
            onPress={() => !active && router.replace(tab.href as any)}
          >
            {isCart ? (
              <ReanimatedAnimated.View
                ref={cartIconRef}
                onLayout={() => {
                  cartIconRef.current?.measureInWindow((x, y, width, height) => {
                    setCartIconPosition({ x: x + width / 2, y: y + height / 2 });
                  });
                }}
                style={cartIconAnimatedStyle}
              >
                {icon}
                {cartCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      right: -10,
                      top: -8,
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 5,
                      backgroundColor: colors.danger,
                      borderWidth: 2,
                      borderColor: colors.bottomNavbar,
                    }}
                  >
                    <Txt
                      variant="caption"
                      colors={colors}
                      style={{ color: '#FFFFFF', fontWeight: '700', lineHeight: 16 }}
                      maxFontSizeMultiplier={1}
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </Txt>
                  </View>
                )}
              </ReanimatedAnimated.View>
            ) : (
              icon
            )}
          </TabItem>
        );
      })}

      <TabItem
        label="Ver más"
        accessibilityLabel="Ver más"
        active={isMoreActive}
        colors={colors}
        onPress={() => setIsMoreOpen(true)}
      >
        <Ellipsis
          size={24}
          color={isMoreActive ? colors.primaryBottomNavbar : colors.muted}
          strokeWidth={isMoreActive ? 2.4 : 2}
        />
      </TabItem>

      <Modal
        visible={isMoreOpen}
        transparent
        animationType="none"
        onRequestClose={() => setIsMoreOpen(false)}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setIsMoreOpen(false)}
          accessibilityLabel="Cerrar menú"
        >
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              opacity: backdropOpacity,
            }}
          />
        </Pressable>
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY: sheetTranslateY }],
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              marginBottom: 14,
            }}
          />
          <Txt variant="section" colors={colors} style={{ marginBottom: 16 }}>
            Más opciones
          </Txt>

          {branchName && (
            <Pressable
              onPress={() => {
                // Se cierra la hoja antes de abrir el selector: dos `Modal` de RN a la vez
                // se tapan o no se muestran bien en iOS.
                setIsMoreOpen(false);
                setIsBranchOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Sede actual: ${branchName}. Cambiar de sede`}
              style={({ pressed }) => ({
                minHeight: 56,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 12,
                marginBottom: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.section,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MapPin size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Txt variant="caption" color="muted" colors={colors}>
                  Sede actual
                </Txt>
                <Txt variant="label" colors={colors} numberOfLines={1}>
                  {branchName}
                </Txt>
              </View>
              <Txt variant="label" colors={colors} style={{ color: colors.primary }}>
                Cambiar
              </Txt>
            </Pressable>
          )}

          <Txt variant="label" color="muted" colors={colors} style={{ marginBottom: 8 }}>
            Moneda de precios
          </Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <CurrencyOption
              label="Bs."
              value="Bs."
              active={displayCurrency === 'Bs.'}
              colors={colors}
              onPress={setDisplayCurrency}
            />
            <CurrencyOption
              label="REF"
              value="REF"
              active={displayCurrency === 'REF'}
              colors={colors}
              onPress={setDisplayCurrency}
            />
          </View>
          {exchangeRate != null && exchangeRate > 0 && (
            <Txt variant="caption" color="muted" colors={colors} style={{ marginTop: 8 }}>
              Tasa de referencia: 1 REF = {formatPrice(exchangeRate, 'Bs.')}
            </Txt>
          )}

          <View style={{ marginTop: 12 }}>
            {MORE_MENU.map((item) => {
              // "Perfil" cambia según la sesión: logueado → "Mi perfil" (/profile); sin
              // sesión → "Iniciar sesión", que va directo a /login (ruta del stack, con
              // push) en vez de a un perfil vacío.
              const isProfile = item.href === '/profile';
              const goesToLogin = isProfile && !isAuthenticated;
              const label = isProfile ? (isAuthenticated ? 'Mi perfil' : 'Iniciar sesión') : item.label;
              const Icon = goesToLogin ? LogIn : item.icon;
              return (
                <Pressable
                  key={item.href}
                  onPress={() => {
                    setIsMoreOpen(false);
                    if (goesToLogin) push('/login');
                    else router.replace(item.href as any);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Icon size={22} color={colors.foreground} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="body" colors={colors}>
                      {label}
                    </Txt>
                  </View>
                  <ChevronRight size={20} color={colors.muted} />
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Modal>

      <BranchSelectorModal
        visible={isBranchOpen}
        onClose={() => setIsBranchOpen(false)}
        colors={colors}
      />
    </View>
  );
}

/**
 * Una tab: píldora de estado activo detrás del icono + etiqueta. El `children` es el
 * icono ya coloreado (el carrito lo envuelve en su vista animada y con badge).
 */
function TabItem({
  label,
  accessibilityLabel,
  active,
  colors,
  onPress,
  children,
}: {
  label: string;
  accessibilityLabel: string;
  active: boolean;
  colors: ThemeColors;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      style={{ flex: 1, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: 56,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? colors.primaryOverlay : 'transparent',
        }}
      >
        {children}
      </View>
      <Txt
        variant="caption"
        colors={colors}
        numberOfLines={1}
        style={{
          marginTop: 2,
          fontWeight: active ? '700' : '500',
          color: active ? colors.primaryBottomNavbar : colors.muted,
        }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}

function CurrencyOption({
  label,
  value,
  active,
  colors,
  onPress,
}: {
  label: string;
  value: DisplayCurrency;
  active: boolean;
  colors: ThemeColors;
  onPress: (value: DisplayCurrency) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(value)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Mostrar precios en ${label}`}
      style={{
        flex: 1,
        minHeight: MIN_TOUCH,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: active ? 0 : 1,
        borderColor: colors.border,
        backgroundColor: active ? colors.primary : colors.section,
      }}
    >
      <Txt variant="label" colors={colors} style={{ color: active ? colors.onPrimary : colors.foreground }}>
        {label}
      </Txt>
    </Pressable>
  );
}
