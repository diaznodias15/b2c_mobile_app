import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppTabs from '@/components/app-tabs';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { HomeSearchBar } from '@/features/home/components/HomeSearchBar';
import { AdvertisingCarousel } from '@/features/home/components/AdvertisingCarousel';
import { TopProductsCarousel } from '@/features/home/components/TopProductsCarousel';
import { DepartmentBento } from '@/features/home/components/DepartmentBento';
import { DeliveryBanner } from '@/features/home/components/DeliveryBanner';
import { HomeFooter } from '@/features/home/components/HomeFooter';

/**
 * Pantalla de Inicio (rediseño Soft).
 *
 * Composicion vertical (post-bento):
 *   1. Header sticky (logo + selector de sede)
 *   2. Search entry (full-width tap → /search, NO search bar generico)
 *   3. Carrusel publicitario (autoplay 5s)
 *   4. Top products (scroll horizontal)
 *   5. DepartmentBento: primer departamento destacado (16:10) + resto
 *      en grilla 2x2 4:5
 *   6. Delivery banner con WhatsApp CTA (usa tx_whatsapp_contact_phone)
 *   7. Footer: nombre + RIF + direccion (whitelabel)
 *
 * Sin trust-signal rows, sin emojis, sin "o" dividers. Copy es-VE
 * especifico del whitelabel (Bs./USD, RIF, Zulia, etc.).
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
          <DepartmentBento
            title="Explora el catálogo"
            subtitle="Tocá un departamento para ver sus productos"
          />
          <DeliveryBanner />
          <HomeFooter />
        </ScrollView>
      </SafeAreaView>
      <AppTabs />
    </View>
  );
}
