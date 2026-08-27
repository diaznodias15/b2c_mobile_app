import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/** Placeholder. Se implementa en Fase 2 con grid de departamentos. */
export default function CategoriesScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <ThemedText type="title">Categorías</ThemedText>
        <ThemedView
          type="backgroundElement"
          style={{ padding: 16, borderRadius: 14 }}
        >
          <ThemedText type="default">
            Vista de departamentos y categorías — llega en Fase 2.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}
