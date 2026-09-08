import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogIn, LogOut, UserRound } from 'lucide-react-native';

import { logout as logoutRequest } from '@/api/services/auth.services';
import { BottomTabs } from '@/components/bottom-tabs';
import { useThemeColors } from '@/store/config.store';
import { useToastStore } from '@/store/toast.store';
import { useUserStore } from '@/store/user.store';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const showToast = useToastStore((s) => s.show);
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const signOut = useUserStore((s) => s.signOut);

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logoutRequest();
    } finally {
      await signOut();
      setIsSigningOut(false);
      showToast('Sesión cerrada');
    }
  };

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
          <UserRound size={40} color={colors.primary} strokeWidth={1.6} />
        </View>

        {isAuthenticated && user ? (
          <>
            <Text
              style={{
                fontSize: 19,
                fontWeight: '700',
                color: colors.foreground,
                textAlign: 'center',
                marginBottom: 4,
              }}
            >
              {user.name ?? user.email}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 28 }}>
              {user.email}
            </Text>

            <Pressable
              onPress={handleSignOut}
              disabled={isSigningOut}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 999,
                backgroundColor: colors.section,
                opacity: isSigningOut ? 0.7 : 1,
              }}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
            >
              {isSigningOut ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <LogOut size={16} color={colors.danger} />
              )}
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.danger }}>
                Cerrar sesión
              </Text>
            </Pressable>
          </>
        ) : (
          <>
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
            <Text
              style={{ fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 24 }}
            >
              Iniciá sesión para ver tu perfil y completar tus compras.
            </Text>
            <Pressable
              onPress={() => router.push('/login')}
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
          </>
        )}
      </View>
      <BottomTabs />
    </View>
  );
}
