import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import AppTabs from '@/components/app-tabs';

/**
 * Pantalla de Búsqueda.
 *
 * Stub honesto de Fase 2: input de búsqueda + mensaje indicando
 * que la búsqueda real entra en Fase 3 con el endpoint
 * `/api/products/search?product=...`.
 *
 * Mantiene la query si llegó por param (e.g. `?q=ibuprofeno`)
 * para que cuando entremos a Fase 3 la pantalla ya esté coherente.
 */
export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-4 pt-3 pb-2 flex-row items-center gap-2 border-b border-backgroundElement">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full bg-backgroundElement"
            accessibilityLabel="Volver"
          >
            <X size={18} color="#1A1A2E" />
          </Pressable>
          <View className="flex-1 flex-row items-center gap-2 bg-backgroundElement rounded-[14px] px-3 py-2">
            <SearchIcon size={18} color="#60646C" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              placeholder="¿Qué buscás?"
              placeholderTextColor="#60646C"
              className="flex-1 text-sm text-foreground"
              onSubmitEditing={() => {
                /* Fase 3: dispatch real search */
              }}
            />
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-base font-bold text-foreground text-center">
            Búsqueda
          </Text>
          <Text className="text-xs text-muted text-center mt-2">
            La búsqueda por producto, marca y filtros llega en la Fase 3.
            Por ahora podés explorar los departamentos desde Inicio.
          </Text>
        </View>
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}
