import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useConfigStore } from '@/store';

/**
 * Placeholder de la pantalla de Inicio.
 * La pantalla real (con publicidad, top products, departamentos) se
 * construye en Fase 2. Acá validamos que el setup de Fase 0 funciona:
 * - Providers cargados.
 * - Config del backend obtenida y persistida.
 * - Tokens del tema Soft aplicados.
 */
export default function HomeScreen() {
  const appConfig = useConfigStore((s) => s.appConfig);
  const isLoading = useConfigStore((s) => s.isLoading);
  const isError = useConfigStore((s) => s.isError);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
        <ThemedText type="title">Fase 0 — Bootstrap listo</ThemedText>

        <ThemedView
          type="backgroundElement"
          style={{ padding: 16, borderRadius: 14, gap: 8 }}
        >
          <ThemedText type="subtitle">Estado del setup</ThemedText>
          <ThemedText type="default">
            • HeroUI Native + Uniwind configurados{'\n'}
            • AsyncStorage + SecureStore listos{'\n'}
            • React Query, Zustand, axios, expo-router operativos
          </ThemedText>
        </ThemedView>

        <ThemedView
          type="backgroundElement"
          style={{ padding: 16, borderRadius: 14, gap: 8 }}
        >
          <ThemedText type="subtitle">Config del backend</ThemedText>
          {isLoading && <ThemedText type="default">Cargando…</ThemedText>}
          {isError && (
            <ThemedText type="default" style={{ color: '#dc2626' }}>
              No se pudo cargar la config. Revisá tu API_URL.
            </ThemedText>
          )}
          {appConfig && (
            <View style={{ gap: 4 }}>
              <ThemedText type="default">
                Empresa: {appConfig.tx_company_name ?? '—'}
              </ThemedText>
              <ThemedText type="default">
                RIF: {appConfig.tx_company_rif ?? '—'}
              </ThemedText>
              <ThemedText type="default">
                Teléfono: {appConfig.tx_company_phone ?? '—'}
              </ThemedText>
              <ThemedText type="default">
                Modo Lite:{' '}
                {String(appConfig.is_lite_mode ?? '0') === '1' ? 'sí' : 'no'}
              </ThemedText>
            </View>
          )}
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}
