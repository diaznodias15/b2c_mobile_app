import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyRound, LogIn, LogOut, Package, User } from 'lucide-react-native';

import { logout as logoutRequest } from '@/api/services/auth.services';
import { BottomTabs } from '@/components/bottom-tabs';
import { ModalLogout } from '@/components/ModalLogout';
import { ModalResetPassword } from '@/components/ModalResetPassword';
import { ProfileActionCard } from '@/components/ProfileActionCard';
import { ProfileHeader } from '@/components/ProfileHeader';
import { useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';
import type { ThemeColors } from '@/theme/colors';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const showToast = useToastStore((s) => s.show);
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const signOut = useUserStore((s) => s.signOut);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

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

  if (!isAuthenticated || !user) {
    return (
      <LoggedOutState colors={colors} insetsTop={insets.top} onLogin={() => router.push('/login')} />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, gap: 16, paddingBottom: 32 }}
      >
        <ProfileHeader user={user} colors={colors} />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ProfileActionCard
            icon={<User size={20} color={colors.primary} strokeWidth={2} />}
            label="Información personal"
            variant="info"
            isActive
            onPress={() => {}}
            colors={colors}
          />
          <ProfileActionCard
            icon={<Package size={20} color={colors.primary} strokeWidth={2} />}
            label="Mis órdenes"
            variant="orders"
            onPress={() => router.push('/orders')}
            colors={colors}
          />
          <ProfileActionCard
            icon={<LogOut size={20} color={colors.danger} strokeWidth={2} />}
            label="Cerrar sesión"
            variant="logout"
            onPress={() => setIsLogoutModalOpen(true)}
            colors={colors}
          />
        </View>

        <View
          style={{
            backgroundColor: colors.section,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <User size={20} color={colors.primary} strokeWidth={2} />
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>
              Información personal
            </Text>
          </View>

          <InfoRow label="Nombre" value={user.name} colors={colors} isFirst />
          <InfoRow label="Email" value={user.email} colors={colors} />
          {user.tx_phone && <InfoRow label="Teléfono" value={user.tx_phone} colors={colors} />}
          <InfoRow
            label="Contraseña"
            value="••••••••••"
            colors={colors}
            action={
              <Pressable
                onPress={() => setIsResetPasswordModalOpen(true)}
                hitSlop={8}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: colors.primaryOverlay,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel="Cambiar contraseña"
              >
                <KeyRound size={14} color={colors.primary} />
              </Pressable>
            }
          />
        </View>
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

function InfoRow({
  label,
  value,
  colors,
  action,
  isFirst = false,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
  action?: React.ReactNode;
  isFirst?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 13, color: colors.muted }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>
          {value}
        </Text>
        {action}
      </View>
    </View>
  );
}

function LoggedOutState({
  colors,
  insetsTop,
  onLogin,
}: {
  colors: ThemeColors;
  insetsTop: number;
  onLogin: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: insetsTop,
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
          <User size={40} color={colors.primary} strokeWidth={1.6} />
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
          No iniciaste sesión
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 24 }}>
          Iniciá sesión para ver tu perfil y completar tus compras.
        </Text>
        <Pressable
          onPress={onLogin}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 999,
            backgroundColor: colors.primary,
          }}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
        >
          <LogIn size={16} color={colors.onPrimary} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.onPrimary }}>
            Iniciar sesión
          </Text>
        </Pressable>
      </View>
      <BottomTabs />
    </View>
  );
}
