import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart } from 'lucide-react-native';

import AppTabs from '@/components/app-tabs';
import { useBranchStore, useUserStore } from '@/store';

/**
 * Pantalla de Carrito (stub honesto).
 * El carrito real llega en Fase 4. Mientras tanto mostramos
 * un mensaje claro de "todavía no disponible" y CTA para
 * explorar productos desde Inicio.
 */
export default function CartScreen() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const branch = useBranchStore((s) => s.selectedBranch);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-4 pt-3 pb-1">
          <Text className="text-xl font-bold text-foreground">Carrito</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8 gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-backgroundElement">
            <ShoppingCart size={28} color="#60646C" />
          </View>
          <Text className="text-base font-bold text-foreground text-center">
            Tu carrito está vacío
          </Text>
          <Text className="text-xs text-muted text-center">
            {isAuthenticated
              ? 'Agregá productos desde Inicio o el buscador para empezar tu pedido.'
              : 'Iniciá sesión y elegí productos para armar tu pedido.'}
            {branch ? '' : ' Primero seleccioná una sede.'}
          </Text>
        </View>
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}
