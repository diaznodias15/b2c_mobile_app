import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReanimatedAnimated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import {
  CircleQuestionMark,
  Ellipsis,
  House,
  LayoutGrid,
  Search,
  ShoppingCart,
  UserRound,
} from 'lucide-react-native';

import { useThemeColors } from '@/store/config.store';
import { useCartStore, selectCartCount } from '@/store/cart.store';
import { useCurrencyStore, type DisplayCurrency } from '@/store/currency.store';
import { useFlyingCartStore } from '@/store/flyingCart.store';

const NAV_TABS = [
  { label: 'Inicio', href: '/', icon: House },
  { label: 'Departamentos', href: '/departments', icon: LayoutGrid },
  { label: 'Buscar', href: '/search', icon: Search },
  { label: 'Carrito', href: '/cart', icon: ShoppingCart },
] as const;

/**
 * "Pedidos" (`/orders`) NO vive acá a propósito — se accede solo desde
 * el perfil (`ProfileActionCard` "Mis órdenes"), con push + swipe-back
 * (ver `_layout.tsx`), no como un destino más del menú "Ver más".
 */
const MORE_MENU = [
  { label: 'Perfil', href: '/profile', icon: UserRound },
  { label: 'Ayuda', href: '/help', icon: CircleQuestionMark },
] as const;

const MORE_ROUTES = MORE_MENU.map((item) => item.href) as readonly string[];

/**
 * Barra de tabs inferior. Estilos 100% inline (NO className): Uniwind no
 * aplica de forma confiable flex-direction/align/justify/gap ni fontSize
 * en componentes RN crudos en Android (ver AGENTS.md). "Ver Más" abre un
 * <Modal> nativo de RN con la lista de accesos.
 */
export function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const cartCount = useCartStore(selectCartCount);
  const displayCurrency = useCurrencyStore((s) => s.displayCurrency);
  const setDisplayCurrency = useCurrencyStore((s) => s.setDisplayCurrency);
  const setCartIconPosition = useFlyingCartStore((s) => s.setCartIconPosition);
  const bounceSignal = useFlyingCartStore((s) => s.bounceSignal);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;
  const cartIconRef = useRef<View>(null);
  const bounceScale = useSharedValue(1);
  const isFirstBounce = useRef(true);

  const isMoreActive = MORE_ROUTES.includes(pathname);

  // "Flying to cart" hace rebotar el ícono al aterrizar (bounceSignal
  // cambia en clearFly) — se salta el primer render para no rebotar
  // solo porque el store ya existía con bounceSignal: 0.
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
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isMoreOpen, backdropOpacity, sheetTranslateY]);

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.bottomNavbar,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom,
      }}
    >
      {NAV_TABS.map((tab) => {
        const active = pathname === tab.href;
        const Icon = tab.icon;
        const iconColor = active ? colors.primaryBottomNavbar : colors.secondary;

        return (
          <Pressable
            key={tab.href}
            onPress={() => {
              // Tocar la tab ya activa no debe re-navegar: router.replace
              // re-monta la pantalla igual (mismo path o no), lo que
              // resetea cualquier state local (ej. el texto de Buscar).
              if (!active) router.replace(tab.href as any);
            }}
            style={{
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
            }}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <View
              style={{
                width: 32,
                height: 3,
                borderRadius: 2,
                backgroundColor: active ? colors.primaryBottomNavbar : 'transparent',
                marginBottom: 4,
              }}
            />
            {tab.href === '/cart' ? (
              <ReanimatedAnimated.View
                ref={cartIconRef}
                onLayout={() => {
                  cartIconRef.current?.measureInWindow((x, y, width, height) => {
                    setCartIconPosition({ x: x + width / 2, y: y + height / 2 });
                  });
                }}
                style={cartIconAnimatedStyle}
              >
                <Icon size={22} color={iconColor} />
                {cartCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      right: -8,
                      top: -4,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                      backgroundColor: colors.danger,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 10, lineHeight: 16 }}>
                      {cartCount > 99 ? '99+' : cartCount}
                    </Text>
                  </View>
                )}
              </ReanimatedAnimated.View>
            ) : (
              <View>
                <Icon size={22} color={iconColor} />
              </View>
            )}
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                fontWeight: active ? '600' : '400',
                color: iconColor,
                marginTop: 4,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        onPress={() => setIsMoreOpen(true)}
        style={{
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
        }}
        accessibilityRole="button"
        accessibilityLabel="Ver más"
      >
        <View
          style={{
            width: 32,
            height: 3,
            borderRadius: 2,
            backgroundColor: isMoreActive ? colors.primaryBottomNavbar : 'transparent',
            marginBottom: 4,
          }}
        />
        <Ellipsis size={22} color={isMoreActive ? colors.primaryBottomNavbar : colors.secondary} />
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontWeight: isMoreActive ? '600' : '400',
            color: isMoreActive ? colors.primaryBottomNavbar : colors.secondary,
            marginTop: 4,
          }}
        >
          Ver más
        </Text>
      </Pressable>

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
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY: sheetTranslateY }],
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.foreground,
              marginBottom: 12,
            }}
          >
            Más opciones
          </Text>

          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>
            Moneda de precios
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
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

          {MORE_MENU.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.href}
                onPress={() => {
                  setIsMoreOpen(false);
                  router.replace(item.href as any);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                }}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <Icon size={20} color={colors.foreground} />
                <Text style={{ fontSize: 16, color: colors.foreground }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>
      </Modal>
    </View>
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
  colors: ReturnType<typeof useThemeColors>;
  onPress: (value: DisplayCurrency) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(value)}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: active ? colors.primary : colors.section,
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Mostrar precios en ${label}`}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          color: active ? colors.onPrimary : colors.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
