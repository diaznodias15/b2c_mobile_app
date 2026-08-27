import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUserStore } from '@/store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/**
 * Placeholder del Perfil. Se implementa en Fase 5 con tabs de
 * Info / Órdenes / Direcciones.
 * Por ahora muestra el user actual y permite logout.
 */
export default function ProfileScreen() {
  const user = useUserStore((s) => s.user);
  const { actions } = useAuth();

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <ThemedText type="title">Perfil</ThemedText>
          {user ? (
            <ThemedView
              type="backgroundElement"
              style={{ padding: 16, borderRadius: 14, gap: 4 }}
            >
              <ThemedText type="subtitle">{user.name ?? user.email}</ThemedText>
              <ThemedText type="default">{user.email}</ThemedText>
            </ThemedView>
          ) : (
            <ThemedView
              type="backgroundElement"
              style={{ padding: 16, borderRadius: 14 }}
            >
              <ThemedText type="default">No has iniciado sesión.</ThemedText>
            </ThemedView>
          )}

          {user ? (
            <ThemedView
              type="backgroundElement"
              style={{ padding: 16, borderRadius: 14 }}
              onTouchEnd={() => actions.signOut()}
            >
              <ThemedText type="link" style={{ color: '#dc2626' }}>
                Cerrar sesión
              </ThemedText>
            </ThemedView>
          ) : null}
        </ScrollView>
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}
