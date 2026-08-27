import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

/** Placeholder. Se implementa en Fase 3 con SearchField + debounce. */
export default function SearchScreen() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
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
      <AppTabs />
    </View>
  );
}
