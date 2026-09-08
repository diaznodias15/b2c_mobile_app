import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Animated, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CircleQuestionMark,
  ClipboardList,
  Ellipsis,
  House,
  LayoutGrid,
  Search,
  ShoppingCart,
  UserRound,
} from 'lucide-react-native';

import { useConfigStore } from '@/store/config.store';
import { useCartStore, selectCartCount } from '@/store/cart.store';

const NAV_TABS = [
  { label: 'Inicio', href: '/', icon: House },
  { label: 'Departamentos', href: '/departments', icon: LayoutGrid },
  { label: 'Buscar', href: '/search', icon: Search },
  { label: 'Carrito', href: '/cart', icon: ShoppingCart },
] as const;

const MORE_MENU = [
  { label: 'Perfil', href: '/profile', icon: UserRound },
  { label: 'Pedidos', href: '/orders', icon: ClipboardList },
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
  const colors = useConfigStore((s) => s.getThemeColors());
  const cartCount = useCartStore(selectCartCount);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  const isMoreActive = MORE_ROUTES.includes(pathname);

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
        const iconColor = active ? colors.primary : colors.muted;

        return (
          <Pressable
            key={tab.href}
            onPress={() => router.replace(tab.href as any)}
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
                backgroundColor: active ? colors.primary : 'transparent',
                marginBottom: 4,
              }}
            />
            <View>
              <Icon size={22} color={iconColor} />
              {tab.href === '/cart' && cartCount > 0 && (
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
            </View>
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
            backgroundColor: isMoreActive ? colors.primary : 'transparent',
            marginBottom: 4,
          }}
        />
        <Ellipsis size={22} color={isMoreActive ? colors.primary : colors.muted} />
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontWeight: isMoreActive ? '600' : '400',
            color: isMoreActive ? colors.primary : colors.muted,
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
