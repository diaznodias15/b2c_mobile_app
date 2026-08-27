import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogIn, LogOut, User as UserIcon, Package } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import AppTabs from '@/components/app-tabs';
import { useUserStore } from '@/store';

/**
 * Pantalla de Perfil (stub honesto).
 *
 * Si el usuario está logueado: muestra su email y un placeholder
 * "Tus órdenes llegan en Fase 5".
 *
 * Si no está logueado: CTA "Iniciar sesión" que navega al
 * modal de Login.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const user = useUserStore((s) => s.user);
  const signOut = useUserStore((s) => s.signOut);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-4 pt-3 pb-1">
          <Text className="text-xl font-bold text-foreground">Perfil</Text>
        </View>
        <View className="flex-1 px-4 pt-4">
          {isAuthenticated && user ? (
            <View className="gap-4">
              <View className="flex-row items-center gap-3 bg-backgroundElement rounded-[14px] p-4">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
                  <UserIcon size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">
                    {user.name || user.email}
                  </Text>
                  <Text className="text-xs text-muted">{user.email}</Text>
                </View>
              </View>
              <View className="bg-backgroundElement rounded-[14px] p-4 gap-2">
                <View className="flex-row items-center gap-2">
                  <Package size={16} color="#60646C" />
                  <Text className="text-sm font-semibold text-foreground">
                    Mis órdenes
                  </Text>
                </View>
                <Text className="text-xs text-muted">
                  El historial de pedidos llega en la Fase 5.
                </Text>
              </View>
              <Pressable
                onPress={() => void signOut()}
                className="flex-row items-center justify-center gap-2 bg-danger rounded-[14px] py-3 mt-2"
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
              >
                <LogOut size={16} color="#FFFFFF" />
                <Text className="text-sm font-bold text-primary-foreground">
                  Cerrar sesión
                </Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center gap-3">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-backgroundElement">
                <UserIcon size={28} color="#60646C" />
              </View>
              <Text className="text-base font-bold text-foreground text-center">
                No has iniciado sesión
              </Text>
              <Text className="text-xs text-muted text-center px-4">
                Iniciá sesión para ver tus órdenes, direcciones guardadas y
                hacer seguimiento de tus pedidos.
              </Text>
              <Pressable
                onPress={() => router.push('/login')}
                className="mt-3 flex-row items-center gap-2 bg-primary rounded-[14px] py-3 px-6"
                accessibilityRole="button"
              >
                <LogIn size={16} color="#FFFFFF" />
                <Text className="text-sm font-bold text-primary-foreground">
                  Iniciar sesión
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}
