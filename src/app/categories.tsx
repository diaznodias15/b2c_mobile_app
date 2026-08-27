import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { DepartmentGrid } from '@/features/home/components/DepartmentGrid';

/**
 * Pantalla de Categorías (Fase 2).
 * Es un duplicado del grid del Home, sin secciones de marketing,
 * para que el usuario pueda llegar directo al catálogo.
 *
 * En Fase 3+ lo diferenciamos (sidebar de subcategorías, filtros).
 */
export default function CategoriesScreen() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-4 pt-3 pb-1">
          <Text className="text-xl font-bold text-foreground">
            Categorías
          </Text>
          <Text className="text-xs text-muted mt-0.5">
            Tocá un departamento para ver sus productos
          </Text>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <DepartmentGrid title="" />
        </ScrollView>
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}
