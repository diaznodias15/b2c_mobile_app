import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/** Placeholder. Se implementa en Fase 4 con CheckoutStepper. */
export default function CartScreen() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <ThemedText type="title">Carrito</ThemedText>
          <ThemedView
            type="backgroundElement"
            style={{ padding: 16, borderRadius: 14 }}
          >
            <ThemedText type="default">
              Tu carrito y checkout — llega en Fase 4.
            </ThemedText>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}
