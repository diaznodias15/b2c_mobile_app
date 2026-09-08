import { Dimensions, FlatList, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import { Carousel, Pagination } from 'react-native-reanimated-carousel';

import { BottomTabs } from '@/components/bottom-tabs';
import { BrandsMarquee } from '@/components/BrandsMarquee';
import { DeliveryBanner } from '@/components/DeliveryBanner';
import { DepartmentCard } from '@/components/DepartmentCard';
import { HomeNavbar } from '@/components/HomeNavbar';
import { SectionHeader } from '@/components/SectionHeader';
import { TopProducts } from '@/components/TopProducts';
import { WhyChooseUs } from '@/components/WhyChooseUs';
import { useThemeColors } from '@/store/config.store';
import { useAdvertisingStore } from '@/store/advertising.store';
import { useDepartmentStore } from '@/store/department.store';

const SCREEN_WIDTH = Dimensions.get('window').width;
/** La publicidad mobile de la API (`tx_img_url_mobile`) viene en formato 1:1. */
const BANNER_SIZE = SCREEN_WIDTH - 48;

export default function HomeScreen() {
  const colors = useThemeColors();
  const advertising = useAdvertisingStore((s) => s.advertising);
  const departments = useDepartmentStore((s) => s.departments);
  const router = useRouter();
  const carouselProgress = useSharedValue(0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <HomeNavbar colors={colors} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {advertising.length > 0 && (
          <View style={{ alignItems: 'center' }}>
            <Carousel
              style={{ width: BANNER_SIZE, height: BANNER_SIZE }}
              data={advertising}
              loop={advertising.length > 1}
              autoplay={advertising.length > 1}
              autoplayInterval={4500}
              onProgressChange={(p) => {
                carouselProgress.value = p;
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.tx_img_url_mobile }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 18,
                    backgroundColor: colors.section,
                  }}
                  contentFit="cover"
                />
              )}
            />
            {advertising.length > 1 && (
              <Pagination
                count={advertising.length}
                progress={carouselProgress}
                containerStyle={{ gap: 6, marginTop: 10 }}
                dotStyle={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.border,
                }}
                activeDotStyle={{ backgroundColor: colors.primary }}
              />
            )}
          </View>
        )}

        <TopProducts colors={colors} />

        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <SectionHeader
            title="Departamentos"
            subtitle="Todo lo que necesitas organizado para tu comodidad."
            colors={colors}
          />
        </View>

        {departments.length > 0 ? (
          <FlatList
            data={departments}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
            columnWrapperStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <DepartmentCard
                department={item}
                colors={colors}
                onPress={() => router.push('/departments')}
              />
            )}
          />
        ) : (
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>
              Todavía no hay departamentos cargados.
            </Text>
          </View>
        )}

        <WhyChooseUs colors={colors} />

        <DeliveryBanner colors={colors} />

        <BrandsMarquee colors={colors} />
      </ScrollView>
      <BottomTabs />
    </View>
  );
}
