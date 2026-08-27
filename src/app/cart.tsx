import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/** Placeholder. Se implementa en Fase 4 con CheckoutStepper. */
export default function CartScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
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
  );
}
