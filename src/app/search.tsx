import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/** Placeholder. Se implementa en Fase 3 con SearchField + debounce. */
export default function SearchScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <ThemedText type="title">Buscar</ThemedText>
        <ThemedView
          type="backgroundElement"
          style={{ padding: 16, borderRadius: 14 }}
        >
          <ThemedText type="default">
            Búsqueda global de productos — llega en Fase 3.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}
