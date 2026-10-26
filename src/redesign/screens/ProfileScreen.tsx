import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Heart, KeyRound, LogIn, LogOut, Package, User } from 'lucide-react-native';

import { logout as logoutRequest } from '@/api/services/auth.services';
import { ModuleMaintenance } from '@/components/ModuleMaintenance';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { useSafePush } from '@/hooks/useSafePush';
import { isModuleEnabled, useConfigStore, useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';
import type { ThemeColors } from '@/theme/colors';

import { BottomTabs } from '../components/bottom-tabs';
import { ModalLogout } from '../components/ModalLogout';
import { ModalResetPassword } from '../components/ModalResetPassword';
import { ProfileHeader } from '../components/ProfileHeader';
import { Button } from '../ui/Button';
import { Surface } from '../ui/Surface';
import { MIN_TOUCH } from '../ui/tokens';
import { Txt } from '../ui/Txt';

/**
 * Perfil del rediseño. Misma lógica que `profile.tsx` (revalida con `refreshUser` al abrir; cerrar
 * sesión pide confirmación, llama al backend y haga lo que haga cierra la sesión local; cambiar
 * contraseña en un modal; `is_show_user = 0` muestra "Módulo en mantenimiento"; sin sesión, el
 * estado "No iniciaste sesión") con otra estructura:
 *
 *  - Cabecera compacta (avatar + nombre + correo en una fila).
 *  - Los accesos pasan de una fila de 3 tarjetas de 12.5 px (una de ellas, "Información
 *    personal", no hacía nada) a una **lista de filas de 56 dp** con chevron: "Mis órdenes" y
 *    "Cambiar contraseña".
 *  - "Información personal" como lista etiquetada de solo lectura.
 *  - "Cerrar sesión" como botón propio al final, separado de los accesos para que no se toque
 *    por error, en vez de una tarjeta más del mismo tamaño.
 */
export default function ProfileScreen() {
  const push = useSafePush();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const refreshControl = useRefreshControl();
  const showToast = useToastStore((s) => s.show);
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const signOut = useUserStore((s) => s.signOut);
  const refreshUser = useUserStore((s) => s.refreshUser);
  const appConfig = useConfigStore((s) => s.appConfig);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  // Al abrir el perfil se revalidan los datos con `/auth/me` (el store solo guarda lo que llegó
  // en el login). No-op sin sesión.
  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logoutRequest();
    } finally {
      await signOut();
      setIsSigningOut(false);
      setIsLogoutModalOpen(false);
      showToast('Sesión cerrada');
    }
  };

  // `is_show_user = 0`: el admin apagó el perfil (la web muestra "Módulo en mantenimiento").
  if (!isModuleEnabled(appConfig?.is_show_user)) {
    return <ModuleMaintenance colors={colors} insetsTop={insets.top} withTabs />;
  }

  if (!isAuthenticated || !user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: insets.top,
            paddingHorizontal: 32,
            gap: 8,
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
              marginBottom: 12,
            }}
          >
            <User size={42} color={colors.primary} strokeWidth={1.6} />
          </View>
          <Txt variant="section" colors={colors} style={{ textAlign: 'center' }}>
            No iniciaste sesión
          </Txt>
          <Txt variant="body" color="muted" colors={colors} style={{ textAlign: 'center', marginBottom: 16 }}>
            Inicia sesión para ver tu perfil y completar tus compras.
          </Txt>
          <Button label="Iniciar sesión" icon={LogIn} fullWidth={false} onPress={() => push('/login')} colors={colors} />
        </View>
        <BottomTabs />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, gap: 20, paddingBottom: 32 }}
      >
        <Txt variant="title" colors={colors}>
          Mi perfil
        </Txt>

        <ProfileHeader user={user} colors={colors} />

        <Surface colors={colors} padding={0} style={{ overflow: 'hidden' }}>
          <NavRow
            icon={<Package size={22} color={colors.primary} />}
            label="Mis órdenes"
            hint="Revisa el estado de tus pedidos"
            onPress={() => push('/orders')}
            colors={colors}
          />
          <NavRow
            icon={<Heart size={22} color={colors.primary} />}
            label="Mis favoritos"
            hint="Tus productos guardados"
            onPress={() => push('/favorites')}
            colors={colors}
            bordered
          />
          <NavRow
            icon={<KeyRound size={22} color={colors.primary} />}
            label="Cambiar contraseña"
            onPress={() => setIsResetPasswordModalOpen(true)}
            colors={colors}
            bordered
          />
        </Surface>

        <View style={{ gap: 8 }}>
          <Txt variant="section" colors={colors}>
            Información personal
          </Txt>
          <Surface colors={colors} padding={0} style={{ overflow: 'hidden' }}>
            <InfoRow label="Nombre" value={user.name} colors={colors} />
            <InfoRow label="Correo" value={user.email} colors={colors} bordered />
            {user.tx_phone ? <InfoRow label="Teléfono" value={user.tx_phone} colors={colors} bordered /> : null}
          </Surface>
        </View>

        <Button
          label="Cerrar sesión"
          variant="ghost"
          icon={LogOut}
          onPress={() => setIsLogoutModalOpen(true)}
          colors={{ ...colors, foreground: colors.danger }}
        />
      </ScrollView>

      <BottomTabs />

      <ModalLogout
        visible={isLogoutModalOpen}
        isLoading={isSigningOut}
        onConfirm={handleConfirmSignOut}
        onClose={() => setIsLogoutModalOpen(false)}
        colors={colors}
      />
      <ModalResetPassword
        visible={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        colors={colors}
      />
    </View>
  );
}

function NavRow({
  icon,
  label,
  hint,
  onPress,
  colors,
  bordered,
}: {
  icon: ReactNode;
  label: string;
  hint?: string;
  onPress: () => void;
  colors: ThemeColors;
  bordered?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      style={({ pressed }) => ({
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        borderTopWidth: bordered ? 1 : 0,
        borderTopColor: colors.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: MIN_TOUCH - 4,
          height: MIN_TOUCH - 4,
          borderRadius: 12,
          backgroundColor: colors.primaryOverlay,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="label" colors={colors}>
          {label}
        </Txt>
        {hint ? (
          <Txt variant="caption" color="muted" colors={colors}>
            {hint}
          </Txt>
        ) : null}
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </Pressable>
  );
}

function InfoRow({
  label,
  value,
  colors,
  bordered,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
  bordered?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: bordered ? 1 : 0,
        borderTopColor: colors.border,
      }}
    >
      <Txt variant="label" color="muted" colors={colors} style={{ fontWeight: '500' }}>
        {label}
      </Txt>
      <View style={{ flex: 1 }}>
        <Txt variant="label" colors={colors} style={{ textAlign: 'right' }}>
          {value}
        </Txt>
      </View>
    </View>
  );
}
