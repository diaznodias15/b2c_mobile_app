import { useState } from 'react';
import { Dimensions, FlatList, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import { Carousel, Pagination } from 'react-native-reanimated-carousel';

import { Footer } from '@/components/Footer';
import { Skeleton } from '@/components/Skeleton';
import { useRefreshControl } from '@/hooks/useRefreshControl';
import { useSafePush } from '@/hooks/useSafePush';
import { useAdvertisingStore } from '@/store/advertising.store';
import { useThemeColors } from '@/store/config.store';
import { useDepartmentStore } from '@/store/department.store';
import type { ThemeColors } from '@/theme/colors';
import type { Advertising } from '@/types/whitelabel';

import { BottomTabs } from '../components/bottom-tabs';
import { BrandsMarquee } from '../components/BrandsMarquee';
import { DeliveryBanner } from '../components/DeliveryBanner';
import { DepartmentCard } from '../components/DepartmentCard';
import { DepartmentChips } from '../components/DepartmentChips';
import { HomeNavbar } from '../components/HomeNavbar';
import { SectionHeader } from '../components/SectionHeader';
import { TopProducts } from '../components/TopProducts';
import { WhyChooseUs } from '../components/WhyChooseUs';
import { Txt } from '../ui/Txt';

const SCREEN_WIDTH = Dimensions.get('window').width;
/** La publicidad mobile de la API (`tx_img_url_mobile`) viene en formato 1:1. Margen de 16 a cada lado. */
const BANNER_SIZE = SCREEN_WIDTH - 32;

/** Banner del carrusel con skeleton propio mientras carga su imagen. */
function AdvertisingBanner({ item, colors }: { item: Advertising; colors: ThemeColors }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={{ width: '100%', height: '100%' }}>
      {!loaded && (
        <Skeleton width="100%" height="100%" borderRadius={18} colors={colors} style={{ position: 'absolute' }} />
      )}
      <Image
        source={{ uri: item.tx_img_url_mobile }}
        style={{ width: '100%', height: '100%', borderRadius: 18, backgroundColor: colors.section }}
        contentFit="cover"
        accessibilityLabel={item.nb_advertising}
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
}

/**
 * Home del rediseño. Mismas fuentes de datos y mismo orden de bloques que `index.tsx` (navbar fija
 * fuera del scroll → publicidad → más vendidos → departamentos → por qué elegirnos → entrega →
 * marcas → pie), con la presentación y la navegación pensadas para comprar:
 *
 *  - **Accesos rápidos a departamentos** (chips) bajo la navbar: llegar a un listado cuesta un
 *    toque desde la primera pantalla, no un scroll hasta la cuadrícula.
 *  - Margen lateral de 16 (era 24) en todos los bloques, incluidos banner y cuadrícula.
 *  - Títulos de sección alineados a la izquierda, con "Ver todos" donde hay una vista a la que ir.
 *  - Estado vacío de departamentos con texto de 14 px y tono de ayuda.
 *
 * El banner sigue siendo 1:1 (así lo manda la API y recortarlo tapa el texto de las promociones).
 */
export default function HomeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const advertising = useAdvertisingStore((s) => s.advertising);
  const departments = useDepartmentStore((s) => s.departments);
  const push = useSafePush();
  const carouselProgress = useSharedValue(0);
  const refreshControl = useRefreshControl();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HomeNavbar colors={colors} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <DepartmentChips colors={colors} />

        {advertising.length > 0 && (
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Carousel
              style={{ width: BANNER_SIZE, height: BANNER_SIZE }}
              data={advertising}
              loop={advertising.length > 1}
              autoplay={advertising.length > 1}
              autoplayInterval={4500}
              // El carrusel cubre casi toda la primera pantalla: sin esto su Pan captura también los
              // arrastres verticales y el pull-to-refresh del ScrollView nunca arranca si el dedo
              // empieza sobre el banner. Solo se activa con gestos horizontales.
              onConfigurePanGesture={(gesture) => {
                gesture.activeOffsetX([-10, 10]).failOffsetY([-10, 10]);
              }}
              onProgressChange={(p) => {
                carouselProgress.value = p;
              }}
              renderItem={({ item }) => <AdvertisingBanner item={item} colors={colors} />}
            />
            {advertising.length > 1 && (
              <Pagination
                count={advertising.length}
                progress={carouselProgress}
                containerStyle={{ gap: 6, marginTop: 10 }}
                dotStyle={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border }}
                activeDotStyle={{ backgroundColor: colors.primary }}
              />
            )}
          </View>
        )}

        <TopProducts colors={colors} />

        <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
          <SectionHeader
            title="Departamentos"
            subtitle="Todo lo que necesitas organizado para tu comodidad."
            colors={colors}
            actionLabel="Ver todos"
            onAction={() => router.replace('/departments')}
          />
        </View>

        {departments.length > 0 ? (
          <FlatList
            data={departments}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            columnWrapperStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <DepartmentCard
                department={item}
                colors={colors}
                onPress={() => push(`/products/${item.tx_slug}`)}
              />
            )}
          />
        ) : (
          <View style={{ paddingHorizontal: 16 }}>
            <Txt variant="body" color="muted" colors={colors}>
              Todavía no hay departamentos cargados. Desliza hacia abajo para actualizar.
            </Txt>
          </View>
        )}

        <WhyChooseUs colors={colors} />

        <DeliveryBanner colors={colors} />

        <BrandsMarquee colors={colors} />

        <Footer colors={colors} />
      </ScrollView>
      <BottomTabs />
    </View>
  );
}
