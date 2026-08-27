import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { HomeSearchBar } from '@/features/home/components/HomeSearchBar';
import { AdvertisingCarousel } from '@/features/home/components/AdvertisingCarousel';
import { TopProductsCarousel } from '@/features/home/components/TopProductsCarousel';
import { DepartmentGrid } from '@/features/home/components/DepartmentGrid';
import { BenefitsList } from '@/features/home/components/BenefitsList';
import { DeliveryBanner } from '@/features/home/components/DeliveryBanner';

/**
 * Pantalla de Inicio.
 *
 * Composición vertical:
 *   1. Header sticky (logo + selector de sede)
 *   2. Search bar (lleva a /search)
 *   3. Carrusel publicitario (autoplay 5s)
 *   4. Top products (scroll horizontal)
 *   5. Grid 2x de departamentos
 *   6. Lista de beneficios (es-VE)
 *   7. Banner "Entrega segura" con ciudad/estado
 *
 * AppTabs se monta al final porque cada tab es una ruta
 * independiente y el root layout es un Stack, no un Tab.
 */
export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <HomeHeader />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <HomeSearchBar />
          <AdvertisingCarousel />
          <TopProductsCarousel />
          <DepartmentGrid />
          <BenefitsList />
          <DeliveryBanner />
        </ScrollView>
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}
