import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useConfigStore } from '@/store';

/**
 * Pantalla de Inicio. Placeholder hasta Fase 2.
 * Muestra datos de la config del backend para validar el setup.
 * AppTabs se monta al final porque cada tab es una ruta independiente.
 */
export default function HomeScreen() {
  const appConfig = useConfigStore((s) => s.appConfig);
  const isLoading = useConfigStore((s) => s.isLoading);
  const isError = useConfigStore((s) => s.isError);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
          <ThemedText type="title">Fase 1 — Auth listo</ThemedText>

          <ThemedView
            type="backgroundElement"
            style={{ padding: 16, borderRadius: 14, gap: 8 }}
          >
            <ThemedText type="subtitle">Estado del setup</ThemedText>
            <ThemedText type="default">
              • HeroUI Native + Uniwind{'\n'}
              • Auth (Login, SignUp, Verify, Reset){'\n'}
              • Token en SecureStore, perfil en AsyncStorage
            </ThemedText>
          </ThemedView>

          <ThemedView
            type="backgroundElement"
            style={{ padding: 16, borderRadius: 14, gap: 8 }}
          >
            <ThemedText type="subtitle">Config del backend</ThemedText>
            {isLoading ? (
              <ThemedText type="default">Cargando…</ThemedText>
            ) : null}
            {isError ? (
              <ThemedText type="default" style={{ color: '#dc2626' }}>
                No se pudo cargar la config. Revisá tu API_URL.
              </ThemedText>
            ) : null}
            {appConfig ? (
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
            ) : null}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}
